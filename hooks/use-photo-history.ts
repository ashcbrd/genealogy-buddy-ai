"use client";

import { useState, useEffect } from "react";

interface PhotoAnalysis {
  dateEstimate: {
    period: string;
    confidence: number;
    explanation: string;
  };
  clothingAnalysis: string;
  backgroundAnalysis: string;
  historicalContext: string;
  story: string;
  people: Array<{
    position: string;
    ageEstimate: string;
    clothingDescription: string;
    possibleRole: string;
  }>;
  locationClues: string[];
  suggestions: string[];
}

interface PhotoRecord {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  storagePath: string;
  viewUrl?: string | null;
  analysis?: {
    id: string;
    type: string;
    confidence: number;
    result: any; // Analysis result JSON
    suggestions: any; // Suggestions JSON
    createdAt: string;
  } | null;
}

interface PhotoHistoryResponse {
  photos: PhotoRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SavedPhoto {
  id: string;
  filename: string;
  uploadedAt: string;
  viewUrl?: string | null;
  analysis?: PhotoAnalysis;
  notes?: string;
  tags?: string[];
}

export function usePhotoHistory() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '50'); // Get more photos for history
      if (search) {
        params.set('search', search);
      }
      
      const response = await fetch(`/api/photos?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }
      
      const data: PhotoHistoryResponse = await response.json();
      
      // Transform database response to match frontend interface
      const savedPhotos: SavedPhoto[] = data.photos.map((photo) => ({
        id: photo.id,
        filename: photo.filename,
        uploadedAt: photo.createdAt,
        viewUrl: photo.viewUrl,
        analysis: photo.analysis?.result as PhotoAnalysis | undefined,
        // TODO: Add notes and tags when implemented
        notes: undefined,
        tags: undefined,
      }));
      
      setPhotos(savedPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      console.error('Photo history fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete photo: ${response.status}`);
      }
      
      // Remove from local state
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      console.error('Photo deletion error:', err);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPhotos();
  }, []);

  return {
    photos,
    isLoading,
    error,
    fetchPhotos,
    deletePhoto,
    refresh: () => fetchPhotos(),
  };
}