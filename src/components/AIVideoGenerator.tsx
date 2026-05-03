import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

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
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error('No image was generated.');
    return `data:image/png;base64,${part.inlineData.data}`;
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    const ai = getAIInstance();
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this image and suggest the best brightness, contrast, and saturation percentages (0-200). Return ONLY a JSON object with keys 'brightness', 'contrast', and 'saturation'." }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brightness: { type: Type.NUMBER },
            contrast: { type: Type.NUMBER },
            saturation: { type: Type.NUMBER }
          },
          required: ["brightness", "contrast", "saturation"]
        }
      }
    });
    return JSON.parse(result.text);
  };

  const upscaleImage = async (base64Data: string, mimeType: string) => {
    const ai = getAIInstance();
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Enhance and upscale this image to high resolution (4K). Remove noise and sharpen details." }
        ]
      }],
      config: { imageConfig: { imageSize: "4K" } }
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