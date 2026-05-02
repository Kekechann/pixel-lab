/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Download, Plus, Loader2, Sparkles, Video, Check, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Photo } from '../types';

interface AIVideoGeneratorProps {
  onSave: (photo: Photo) => void;
}

export default function AIVideoGenerator({ onSave }: AIVideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // Check for available API key
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
      setHasApiKey(!!hasKey);
      setLoadingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio?.openSelectKey?.();
      // Assume success as per skill guidelines to avoid race conditions
      setHasApiKey(true);
    } catch (err) {
      console.error('Failed to open key selector:', err);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);
    setShowSuccess(false);

    try {
      // Use process.env.API_KEY or process.env.GEMINI_API_KEY
      const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion - Veo can take a while
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error('Video generation completed but no link was found.');
      }

      // Fetch the video data using the API key
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download the generated video.');
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      setGeneratedVideo(videoUrl);

    } catch (err: any) {
      console.error('Video generation error:', err);
      if (err?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API key not found or expired. Please re-select your Paid API Key.");
      } else {
        setError(err?.message || 'Failed to generate video. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedVideo) return;

    const newMedia: Photo = {
      id: `ai-vid-${Date.now()}`,
      url: generatedVideo,
      title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
      location: 'Veo AI Lab',
      date: new Date().toLocaleDateString(),
      categoryId: 'video',
      description: `Generated from: "${prompt}"`,
      mediaType: 'video',
      albumIds: []
    };

    onSave(newMedia);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (loadingKey) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-ios-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Video className="text-purple-500" />
          Veo Video AI
        </h2>
        <p className="text-white/40">Transform text into 5-second cinematic video clips</p>
      </div>

      {!hasApiKey ? (
        <div className="glass-dark rounded-3xl p-12 border border-white/10 text-center space-y-8">
          <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-purple-500/30">
            <Key className="text-purple-500" size={40} />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">Paid API Key Required</h3>
              <p className="text-white/50 max-w-sm mx-auto text-sm leading-relaxed">
                Google Veo is available for developers with a paid API key. 
                Please select a key from a project with billing enabled.
              </p>
            </div>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-ios-blue text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Check Billing Docs →
            </a>
          </div>
          <button
            onClick={handleSelectKey}
            className="px-10 py-5 rounded-2xl bg-ios-blue text-white font-bold flex items-center gap-3 mx-auto hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
          >
            <Sparkles size={20} />
            Connect Paid API Key
          </button>
        </div>
      ) : (
        <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
          {/* Animated background element */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]" 
          />
          
          <div className="relative space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
                Visual Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A majestic golden eagle soaring over snow-capped mountains, cinematic 8k, slow motion..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-purple-500 transition-all min-h-[140px] resize-none text-lg leading-relaxed placeholder:text-white/10"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Estimated Time</p>
                <p className="text-white/40 text-sm italic">90-120 seconds per clip</p>
              </div>
              <button
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Imagineering...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm font-bold text-center flex items-center justify-center gap-3"
          >
            <Check size={20} />
            <span>Successfully added to your library!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center shadow-lg"
          >
            {error}
          </motion.div>
        )}

        {generatedVideo && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="relative aspect-video max-w-2xl mx-auto rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 group bg-black">
              <video 
                src={generatedVideo} 
                controls 
                autoPlay 
                loop
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1.5 rounded-full glass-dark text-[10px] font-bold text-purple-400 border border-purple-500/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                  AI RENDERED 720P
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href={generatedVideo} 
                download="veo-clip.mp4"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95 border border-white/5"
              >
                <Download size={18} />
                <span>Download MP4</span>
              </a>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
              >
                <Plus size={18} />
                <span>Save to Gallery</span>
              </button>
            </div>
          </motion.div>
        )}

        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 flex flex-col items-center justify-center gap-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-2 border-dashed border-purple-500/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="text-purple-500 animate-pulse" size={32} />
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-ios-blue">
                Rendering your vision...
              </p>
              <div className="flex flex-col gap-1 items-center">
                <p className="text-white/30 text-sm font-medium">Veo is processing thousands of pixels</p>
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, 16, 8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1 bg-purple-500/40 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!generatedVideo && !isGenerating && !error && hasApiKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 flex flex-col items-center justify-center gap-8 text-white/5"
          >
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-current flex items-center justify-center">
              <Video size={64} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-black uppercase tracking-tighter opacity-50">Studio Ready</p>
              <p className="text-sm font-medium opacity-30">Your video masterpiece starts with a prompt</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
