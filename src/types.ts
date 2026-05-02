/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  categoryId: string;
  description: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  tags?: string[];
  albumIds?: string[];
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverId?: string; // photo id for cover
  dateCreated: string;
}

export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Media' },
  { id: 'nature', name: 'Nature' },
  { id: 'architecture', name: 'Architecture' },
  { id: 'urban', name: 'Urban' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'video', name: 'Videos' },
];

export const PHOTOS: Photo[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200',
    title: 'Alpine Morning',
    location: 'Swiss Alps',
    date: 'Oct 12, 2023',
    categoryId: 'nature',
    description: 'The first light hitting the peaks of the Bernese Oberland.',
    tags: ['mountains', 'sunrise', 'snow', 'swiss'],
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    title: 'Glass & Steel',
    location: 'Berlin, Germany',
    date: 'Nov 3, 2023',
    categoryId: 'architecture',
    description: 'Symmetry and reflection in the heart of Potsdamer Platz.',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=1200',
    title: 'Misty Woods',
    location: 'Pacific Northwest',
    date: 'Dec 1, 2023',
    categoryId: 'nature',
    description: 'Deep fog rolling through the ancient Douglas firs.',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1449156001935-b28ec3694005?auto=format&fit=crop&q=80&w=1200',
    title: 'Tokyo Night',
    location: 'Shinjuku, Japan',
    date: 'Jan 15, 2024',
    categoryId: 'urban',
    description: 'The endless energy of the worlds busiest intersection.',
    tags: ['city', 'neon', 'night', 'japan', 'street'],
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1200',
    title: 'Desert Minimal',
    location: 'Joshua Tree',
    date: 'Feb 20, 2024',
    categoryId: 'minimal',
    description: 'Sun-drenched textures and sharp geometric shadows.',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200',
    title: 'Highlands Mist',
    location: 'Isle of Skye',
    date: 'Mar 5, 2024',
    categoryId: 'nature',
    description: 'Dramatic cliffs meet the moody Atlantic Ocean.',
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1485628390555-1a7bd503f9fe?auto=format&fit=crop&q=80&w=1200',
    title: 'Monolith',
    location: 'Chicago, USA',
    date: 'Apr 10, 2024',
    categoryId: 'minimal',
    description: 'The brutalist beauty of urban infrastructure.',
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200',
    title: 'Neon Pulse',
    location: 'Seoul, Korea',
    date: 'May 22, 2024',
    categoryId: 'urban',
    description: 'Vibrant reflections in a city that never sleeps.',
  },
];
