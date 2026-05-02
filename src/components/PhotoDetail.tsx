/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Info, Edit3 } from 'lucide-react';
import { Photo } from '../types';
import { useState } from 'react';
import PhotoEditor from './PhotoEditor';

interface PhotoDetailProps {
  photo: Photo | null;
  onClose: () => void;
  onUpdate: (photo: Photo) => void;
}

export default function PhotoDetail({ photo, onClose, onUpdate }: PhotoDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveEdit = (newUrl: string) => {
    if (photo) {
      onUpdate({ ...photo, url: newUrl });
      setIsEditing(false);
    }
  };
  return (
    <AnimatePresence>
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            layoutId={`card-${photo.id}`}
            className="relative w-full max-w-2xl glass rounded-[40px] overflow-hidden photo-shadow flex flex-col border border-white/20"
          >
            <div className="relative aspect-[4/5] sm:aspect-video w-full overflow-hidden">
              <motion.img
                layoutId={`img-${photo.id}`}
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full glass hover:bg-white/20 transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">{photo.title}</h2>
                <div className="flex items-center gap-4 text-white/50">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span className="text-sm font-medium">{photo.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">{photo.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-ios-blue font-semibold">
                  <Info size={18} />
                  <span className="uppercase tracking-widest text-[10px] font-black">Details</span>
                </div>
                <p className="text-white/70 leading-relaxed text-sm">
                  {photo.description}
                </p>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-4 rounded-2xl glass text-white font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit3 size={20} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: photo.title,
                          text: photo.description,
                          url: photo.url,
                        });
                      } catch (error) {
                        console.error('Error sharing:', error);
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(photo.url);
                        alert('Link copied to clipboard!');
                      } catch (error) {
                        console.error('Error copying to clipboard:', error);
                      }
                    }
                  }}
                  className="flex-1 py-4 rounded-2xl bg-ios-blue text-white font-bold tracking-wide hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Share Photo
                </button>
                <button 
                  onClick={() => {
                    alert('Photo saved to your collection!');
                  }}
                  className="flex-1 py-4 rounded-2xl glass text-white font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {photo && isEditing && (
        <PhotoEditor 
          photo={photo} 
          onSave={handleSaveEdit} 
          onCancel={() => setIsEditing(false)} 
        />
      )}
    </AnimatePresence>
  );
}
