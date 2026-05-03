/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, SyntheticEvent } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, RotateCcw, RotateCw, Check, Sun, Contrast, Droplets, Sparkles, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { motion } from 'motion/react';
import { Photo } from '../types';
import { useAI } from './AIVideoGenerator';

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
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(photo.url);

  const { analyzeImage, upscaleImage } = useAI();

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
      let imageData = currentImageUrl;
      
      if (!imageData.startsWith('data:')) {
        try {
          const response = await fetch(currentImageUrl);
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

      const suggestions = await analyzeImage(base64Data, mimeType);
      setBrightness(suggestions.brightness);
      setContrast(suggestions.contrast);
      setSaturation(suggestions.saturation);
    } catch (error) {
      console.error('Auto-enhance failed:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUpscale = async () => {
    if (isUpscaling) return;
    setIsUpscaling(true);
    
    try {
      let imageData = currentImageUrl;
      
      if (!imageData.startsWith('data:')) {
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.split(';')[0].split(':')[1];

      const newImageUrl = await upscaleImage(base64Data, mimeType);
      setCurrentImageUrl(newImageUrl);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    } catch (error) {
      console.error('Upscale failed:', error);
      alert('Failed to upscale image. Please try again.');
    } finally {
      setIsUpscaling(false);
    }
  };

  const currentFilterValue = filters.find(f => f.id === selectedFilter)?.value || '';
  const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${currentFilterValue}`;

  const handleSave = () => {
    const image = imgRef.current;
    if (!image || !crop) return;

    const targetCrop = completedCrop || (crop as PixelCrop);

    // 1. Create a full-size transformation canvas
    const transformCanvas = document.createElement('canvas');
    const transformCtx = transformCanvas.getContext('2d');
    if (!transformCtx) return;

    // Normalize rotation
    const normRotation = (rotation % 360 + 360) % 360;
    const isSideways = normRotation === 90 || normRotation === 270;

    // Physical dimensions of the rotated image
    const tWidth = isSideways ? image.naturalHeight : image.naturalWidth;
    const tHeight = isSideways ? image.naturalWidth : image.naturalHeight;

    transformCanvas.width = tWidth;
    transformCanvas.height = tHeight;

    // Apply global filters and rotation
    transformCtx.filter = filterString;
    transformCtx.translate(tWidth / 2, tHeight / 2);
    transformCtx.rotate((normRotation * Math.PI) / 180);
    transformCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // 2. Map visual crop to physical pixels
    // We use the image's current rendered dimensions to calculate scale
    const scaleX = tWidth / (isSideways ? image.height : image.width);
    const scaleY = tHeight / (isSideways ? image.width : image.height);

    // 3. Create final cropped canvas
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCanvas.width = targetCrop.width * scaleX;
    finalCanvas.height = targetCrop.height * scaleY;

    finalCtx.drawImage(
      transformCanvas,
      targetCrop.x * scaleX,
      targetCrop.y * scaleY,
      targetCrop.width * scaleX,
      targetCrop.height * scaleY,
      0,
      0,
      finalCanvas.width,
      finalCanvas.height
    );

    const finalUrl = finalCanvas.toDataURL('image/jpeg', 0.9);
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

      <main className={`flex-1 overflow-${scale > 1 ? 'auto' : 'hidden'} flex items-center justify-center p-8 bg-black/50 relative`}>
        <div 
          className="relative transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={currentImageUrl}
              alt="Edit target"
              onLoad={onImageLoad}
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: filterString,
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: 'auto',
                height: 'auto',
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
                  src={currentImageUrl} 
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

          <div className="flex gap-2">
            <button 
              onClick={handleUpscale}
              disabled={isUpscaling}
              className={`px-6 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm transition-all ${
                isUpscaling 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 active:scale-95 hover:brightness-110'
              }`}
            >
              {isUpscaling ? <Loader2 size={18} className="animate-spin" /> : <Maximize size={18} />}
              <span>{isUpscaling ? 'Upscaling...' : 'AI Upscale (4K)'}</span>
            </button>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg glass text-white/60 hover:text-white"
            >
              <ZoomOut size={16} />
            </button>
            <input 
              type="range" min="0.5" max="3" step="0.1" value={scale} 
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
            <button 
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg glass text-white/60 hover:text-white"
            >
              <ZoomIn size={16} />
            </button>
          </div>
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
