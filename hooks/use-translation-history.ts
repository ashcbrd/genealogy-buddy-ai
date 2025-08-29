"use client";

import { useState, useEffect } from "react";
import type { TranslationResult } from "@/types";

interface TranslationRecord {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  type: 'image' | 'text';
  filename?: string;
  viewUrl?: string | null;
  createdAt: string;
  analysis?: {
    id: string;
    type: string;
    confidence: number;
    result: TranslationResult;
    suggestions: string[];
    createdAt: string;
  };
}

interface TranslationHistoryResponse {
  translations: TranslationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SavedTranslation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  type: 'image' | 'text';
  filename?: string;
  viewUrl?: string | null;
  uploadedAt: string;
  analysis?: TranslationResult;
  inputData?: {
    imageData?: string;
    textInput?: string;
    extractFacts?: boolean;
    contextualHelp?: boolean;
  };
}

export function useTranslationHistory() {
  const [translations, setTranslations] = useState<SavedTranslation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranslations = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (search) {
        params.set('search', search);
      }
      
      const response = await fetch(`/api/translations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch translations: ${response.status}`);
      }
      
      const data: TranslationHistoryResponse = await response.json();
      
      // Transform database response to match frontend interface
      const savedTranslations: SavedTranslation[] = data.translations.map((record) => ({
        id: record.id,
        originalText: record.originalText,
        translatedText: record.translatedText,
        sourceLanguage: record.sourceLanguage,
        targetLanguage: record.targetLanguage,
        confidence: record.confidence,
        type: record.type,
        filename: record.filename,
        viewUrl: record.viewUrl,
        uploadedAt: record.createdAt,
        analysis: record.analysis?.result as TranslationResult | undefined,
        inputData: record.analysis?.result ? {
          imageData: record.type === 'image' ? '[Image data]' : undefined,
          textInput: record.type === 'text' ? record.originalText : undefined,
          extractFacts: true, // Default assumption
          contextualHelp: true, // Default assumption
        } : undefined,
      }));
      
      setTranslations(savedTranslations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch translations');
      console.error('Translation history fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTranslation = async (translationId: string) => {
    try {
      const response = await fetch(`/api/translations?id=${translationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete translation: ${response.status}`);
      }
      
      // Remove from local state
      setTranslations(prev => prev.filter(trans => trans.id !== translationId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete translation');
      console.error('Translation deletion error:', err);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTranslations();
  }, []);

  return {
    translations,
    isLoading,
    error,
    fetchTranslations,
    deleteTranslation,
    refresh: () => fetchTranslations(),
  };
}