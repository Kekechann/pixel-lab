/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PHOTOS as INITIAL_PHOTOS, Photo } from './types';
import Header from './components/Header';
import PhotoCard from './components/PhotoCard';
import PhotoDetail from './components/PhotoDetail';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'all') return photos;
    return photos.filter((p) => p.categoryId === selectedCategory);
  }, [selectedCategory, photos]);

  const handleAddPhoto = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handleUpdatePhoto = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
    setSelectedPhoto(updatedPhoto);
  };

  return (
    <div className="min-h-screen bg-ios-bg pb-20 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 mesh-bg opacity-40 -z-10" />

      <Header 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory} 
        onUpload={handleAddPhoto}
      />
      
      <main className="px-6 py-4 relative">
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
                  onClick={setSelectedPhoto} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <PhotoDetail 
        photo={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
        onUpdate={handleUpdatePhoto}
      />

      {/* Frosted Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-dark px-8 flex items-center justify-around z-30">
        <TabItem icon="Gallery" active />
        <TabItem icon="Search" />
        <TabItem icon="For You" />
        <TabItem icon="Albums" />
        
        {/* iOS Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full" />
      </nav>
    </div>
  );
}

function TabItem({ icon, active = false }: { icon: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 group cursor-pointer">
      <div className={`w-6 h-6 rounded-md ${active ? 'bg-ios-blue' : 'bg-ios-gray/30 group-hover:bg-ios-gray/50 transition-colors'}`} />
      <span className={`text-[10px] font-medium ${active ? 'text-ios-blue' : 'text-ios-gray'}`}>
        {icon}
      </span>
    </div>
  );
}
