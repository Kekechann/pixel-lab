/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export default function PhotoCard({ photo, onClick, isSelected = false, isSelectionMode = false }: PhotoCardProps) {
  return (
    <motion.div
      layoutId={`card-${photo.id}`}
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(photo)}
      className={`relative aspect-[3/4] overflow-hidden rounded-ios cursor-pointer photo-shadow group border transition-all duration-300 ${
        isSelected ? 'border-ios-blue ring-4 ring-ios-blue/20 scale-[0.98]' : 'border-white/5'
      }`}
    >
      <motion.img
        layoutId={`img-${photo.id}`}
        src={photo.url}
        alt={photo.title}
        className={`h-full w-full object-cover transition-transform duration-700 ${
          isSelected ? 'scale-105 opacity-80' : 'group-hover:scale-110'
        }`}
      />
      
      {/* Selection Overlay */}
      {isSelectionMode && (
        <div className="absolute top-3 right-3 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-ios-blue border-ios-blue shadow-lg shadow-blue-500/40' 
              : 'bg-black/20 border-white/40 backdrop-blur-sm'
          }`}>
            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
          </div>
        </div>
      )}

      {!isSelectionMode && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <h3 className="text-white font-medium text-lg tracking-tight">{photo.title}</h3>
          <p className="text-white/60 text-sm">{photo.location}</p>
        </div>
      )}
    </motion.div>
  );
}
