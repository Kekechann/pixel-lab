/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Plus, Folder, Trash2 } from 'lucide-react';
import { Album, Photo } from '../types';

interface AlbumListProps {
  albums: Album[];
  photos: Photo[];
  onSelectAlbum: (id: string) => void;
  onCreateAlbum: () => void;
  onDeleteAlbum: (id: string) => void;
}

export default function AlbumList({ albums, photos, onSelectAlbum, onCreateAlbum, onDeleteAlbum }: AlbumListProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Albums</h2>
        <button 
          onClick={onCreateAlbum}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ios-blue text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95"
        >
          <Plus size={18} />
          <span>New Album</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {albums.map((album) => {
          const albumPhotos = photos.filter(p => p.albumIds?.includes(album.id));
          const coverPhoto = photos.find(p => p.id === album.coverId) || albumPhotos[0];

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
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md glass text-[10px] font-bold text-white">
                  {albumPhotos.length}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete album "${album.title}"?`)) {
                      onDeleteAlbum(album.id);
                    }
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-full glass text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm truncate">{album.title}</h3>
                <p className="text-white/40 text-xs">{album.dateCreated}</p>
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
    </div>
  );
}
