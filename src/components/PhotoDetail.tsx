/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Info, Edit3, Grid } from 'lucide-react';
import { Photo, Album } from '../types';
import { useState } from 'react';
import PhotoEditor from './PhotoEditor';

interface PhotoDetailProps {
  photo: Photo | null;
  onClose: () => void;
  onUpdate: (photo: Photo) => void;
  albums: Album[];
}

export default function PhotoDetail({ photo, onClose, onUpdate, albums }: PhotoDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editedTitle, setEditedTitle] = useState(photo?.title || '');
  const [editedLocation, setEditedLocation] = useState(photo?.location || '');
  const [editedDescription, setEditedDescription] = useState(photo?.description || '');

  const handleSaveEdit = (newUrl: string) => {
    if (photo) {
      onUpdate({ ...photo, url: newUrl });
      setIsEditing(false);
    }
  };

  const handleSaveMetadata = () => {
    if (photo) {
      onUpdate({
        ...photo,
        title: editedTitle,
        location: editedLocation,
        description: editedDescription,
      });
      setIsEditingMetadata(false);
    }
  };

  // Reset fields when photo changes or editing is cancelled
  useState(() => {
    if (photo) {
      setEditedTitle(photo.title);
      setEditedLocation(photo.location);
      setEditedDescription(photo.description);
    }
  });

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
              <div className="space-y-4">
                {isEditingMetadata ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-ios-blue transition-colors"
                      placeholder="Title"
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                        <MapPin size={16} className="text-white/50" />
                        <input
                          type="text"
                          value={editedLocation}
                          onChange={(e) => setEditedLocation(e.target.value)}
                          className="w-full bg-transparent text-white focus:outline-none"
                          placeholder="Location"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 opacity-50">
                        <Calendar size={16} className="text-white/50" />
                        <span className="text-sm text-white font-medium">{photo.date}</span>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-ios-blue font-semibold">
                    <Info size={18} />
                    <span className="uppercase tracking-widest text-[10px] font-black">Details</span>
                  </div>
                </div>
                {isEditingMetadata ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-ios-blue transition-colors min-h-[100px] resize-none"
                    placeholder="Describe this moment..."
                  />
                ) : (
                  <p className="text-white/70 leading-relaxed text-sm">
                    {photo.description}
                  </p>
                )}
              </div>

              {photo.albumIds && photo.albumIds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-ios-blue font-semibold">
                    <Grid size={18} />
                    <span className="uppercase tracking-widest text-[10px] font-black">Albums</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {photo.albumIds.map(id => {
                      const album = albums.find(a => a.id === id);
                      if (!album) return null;
                      return (
                        <div key={id} className="px-3 py-1 rounded-full glass text-[10px] font-bold text-white/80">
                          {album.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex flex-wrap gap-4">
                {isEditingMetadata ? (
                  <>
                    <button 
                      onClick={handleSaveMetadata}
                      className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold tracking-wide hover:brightness-110 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                    >
                      Save Info
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingMetadata(false);
                        setEditedTitle(photo.title);
                        setEditedLocation(photo.location);
                        setEditedDescription(photo.description);
                      }}
                      className="px-6 py-4 rounded-2xl glass text-white/60 font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-4 rounded-2xl glass text-white font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Edit3 size={20} />
                      <span className="hidden sm:inline">Edit Photo</span>
                    </button>
                    <button 
                      onClick={() => setIsEditingMetadata(true)}
                      className="px-6 py-4 rounded-2xl glass text-white font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Info size={20} />
                      <span className="hidden sm:inline">Edit Info</span>
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
                      Share
                    </button>
                  </>
                )}
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
