import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Loader2, Plus, Sparkles, Video, Wand2, Check } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { Photo } from '../types';

export function useAI() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  const getApiKey = useCallback(() => {
    return (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
      setHasApiKey(!!hasKey || !!getApiKey());
      setLoadingKey(false);
    };
    checkKey();
  }, [getApiKey]);

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio?.openSelectKey?.();
      setHasApiKey(true);
    } catch (err) {
      console.error('Failed to open key selector:', err);
    }
  };

  const getAIInstance = useCallback(() => {
    const apiKey = getApiKey();
    return new GoogleGenAI({ apiKey });
  }, [getApiKey]);

  const generateVideo = async (prompt: string, onProgress?: (progress: number) => void) => {
    const ai = getAIInstance();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    let progress = 0;
    onProgress?.(progress);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      progress = Math.min(progress + 10, 95);
      onProgress?.(progress);
      operation = await ai.operations.getVideosOperation({ operation });
    }

    onProgress?.(100);
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error('Video generation completed but no link was found.');

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: { 'x-goog-api-key': getApiKey() },
    });

    if (!response.ok) throw new Error('Failed to download the generated video.');
    return await response.blob();
  };

  const generateImage = async (prompt: string) => {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error('No image was generated.');
    return `data:image/png;base64,${part.inlineData.data}`;
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    const ai = getAIInstance();
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this image and suggest the best brightness, contrast, and saturation percentages (0-200). Return ONLY a JSON object with keys 'brightness', 'contrast', and 'saturation'." }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brightness: { type: Type.NUMBER },
            contrast: { type: Type.NUMBER },
            saturation: { type: Type.NUMBER }
          },
          required: ['brightness', 'contrast', 'saturation']
        }
      }
    });
    return JSON.parse(result.text);
  };

  const upscaleImage = async (base64Data: string, mimeType: string) => {
    const ai = getAIInstance();
    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: 'Enhance and upscale this image to high resolution (4K). Remove noise and sharpen details.' }
        ]
      }],
      config: { imageConfig: { imageSize: '4K' } }
    });

    const part = result.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error('Upscale failed.');
    return `data:image/png;base64,${part.inlineData.data}`;
  };

  return {
    hasApiKey,
    loadingKey,
    setHasApiKey,
    handleSelectKey,
    generateVideo,
    generateImage,
    analyzeImage,
    upscaleImage
  };
}

interface AIVideoGeneratorProps {
  onSave: (photo: Photo) => void;
}

export default function AIVideoGenerator({ onSave }: AIVideoGeneratorProps) {
  const { generateVideo, hasApiKey, loadingKey, handleSelectKey } = useAI();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setVideoUrl(null);
    setShowSuccess(false);

    try {
      const blob = await generateVideo(prompt.trim(), setProgress);
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err?.message || 'Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!videoUrl) return;

    const newPhoto: Photo = {
      id: `ai-video-${Date.now()}`,
      url: videoUrl,
      title: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
      location: 'AI Generated Video',
      date: new Date().toLocaleDateString(),
      categoryId: 'creative',
      description: `Generated from prompt: ${prompt}`,
      albumIds: []
    };

    onSave(newPhoto);
    setVideoUrl(null);
    setPrompt('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="text-ios-blue" />
          Veo Video AI
        </h2>
        <p className="text-white/40">Turn a text prompt into a cinematic video with Gemini AI</p>
      </div>

      {!loadingKey && !hasApiKey && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm text-center">
          <p className="mb-3">Select a Gemini API key before generating a video.</p>
          <button onClick={handleSelectKey} className="px-4 py-2 rounded-xl bg-amber-400/20 font-bold hover:bg-amber-400/30 transition-colors">
            Select API key
          </button>
        </div>
      )}

      <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-ios-blue/10 rounded-full blur-3xl" />
        <div className="relative space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-1">
              Describe your video
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A slow aerial shot over a neon city at sunset, cinematic lighting..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-ios-blue transition-all min-h-[120px] resize-none text-lg leading-relaxed placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] text-white/20 font-medium italic">
              Tip: Include camera movement, lighting, subject, and visual style.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || (!hasApiKey && !loadingKey)}
              className="px-8 py-4 rounded-2xl bg-ios-blue text-white font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{progress}%</span>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm font-medium text-center flex items-center justify-center gap-2">
            <Check size={18} />
            <span>Successfully saved to your gallery!</span>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium text-center">
            {error}
          </motion.div>
        )}

        {videoUrl && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="space-y-6">
            <div className="relative aspect-video max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
              <video src={videoUrl} controls className="w-full h-full object-contain" aria-label="Generated video" />
            </div>
            <div className="flex justify-center gap-4">
              <a href={videoUrl} download="ai-generated-video.mp4" className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95">
                <Download size={18} />
                <span>Download</span>
              </a>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-ios-blue text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                <Plus size={18} />
                <span>Add to Gallery</span>
              </button>
            </div>
          </motion.div>
        )}

        {!videoUrl && !isGenerating && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center gap-6 text-white/10">
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-current flex items-center justify-center">
              <Video size={48} />
            </div>
            <p className="text-xl font-bold tracking-tight">Your video will appear here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
