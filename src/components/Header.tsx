/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { CATEGORIES, Photo } from '../types';
import { useRef, ChangeEvent } from 'react';

interface HeaderProps {
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onUpload: (photo: Photo) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export default function Header({ 
  selectedCategory, 
  onCategoryChange, 
  onUpload, 
  isSelectionMode, 
  onToggleSelectionMode,
  selectedCount,
  onDeleteSelected 
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: url,
        title: file.name.split('.')[0] || 'Untitled',
        location: 'Uploaded Photo',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        categoryId: 'all',
        description: 'A newly uploaded photo in your gallery.',
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-white"
        >
          All Photos
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
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
          >
            <Plus size={20} className="text-white/80" />
          </button>
          <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors">
            <Search size={20} className="text-white/80" />
          </button>
          <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors">
            <SlidersHorizontal size={20} className="text-white/80" />
          </button>
        </div>
      </div>
      
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
