/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Plus, Folder, Trash2, Edit2, Image as ImageIcon, X, Check, ArrowUpDown } from 'lucide-react';
import { Album, Photo } from '../types';
import { useState, useMemo } from 'react';

type SortOption = 'title' | 'date' | 'count';

interface AlbumListProps {
  albums: Album[];
  photos: Photo[];
  onSelectAlbum: (id: string) => void;
  onCreateAlbum: () => void;
  onDeleteAlbum: (id: string) => void;
  onEditAlbum: (album: Album) => void;
  onUpdateAlbumCover: (albumId: string, photoId: string) => void;
}

export default function AlbumList({ albums, photos, onSelectAlbum, onCreateAlbum, onDeleteAlbum, onEditAlbum, onUpdateAlbumCover }: AlbumListProps) {
  const [selectingCoverFor, setSelectingCoverFor] = useState<Album | null>(null);
  const [confirmingDeleteFor, setConfirmingDeleteFor] = useState<Album | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');

  const albumPhotos = (albumId: string) => photos.filter(p => p.albumIds?.includes(albumId));

  const sortedAlbums = useMemo(() => {
    return [...albums].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'date') {
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      }
      if (sortBy === 'count') {
        const countA = photos.filter(p => p.albumIds?.includes(a.id)).length;
        const countB = photos.filter(p => p.albumIds?.includes(b.id)).length;
        return countB - countA;
      }
      return 0;
    });
  }, [albums, sortBy, photos]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <h2 className="text-2xl font-bold text-white">My Albums</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
            <ArrowUpDown size={14} className="text-white/40" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="date" className="bg-ios-bg">Recently Created</option>
              <option value="title" className="bg-ios-bg">Alphabetical</option>
              <option value="count" className="bg-ios-bg">Most Photos</option>
            </select>
          </div>

          <button 
            onClick={onCreateAlbum}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ios-blue text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Album</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {sortedAlbums.map((album) => {
          const currentAlbumPhotos = albumPhotos(album.id);
          const coverPhoto = photos.find(p => p.id === album.coverId) || currentAlbumPhotos[0];

          return (
            <motion.div
              key={album.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectAlbum(album.id)}
              className="flex flex-col gap-3 cursor-pointer group"
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shadow-xl">
                {coverPhoto ? (
                  <img 
                    src={coverPhoto.url} 
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Folder size={40} />
                  </div>
                )}
                
                {/* Photo Count Badge */}
                <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-[8px] font-black text-white/80 uppercase tracking-tighter">
                  {currentAlbumPhotos.length} {currentAlbumPhotos.length === 1 ? 'Item' : 'Items'}
                </div>

                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectingCoverFor(album);
                    }}
                    title="Change Cover"
                    className="p-2 rounded-full glass text-white/40 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAlbum(album);
                    }}
                    className="p-2 rounded-full glass text-white/40 hover:text-ios-blue hover:bg-ios-blue/10 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingDeleteFor(album);
                    }}
                    className="p-2 rounded-full glass text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm truncate">{album.title}</h3>
                {album.description && (
                  <p className="text-white/40 text-xs line-clamp-2 mb-1">{album.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-white/40 text-[10px]">{currentAlbumPhotos.length} Photos</p>
                  <span className="text-white/20 text-[10px]">•</span>
                  <p className="text-white/40 text-[10px]">{album.dateCreated}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty state prompt if no albums */}
        {albums.length === 0 && (
          <div 
            onClick={onCreateAlbum}
            className="col-span-full py-20 flex flex-col items-center justify-center gap-4 glass rounded-3xl border-2 border-dashed border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-ios-blue/10 flex items-center justify-center text-ios-blue">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Create your first album</p>
              <p className="text-white/40 text-sm">Organize your favorite moments</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmingDeleteFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setConfirmingDeleteFor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-dark rounded-[32px] border border-white/10 p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Album?</h2>
              <p className="text-white/40 text-sm mb-8">
                Are you sure you want to delete <span className="text-white font-medium">"{confirmingDeleteFor.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onDeleteAlbum(confirmingDeleteFor.id);
                    setConfirmingDeleteFor(null);
                  }}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors active:scale-95"
                >
                  Delete Album
                </button>
                <button
                  onClick={() => setConfirmingDeleteFor(null)}
                  className="w-full py-4 rounded-2xl glass text-white font-bold hover:bg-white/5 transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectingCoverFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectingCoverFor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl glass-dark rounded-[40px] border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="p-8 flex items-center justify-between border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-bold text-white">Select Album Cover</h2>
                  <p className="text-white/40 text-sm mt-1">Choose a photo from "{selectingCoverFor.title}"</p>
                </div>
                <button 
                  onClick={() => setSelectingCoverFor(null)}
                  className="p-3 glass rounded-full text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {albumPhotos(selectingCoverFor.id).length === 0 ? (
                  <div className="py-20 text-center text-white/30 italic">
                    Add photos to this album first to select a cover.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {albumPhotos(selectingCoverFor.id).map((photo) => {
                      const isCurrentCover = photo.id === selectingCoverFor.coverId || 
                        (!selectingCoverFor.coverId && albumPhotos(selectingCoverFor.id)[0].id === photo.id);
                      
                      return (
                        <div
                          key={photo.id}
                          onClick={() => {
                            onUpdateAlbumCover(selectingCoverFor.id, photo.id);
                            setSelectingCoverFor(null);
                          }}
                          className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer group ring-offset-4 ring-offset-black transition-all ${
                            isCurrentCover ? 'ring-4 ring-ios-blue' : 'hover:ring-4 hover:ring-white/20'
                          }`}
                        >
                          <img 
                            src={photo.url} 
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          {isCurrentCover && (
                            <div className="absolute inset-0 bg-ios-blue/20 flex items-center justify-center">
                              <div className="bg-ios-blue text-white p-2 rounded-full shadow-lg">
                                <Check size={20} />
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <footer className="p-8 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setSelectingCoverFor(null)}
                  className="px-8 py-3 rounded-2xl glass text-white font-bold hover:bg-white/10 transition-all"
                >
                  Done
                </button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
