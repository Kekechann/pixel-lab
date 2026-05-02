/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Album } from '../types';

interface CreateAlbumModalProps {
  album?: Album; // If provided, we are editing
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export default function CreateAlbumModal({ album, onClose, onSave }: CreateAlbumModalProps) {
  const [title, setTitle] = useState(album?.title || '');
  const [description, setDescription] = useState(album?.description || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md glass-dark rounded-3xl overflow-hidden border border-white/10"
      >
        <header className="p-6 flex items-center justify-between border-b border-white/5">
          <h2 className="text-xl font-bold text-white">{album ? 'Edit Album' : 'New Album'}</h2>
          <button onClick={onClose} className="p-2 glass rounded-full text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <main className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/40">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Trip 2024"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/40">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell a story about these photos..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ios-blue transition-colors min-h-[100px] resize-none"
            />
          </div>
        </main>

        <footer className="p-6 pt-0 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl glass text-white font-bold tracking-wide hover:bg-white/10 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title, description)}
            disabled={!title.trim()}
            className="flex-3 py-4 rounded-2xl bg-ios-blue text-white font-bold tracking-wide hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check size={20} />
            <span>{album ? 'Save Changes' : 'Create Album'}</span>
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
