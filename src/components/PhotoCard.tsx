/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <motion.div
      layoutId={`card-${photo.id}`}
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(photo)}
      className="relative aspect-[3/4] overflow-hidden rounded-ios cursor-pointer photo-shadow group border border-white/5"
    >
      <motion.img
        layoutId={`img-${photo.id}`}
        src={photo.url}
        alt={photo.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <h3 className="text-white font-medium text-lg tracking-tight">{photo.title}</h3>
        <p className="text-white/60 text-sm">{photo.location}</p>
      </div>
    </motion.div>
  );
}
