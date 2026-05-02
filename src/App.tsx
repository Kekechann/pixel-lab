/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Edit3, Trash2, FolderPlus, Grid, Image as ImageIcon, Library, X } from 'lucide-react';
import { PHOTOS as INITIAL_PHOTOS, Photo, Album } from './types';
import Header from './components/Header';
import PhotoCard from './components/PhotoCard';
import PhotoDetail from './components/PhotoDetail';
import BulkPhotoEditor from './components/BulkPhotoEditor';
import AlbumList from './components/AlbumList';
import AddToAlbumModal from './components/AddToAlbumModal';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentTab, setCurrentTab] = useState<'Gallery' | 'Albums'>('Gallery');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);

  const filteredPhotos = useMemo(() => {
    let result = photos;
    if (currentTab === 'Albums' && selectedAlbumId) {
      result = photos.filter(p => p.albumIds?.includes(selectedAlbumId));
    }
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    return result;
  }, [selectedCategory, photos, currentTab, selectedAlbumId]);

  const handleAddPhoto = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handleUpdatePhoto = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
    setSelectedPhoto(updatedPhoto);
  };

  const handleBulkUpdate = (updatedPhotos: Photo[]) => {
    setPhotos(prev => {
      const updatedMap = new Map(updatedPhotos.map(p => [p.id, p]));
      return prev.map(p => updatedMap.has(p.id) ? updatedMap.get(p.id)! : p);
    });
    setIsBulkEditing(false);
    setIsSelectionMode(false);
    setSelectedPhotoIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === filteredPhotos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(filteredPhotos.map(p => p.id)));
    }
  };

  const togglePhotoSelection = (id: string) => {
    const next = new Set(selectedPhotoIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPhotoIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedPhotoIds.size === 0) return;
    
    const count = selectedPhotoIds.size;
    if (confirm(`Delete ${count} selected ${count === 1 ? 'photo' : 'photos'}?`)) {
      setPhotos(prev => prev.filter(p => !selectedPhotoIds.has(p.id)));
      setSelectedPhotoIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const selectedPhotos = useMemo(() => 
    photos.filter(p => selectedPhotoIds.has(p.id)),
    [photos, selectedPhotoIds]
  );

  const currentAlbum = useMemo(() => 
    albums.find(a => a.id === selectedAlbumId),
    [albums, selectedAlbumId]
  );

  const handleCreateAlbum = (albumTitle: string) => {
    const ids: string[] = Array.from(selectedPhotoIds);
    const albumId = Math.random().toString(36).substring(2, 9);
    const newAlbum: Album = {
      id: albumId,
      title: albumTitle,
      dateCreated: new Date().toLocaleDateString(),
      coverId: ids.length > 0 ? ids[0] : undefined
    };
    setAlbums(prev => [...prev, newAlbum]);
    
    // If photos are selected, add them to the new album
    if (ids.length > 0) {
      setPhotos(prev => prev.map(p => {
        if (ids.includes(p.id)) {
          return { ...p, albumIds: [...(p.albumIds || []), newAlbum.id] };
        }
        return p;
      }));
      setIsSelectionMode(false);
      setSelectedPhotoIds(new Set());
    }
  };

  const handleAddToAlbum = (albumId: string) => {
    const ids = Array.from(selectedPhotoIds);
    setPhotos(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        const existing = p.albumIds || [];
        if (!existing.includes(albumId)) {
          return { ...p, albumIds: [...existing, albumId] };
        }
      }
      return p;
    }));
    setIsSelectionMode(false);
    setSelectedPhotoIds(new Set());
    setIsAddToAlbumOpen(false);
  };

  const handleDeleteAlbum = (albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    setPhotos(prev => prev.map(p => {
      if (p.albumIds?.includes(albumId)) {
        return { ...p, albumIds: p.albumIds.filter(id => id !== albumId) };
      }
      return p;
    }));
    if (selectedAlbumId === albumId) setSelectedAlbumId(null);
  };

  return (
    <div className="min-h-screen bg-ios-bg pb-20 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 mesh-bg opacity-40 -z-10" />

      <Header 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
        onUpload={handleAddPhoto}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          setSelectedPhotoIds(new Set());
        }}
        selectedCount={selectedPhotoIds.size}
        onDeleteSelected={handleDeleteSelected}
      />
      
      <main className="px-6 py-4 relative">
        {currentTab === 'Albums' && !selectedAlbumId ? (
          <AlbumList 
            albums={albums} 
            photos={photos} 
            onSelectAlbum={setSelectedAlbumId}
            onCreateAlbum={() => {
              const title = prompt('Enter album name:');
              if (title) handleCreateAlbum(title);
            }}
            onDeleteAlbum={handleDeleteAlbum}
          />
        ) : (
          <>
            {(isSelectionMode || selectedAlbumId) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-4 bg-white/5 p-4 rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-4">
                  {isSelectionMode && (
                    <button 
                      onClick={toggleSelectAll}
                      className="text-ios-blue font-bold text-sm"
                    >
                      {selectedPhotoIds.size === filteredPhotos.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                  {selectedAlbumId && (
                    <button 
                      onClick={() => setSelectedAlbumId(null)}
                      className="text-ios-blue font-bold text-sm flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>Exit Album</span>
                    </button>
                  )}
                  <span className="text-white/60 text-sm font-medium">
                    {isSelectionMode ? `${selectedPhotoIds.size} Selected` : currentAlbum?.title}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {isSelectionMode && (
                    <>
                      <button 
                        disabled={selectedPhotoIds.size === 0}
                        onClick={() => setIsAddToAlbumOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          selectedPhotoIds.size > 0 
                            ? 'bg-ios-blue/20 text-ios-blue border border-ios-blue/20' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Library size={16} />
                        <span className="hidden sm:inline">Add to Album</span>
                      </button>
                      <button 
                        disabled={selectedPhotoIds.size === 0}
                        onClick={() => {
                          const title = prompt('Enter new album name:');
                          if (title) handleCreateAlbum(title);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          selectedPhotoIds.size > 0 
                            ? 'bg-ios-blue/20 text-ios-blue border border-ios-blue/20' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <FolderPlus size={16} />
                        <span className="hidden sm:inline">New Album</span>
                      </button>
                      <button 
                        disabled={selectedPhotoIds.size === 0}
                        onClick={() => setIsBulkEditing(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          selectedPhotoIds.size > 0 
                            ? 'bg-ios-blue text-white' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Edit3 size={16} />
                        <span className="hidden sm:inline">Bulk Edit</span>
                      </button>
                      <button 
                        disabled={selectedPhotoIds.size === 0}
                        onClick={handleDeleteSelected}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          selectedPhotoIds.size > 0 
                            ? 'bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredPhotos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PhotoCard 
                      photo={photo} 
                      isSelected={selectedPhotoIds.has(photo.id)}
                      isSelectionMode={isSelectionMode}
                      onClick={(p) => {
                        if (isSelectionMode) {
                          togglePhotoSelection(p.id);
                        } else {
                          setSelectedPhoto(p);
                        }
                      }} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </main>

      <AnimatePresence>
        {isAddToAlbumOpen && (
          <AddToAlbumModal
            albums={albums}
            onClose={() => setIsAddToAlbumOpen(false)}
            onSelect={handleAddToAlbum}
          />
        )}
      </AnimatePresence>

      <PhotoDetail 
        photo={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
        onUpdate={handleUpdatePhoto}
        albums={albums}
      />

      <AnimatePresence>
        {isBulkEditing && (
          <BulkPhotoEditor
            photos={selectedPhotos}
            onClose={() => setIsBulkEditing(false)}
            onSave={handleBulkUpdate}
          />
        )}
      </AnimatePresence>

      {/* Frosted Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-dark px-8 flex items-center justify-around z-30">
        <TabItem 
          label="Gallery" 
          icon={<ImageIcon size={20} />} 
          active={currentTab === 'Gallery'} 
          onClick={() => {
            setCurrentTab('Gallery');
            setSelectedAlbumId(null);
          }}
        />
        <TabItem label="Search" icon={<Library size={20} />} />
        <TabItem 
          label="Albums" 
          icon={<Grid size={20} />} 
          active={currentTab === 'Albums'}
          onClick={() => {
            setCurrentTab('Albums');
            setSelectedAlbumId(null);
          }}
        />
        
        {/* iOS Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full" />
      </nav>
    </div>
  );
}

function TabItem({ label, icon, active = false, onClick }: { label: string; icon: any; active?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-1 group cursor-pointer"
    >
      <div className={`transition-all duration-300 ${active ? 'text-ios-blue' : 'text-ios-gray group-hover:text-white/60'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-ios-blue' : 'text-ios-gray'}`}>
        {label}
      </span>
    </div>
  );
}
