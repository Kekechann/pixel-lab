/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Download, Plus, Loader2, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Photo } from '../types';

interface AIImageGeneratorProps {
  onSave: (photo: Photo) => void;
}

export default function AIImageGenerator({ onSave }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setShowSuccess(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64Data}`;
            setGeneratedImage(imageUrl);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error('No image was generated. Try a different prompt.');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err?.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedImage) return;

    const newPhoto: Photo = {
      id: `ai-${Date.now()}`,
      url: generatedImage,
      title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
      location: 'AI Generated',
      date: new Date().toLocaleDateString(),
      categoryId: 'creative',
      description: `Generated from prompt: ${prompt}`,
      albumIds: []
    };

    onSave(newPhoto);
    setGeneratedImage(null);
    setPrompt('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="text-ios-blue" />
          AI Creator
        </h2>
        <p className="text-white/40">Transform your imagination into visuals with Gemini AI</p>
      </div>

      <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-ios-blue/10 rounded-full blur-3xl" />
        
        <div className="relative space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
              What do you want to create?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying neon cars at sunset, digital art style..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-ios-blue transition-all min-h-[120px] resize-none text-lg leading-relaxed placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] text-white/20 font-medium italic">
              Tip: Be descriptive about materials, lighting, and style for better results.
            </p>
            <button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className="px-8 py-4 rounded-2xl bg-ios-blue text-white font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm font-medium text-center flex items-center justify-center gap-2"
          >
            <Check size={18} />
            <span>Successfully saved to your gallery!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {generatedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="relative aspect-square max-w-lg mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <p className="text-white/80 text-sm italic line-clamp-2">"{prompt}"</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <a 
                href={generatedImage} 
                download="ai-generated-photo.png"
                className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
              >
                <Download size={18} />
                <span>Download</span>
              </a>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-ios-blue text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Plus size={18} />
                <span>Add to Gallery</span>
              </button>
            </div>
          </motion.div>
        )}

        {!generatedImage && !isGenerating && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center gap-6 text-white/10"
          >
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-current flex items-center justify-center">
              <ImageIcon size={48} />
            </div>
            <p className="text-xl font-bold tracking-tight">Your creation will appear here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
