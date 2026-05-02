/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Plus, X as CloseIcon } from 'lucide-react';
import { CATEGORIES, Photo } from '../types';
import { useRef, ChangeEvent, useState } from 'react';

interface HeaderProps {
  title?: string;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onUpload: (photo: Photo) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchVisible: boolean;
  onSetSearchVisible: (visible: boolean) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export default function Header({ 
  title = 'All Photos',
  selectedCategory, 
  onCategoryChange, 
  onUpload, 
  searchQuery,
  onSearchChange,
  isSearchVisible,
  onSetSearchVisible,
  isSelectionMode, 
  onToggleSelectionMode,
  selectedCount,
  onDeleteSelected 
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: url,
        title: file.name.split('.')[0] || 'Untitled',
        location: 'Uploaded Local File',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        categoryId: isVideo ? 'video' : 'all',
        mediaType: isVideo ? 'video' : 'image',
        description: `A newly uploaded ${isVideo ? 'video' : 'photo'} in your collection.`,
      };
      onUpload(newPhoto);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass px-6 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <motion.h1 
          key={title}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold tracking-tight text-white max-w-[60%] truncate"
        >
          {title}
        </motion.h1>
        <div className="flex gap-4">
          {isSelectionMode && selectedCount > 0 && (
            <button 
              onClick={onDeleteSelected}
              className="px-4 flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-sm transition-all hover:bg-red-600 active:scale-95"
            >
              Delete
            </button>
          )}
          <button 
            onClick={onToggleSelectionMode}
            className={`px-4 flex items-center justify-center rounded-full font-bold text-sm transition-all ${
              isSelectionMode 
                ? 'bg-ios-blue text-white' 
                : 'glass text-ios-blue hover:bg-white/10'
            }`}
          >
            {isSelectionMode ? 'Cancel' : 'Select'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
          {!isSelectionMode && (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
              >
                <Plus size={20} className="text-white/80" />
              </button>
              <button 
                onClick={() => {
                  onSetSearchVisible(!isSearchVisible);
                  if (isSearchVisible) onSearchChange('');
                }}
                className={`p-2 rounded-full glass transition-colors ${isSearchVisible ? 'bg-ios-blue text-white' : 'hover:bg-white/10 text-white/80'}`}
              >
                {isSearchVisible ? <CloseIcon size={20} /> : <Search size={20} />}
              </button>
              <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors">
                <SlidersHorizontal size={20} className="text-white/80" />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isSearchVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by title, location, or AI tags..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-ios-blue transition-all"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-ios-blue text-white shadow-lg shadow-blue-500/20'
                : 'glass text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </header>
  );
}
