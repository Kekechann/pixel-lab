/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Edit3, Trash2, FolderPlus, Grid, Image as ImageIcon, Library, X, Sparkles, Search, Video } from 'lucide-react';
import { PHOTOS as INITIAL_PHOTOS, Photo, Album } from './types';
import Header from './components/Header';
import PhotoCard from './components/PhotoCard';
import PhotoDetail from './components/PhotoDetail';
import BulkPhotoEditor from './components/BulkPhotoEditor';
import AlbumList from './components/AlbumList';
import AddToAlbumModal from './components/AddToAlbumModal';
import CreateAlbumModal from './components/CreateAlbumModal';

import AIImageGenerator from './components/AIImageGenerator';
import AIVideoGenerator from './components/AIVideoGenerator';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentTab, setCurrentTab] = useState<'Gallery' | 'Albums' | 'AI Creator' | 'Video AI'>('Gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [backgroundPhotoUrl, setBackgroundPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const currentAlbum = useMemo(() => 
    albums.find(a => a.id === selectedAlbumId),
    [albums, selectedAlbumId]
  );

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const query = searchQuery.toLowerCase();
    return albums.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.description?.toLowerCase().includes(query)
    );
  }, [albums, searchQuery]);

  const headerTitle = useMemo(() => {
    if (selectedAlbumId) return currentAlbum?.title;
    if (currentTab === 'AI Creator') return 'AI Creator';
    if (currentTab === 'Video AI') return 'Veo Video AI';
    if (currentTab === 'Albums') return 'Albums';
    if (searchQuery) return 'Search Results';
    return 'All Photos';
  }, [currentTab, selectedAlbumId, currentAlbum, searchQuery]);

  const filteredPhotos = useMemo(() => {
    let result = photos;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) || 
        p.location.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (currentTab === 'Albums' && selectedAlbumId) {
      result = result.filter(p => p.albumIds?.includes(selectedAlbumId));
    }
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }
    return result;
  }, [selectedCategory, photos, currentTab, selectedAlbumId, searchQuery]);

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

  const handleCreateAlbum = (albumTitle: string, albumDescription: string) => {
    const ids: string[] = Array.from(selectedPhotoIds);
    const albumId = Math.random().toString(36).substring(2, 9);
    const newAlbum: Album = {
      id: albumId,
      title: albumTitle,
      description: albumDescription,
      dateCreated: new Date().toLocaleDateString(),
      coverId: ids.length > 0 ? ids[0] : undefined
    };
    setAlbums(prev => [...prev, newAlbum]);
    
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
    setIsCreateAlbumOpen(false);
  };

  const handleUpdateAlbum = (albumId: string, title: string, description: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, title, description } : a));
    setEditingAlbum(null);
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
      {/* Dynamic Background */}
      <AnimatePresence>
        {backgroundPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[-1] overflow-hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1.05],
                x: [0, -20, 20],
                y: [0, 10, -10]
              }}
              transition={{ 
                duration: 40, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-[-40px]"
            >
              <img 
                src={backgroundPhotoUrl} 
                className="w-full h-full object-cover blur-[80px] brightness-[0.35] saturate-[1.2]"
                alt=""
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: backgroundPhotoUrl ? 0.2 : 0.4,
          scale: backgroundPhotoUrl ? 1.1 : 1,
          rotate: backgroundPhotoUrl ? 2 : 0
        }}
        transition={{ duration: 2, ease: "circOut" }}
        className="fixed inset-0 mesh-bg -z-10 pointer-events-none" 
      />

      <Header 
        title={headerTitle}
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
        onUpload={handleAddPhoto}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchVisible={isSearchVisible}
        onSetSearchVisible={setIsSearchVisible}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          setSelectedPhotoIds(new Set());
        }}
        selectedCount={selectedPhotoIds.size}
        onDeleteSelected={handleDeleteSelected}
      />
      
      <main className="px-6 py-4 relative">
        {currentTab === 'AI Creator' ? (
          <AIImageGenerator onSave={handleAddPhoto} />
        ) : currentTab === 'Video AI' ? (
          <AIVideoGenerator onSave={handleAddPhoto} />
        ) : currentTab === 'Albums' && !selectedAlbumId ? (
          <AlbumList 
            albums={filteredAlbums} 
            photos={photos} 
            onSelectAlbum={setSelectedAlbumId}
            onCreateAlbum={() => setIsCreateAlbumOpen(true)}
            onDeleteAlbum={handleDeleteAlbum}
            onEditAlbum={setEditingAlbum}
          />
        ) : (
          <>
            {(isSelectionMode || selectedAlbumId || searchQuery) && (
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
                  {(selectedAlbumId || searchQuery) && (
                    <button 
                      onClick={() => {
                        setSelectedAlbumId(null);
                        setSearchQuery('');
                      }}
                      className="text-ios-blue font-bold text-sm flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>{searchQuery ? 'Clear Search' : 'Exit Album'}</span>
                    </button>
                  )}
                  <span className="text-white/60 text-sm font-medium">
                    {isSelectionMode ? `${selectedPhotoIds.size} Selected` : (searchQuery ? `${filteredPhotos.length} results` : currentAlbum?.title)}
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
                        onClick={() => setIsCreateAlbumOpen(true)}
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
            
            {filteredPhotos.length === 0 && searchQuery && (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
                <Search size={48} />
                <p className="text-xl font-bold">No photos found for "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {isCreateAlbumOpen && (
          <CreateAlbumModal
            onClose={() => setIsCreateAlbumOpen(false)}
            onSave={handleCreateAlbum}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingAlbum && (
          <CreateAlbumModal
            album={editingAlbum}
            onClose={() => setEditingAlbum(null)}
            onSave={(title, description) => handleUpdateAlbum(editingAlbum.id, title, description)}
          />
        )}
      </AnimatePresence>

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
        onSetBackground={(url) => setBackgroundPhotoUrl(url)}
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
          active={currentTab === 'Gallery' && !isSearchVisible} 
          onClick={() => {
            setCurrentTab('Gallery');
            setSelectedAlbumId(null);
            setIsSearchVisible(false);
          }}
        />
        <TabItem 
          label="Search" 
          icon={<Search size={20} />} 
          active={isSearchVisible}
          onClick={() => {
            setIsSearchVisible(true);
            setCurrentTab('Gallery');
            setSelectedAlbumId(null);
          }}
        />
        <TabItem 
          label="Generate" 
          icon={<Sparkles size={20} />} 
          active={currentTab === 'AI Creator'}
          onClick={() => {
            setCurrentTab('AI Creator');
            setSelectedAlbumId(null);
            setIsSearchVisible(false);
          }}
        />
        <TabItem 
          label="Video AI" 
          icon={<Video size={20} />} 
          active={currentTab === 'Video AI'}
          onClick={() => {
            setCurrentTab('Video AI');
            setSelectedAlbumId(null);
            setIsSearchVisible(false);
          }}
        />
        <TabItem 
          label="Albums" 
          icon={<Grid size={20} />} 
          active={currentTab === 'Albums'}
          onClick={() => {
            setCurrentTab('Albums');
            setSelectedAlbumId(null);
            setIsSearchVisible(false);
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
