/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, SyntheticEvent } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, RotateCcw, RotateCw, Check, Sun, Contrast, Droplets, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Photo } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface PhotoEditorProps {
  photo: Photo;
  onSave: (url: string) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ photo, onSave, onCancel }: PhotoEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const presets = [
    { name: '1:1', value: 1 },
    { name: '4:3', value: 4 / 3 },
    { name: '16:9', value: 16 / 9 },
    { name: 'Original', value: undefined },
  ];

  const filters = [
    { id: 'none', name: 'Original', value: '' },
    { id: 'vivid', name: 'Vivid', value: 'saturate(150%) contrast(110%)' },
    { id: 'mono', name: 'Mono', value: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', value: 'sepia(100%)' },
    { id: 'invert', name: 'Invert', value: 'invert(100%)' },
  ];
  
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialAspect = 16 / 9;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        initialAspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          newAspect || (width / height),
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  };

  const handleAutoEnhance = async () => {
    setIsEnhancing(true);
    try {
      let imageData = photo.url;
      
      if (!imageData.startsWith('data:')) {
        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('CORS prevents direct image analysis. Falling back to heuristic enhancement.', e);
          setBrightness(105);
          setContrast(115);
          setSaturation(110);
          setIsEnhancing(false);
          return;
        }
      }

      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.split(';')[0].split(':')[1];

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              },
              {
                text: "Analyze this image and suggest the best brightness, contrast, and saturation percentages (0-200) to make it look professionally enhanced. Return ONLY a JSON object with keys 'brightness', 'contrast', and 'saturation'."
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brightness: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER }
            },
            required: ["brightness", "contrast", "saturation"]
          }
        }
      });

      const suggestions = JSON.parse(result.text);
      setBrightness(suggestions.brightness);
      setContrast(suggestions.contrast);
      setSaturation(suggestions.saturation);
    } catch (error) {
      console.error('Auto-enhance failed:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const currentFilterValue = filters.find(f => f.id === selectedFilter)?.value || '';
  const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${currentFilterValue}`;

  const handleSave = () => {
    const image = imgRef.current;
    if (!image || !crop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Use completedCrop if available, otherwise use crop
    const targetCrop = completedCrop || (crop as PixelCrop);

    canvas.width = targetCrop.width * scaleX;
    canvas.height = targetCrop.height * scaleY;

    ctx.filter = filterString;
    
    // Support rotation in crop is complex, so we'll apply filters first
    ctx.save();
    
    // We create an offscreen canvas to handle the filtered full image first
    const fullCanvas = document.createElement('canvas');
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return;

    if (rotation % 180 === 0) {
      fullCanvas.width = image.naturalWidth;
      fullCanvas.height = image.naturalHeight;
    } else {
      fullCanvas.width = image.naturalHeight;
      fullCanvas.height = image.naturalWidth;
    }

    fullCtx.filter = filterString;
    fullCtx.translate(fullCanvas.width / 2, fullCanvas.height / 2);
    fullCtx.rotate((rotation * Math.PI) / 180);
    fullCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Now draw the cropped portion from the fullCanvas to our result canvas
    // Note: We're simplifying here to match what's visible in the UI container
    ctx.drawImage(
      fullCanvas,
      targetCrop.x * scaleX,
      targetCrop.y * scaleY,
      targetCrop.width * scaleX,
      targetCrop.height * scaleY,
      0,
      0,
      targetCrop.width * scaleX,
      targetCrop.height * scaleY
    );

    const finalUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(finalUrl);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 glass border-b border-white/10">
        <button onClick={onCancel} className="text-white/60 hover:text-white flex items-center gap-2">
          <X size={20} />
          <span>Cancel</span>
        </button>
        <h2 className="font-bold text-white">Edit Photo</h2>
        <button onClick={handleSave} className="text-ios-blue font-bold flex items-center gap-2 transition-transform active:scale-95">
          <Check size={20} />
          <span>Done</span>
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-black/50">
        <div className="relative max-w-full max-h-full">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={photo.url}
              alt="Edit target"
              onLoad={onImageLoad}
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: filterString,
                maxWidth: '100%',
                maxHeight: '100%',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.1s ease'
              }}
            />
          </ReactCrop>
        </div>
      </main>

      <footer className="h-auto glass-dark flex flex-col p-6 gap-6 relative z-10 transition-all duration-300">
        <div className="flex gap-4 justify-center">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAspectChange(p.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                aspect === p.value 
                  ? 'bg-ios-blue border-ios-blue text-white' 
                  : 'glass border-white/10 text-white/60'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Filters Carousel */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className="flex flex-col items-center gap-2 group min-w-[70px]"
            >
              <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                selectedFilter === f.id ? 'border-ios-blue scale-105' : 'border-white/10 opacity-70 group-hover:opacity-100'
              }`}>
                <img 
                  src={photo.url} 
                  className="w-full h-full object-cover" 
                  style={{ filter: f.value }}
                />
              </div>
              <span className={`text-[10px] font-bold tracking-wide uppercase transition-colors ${
                selectedFilter === f.id ? 'text-ios-blue' : 'text-white/40'
              }`}>
                {f.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={() => setRotation(r => r - 90)}
              className="p-3 rounded-full glass hover:bg-white/10 transition-colors active:scale-90"
              title="Rotate 90° Left"
            >
              <RotateCcw size={20} className="text-white" />
            </button>
            <button 
              onClick={() => setRotation(r => r + 180)}
              className="px-4 py-3 rounded-full glass hover:bg-white/10 transition-colors active:scale-90 text-white text-[10px] font-bold"
              title="Rotate 180°"
            >
              180°
            </button>
            <button 
              onClick={() => setRotation(r => r + 90)}
              className="p-3 rounded-full glass hover:bg-white/10 transition-colors active:scale-90"
              title="Rotate 90° Right"
            >
              <RotateCw size={20} className="text-white" />
            </button>
          </div>

          <button 
            onClick={handleAutoEnhance}
            disabled={isEnhancing}
            className={`px-6 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm transition-all ${
              isEnhancing 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-ios-blue text-white shadow-lg shadow-blue-500/20 active:scale-95 hover:brightness-110'
            }`}
          >
            {isEnhancing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>{isEnhancing ? 'Analyzing...' : 'Auto-Enhance'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg glass text-white/60">
              <Sun size={16} />
            </div>
            <input 
              type="range" min="0" max="200" value={brightness} 
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono text-white/40 min-w-[3ch] text-right">{Math.round(brightness)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg glass text-white/60">
              <Contrast size={16} />
            </div>
            <input 
              type="range" min="0" max="200" value={contrast} 
              onChange={(e) => setContrast(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono text-white/40 min-w-[3ch] text-right">{Math.round(contrast)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg glass text-white/60">
              <Droplets size={16} />
            </div>
            <input 
              type="range" min="0" max="200" value={saturation} 
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono text-white/40 min-w-[3ch] text-right">{Math.round(saturation)}%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

