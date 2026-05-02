/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { X, Folder } from 'lucide-react';
import { Album } from '../types';

interface AddToAlbumModalProps {
  albums: Album[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function AddToAlbumModal({ albums, onClose, onSelect }: AddToAlbumModalProps) {
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
          <h2 className="text-xl font-bold text-white">Add to Album</h2>
          <button onClick={onClose} className="p-2 glass rounded-full text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <main className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {albums.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-white font-medium">No albums yet</p>
              <p className="text-white/40 text-sm">Create an album first to organize photos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => onSelect(album.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-ios-blue/10 flex items-center justify-center text-ios-blue group-hover:scale-110 transition-transform">
                    <Folder size={24} />
                  </div>
                  <div>
                    <p className="text-white font-bold">{album.title}</p>
                    <p className="text-white/40 text-xs">{album.dateCreated}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </motion.div>
    </motion.div>
  );
}
