/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, Play } from 'lucide-react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

export default function PhotoCard({ photo, onClick, isSelected = false, isSelectionMode = false }: PhotoCardProps) {
  const isVideo = photo.mediaType === 'video';

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
      {isVideo ? (
        <>
          <video
            src={photo.url}
            poster={photo.thumbnailUrl}
            className={`h-full w-full object-cover transition-transform duration-700 ${
              isSelected ? 'scale-105 opacity-80' : 'group-hover:scale-110'
            }`}
            muted
            playsInline
            onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
            onMouseOut={(e) => {
              const v = e.target as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
          {!photo.thumbnailUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
              <Play size={24} fill="currentColor" />
            </div>
          )}
          {photo.thumbnailUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-3 rounded-full glass text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Play size={24} fill="currentColor" />
            </div>
          )}
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-[8px] font-black text-white/80 uppercase tracking-tighter">
            AI Video
          </div>
        </>
      ) : (
        <motion.img
          layoutId={`img-${photo.id}`}
          src={photo.url}
          alt={photo.title}
          className={`h-full w-full object-cover transition-transform duration-700 ${
            isSelected ? 'scale-105 opacity-80' : 'group-hover:scale-110'
          }`}
          referrerPolicy="no-referrer"
        />
      )}
      
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
