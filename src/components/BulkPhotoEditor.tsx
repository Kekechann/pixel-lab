/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, RotateCcw, RotateCw, Sun, Contrast, Droplets } from 'lucide-react';
import { Photo } from '../types';

interface BulkPhotoEditorProps {
  photos: Photo[];
  onClose: () => void;
  onSave: (updatedPhotos: Photo[]) => void;
}

export default function BulkPhotoEditor({ photos, onClose, onSave }: BulkPhotoEditorProps) {
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const filters = [
    { id: 'none', name: 'Original', value: '' },
    { id: 'vivid', name: 'Vivid', value: 'saturate(150%) contrast(110%)' },
    { id: 'mono', name: 'Mono', value: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', value: 'sepia(100%)' },
    { id: 'invert', name: 'Invert', value: 'invert(100%)' },
  ];

  const currentFilterValue = filters.find(f => f.id === selectedFilter)?.value || '';
  const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${currentFilterValue}`;

  const processImage = async (photo: Photo): Promise<Photo> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(photo);
          return;
        }

        const normRotation = (rotation % 360 + 360) % 360;
        const isSideways = normRotation === 90 || normRotation === 270;
        
        const tWidth = isSideways ? img.naturalHeight : img.naturalWidth;
        const tHeight = isSideways ? img.naturalWidth : img.naturalHeight;

        canvas.width = tWidth;
        canvas.height = tHeight;

        ctx.filter = filterString;
        ctx.translate(tWidth / 2, tHeight / 2);
        ctx.rotate((normRotation * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        resolve({
          ...photo,
          url: canvas.toDataURL('image/jpeg', 0.9)
        });
      };
      img.onerror = () => resolve(photo);
      img.src = photo.url;
    });
  };

  const handleApplyAll = async () => {
    setIsProcessing(true);
    const updated = await Promise.all(photos.map(p => processImage(p)));
    onSave(updated);
    setIsProcessing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col pt-12"
    >
      <header className="px-6 pb-6 flex items-center justify-between">
        <button onClick={onClose} className="p-2 glass rounded-full text-white">
          <X size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-white font-bold">Bulk Editor</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-black">
            {photos.length} Photos Selected
          </p>
        </div>
        <button 
          onClick={handleApplyAll} 
          disabled={isProcessing}
          className="text-ios-blue font-bold flex items-center gap-2 group disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <Check size={20} />
              <span>Apply All</span>
            </>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Preview Strip */}
        <div className="flex gap-4 p-8 overflow-x-auto no-scrollbar items-center justify-center flex-1">
          {photos.slice(0, 5).map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-[3/4] h-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img 
                src={photo.url} 
                className="w-full h-full object-cover transition-all duration-300"
                style={{ 
                  filter: filterString,
                  transform: `rotate(${rotation}deg)` 
                }}
              />
            </motion.div>
          ))}
          {photos.length > 5 && (
            <div className="w-24 h-64 glass rounded-2xl flex items-center justify-center text-white/40 font-bold border border-white/5 shrink-0">
              +{photos.length - 5}
            </div>
          )}
        </div>
      </main>

      <footer className="glass-dark p-8 pb-12 space-y-8">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 justify-center">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className="flex flex-col items-center gap-2 group min-w-[70px]"
            >
              <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                selectedFilter === f.id ? 'border-ios-blue scale-105' : 'border-white/10 opacity-70 group-hover:opacity-100'
              }`}>
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${photos[0]?.url})`,
                    filter: f.value 
                  }}
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

        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setRotation(r => r - 45)}
            className="p-3 rounded-full glass hover:bg-white/10 active:scale-90 transition-all"
          >
            <RotateCcw size={20} className="text-white" />
          </button>
          <button 
            onClick={() => setRotation(r => r + 180)}
            className="px-4 py-3 rounded-full glass hover:bg-white/10 active:scale-90 transition-all text-white text-[10px] font-bold"
          >
            180°
          </button>
          <button 
            onClick={() => setRotation(r => r + 45)}
            className="p-3 rounded-full glass hover:bg-white/10 active:scale-90 transition-all"
          >
            <RotateCw size={20} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Sun size={18} className="text-white/40" />
            <input 
              type="range" min="0" max="200" value={brightness} 
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-4">
            <Contrast size={18} className="text-white/40" />
            <input 
              type="range" min="0" max="200" value={contrast} 
              onChange={(e) => setContrast(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-4">
            <Droplets size={18} className="text-white/40" />
            <input 
              type="range" min="0" max="200" value={saturation} 
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="flex-1 accent-ios-blue h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
