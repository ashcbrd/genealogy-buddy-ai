"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/app/(dashboard)/tools/document-analyzer/page";

interface DocumentRecord {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  analysis?: {
    id: string;
    type: string;
    confidence: number;
    result: any; // Analysis result JSON
    suggestions: any; // Suggestions JSON
    createdAt: string;
  } | null;
}

interface DocumentHistoryResponse {
  documents: DocumentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SavedDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  analysis?: AnalysisResult;
  notes?: string;
  tags?: string[];
}

export function useDocumentHistory() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '50'); // Get more documents for history
      if (search) {
        params.set('search', search);
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      const data: DocumentHistoryResponse = await response.json();
      
      // Transform database response to match frontend interface
      const savedDocs: SavedDocument[] = data.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        uploadedAt: doc.createdAt,
        analysis: doc.analysis?.result as AnalysisResult | undefined,
        // TODO: Add notes and tags when implemented
        notes: undefined,
        tags: undefined,
      }));
      
      setDocuments(savedDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      console.error('Document history fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status}`);
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      console.error('Document deletion error:', err);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    deleteDocument,
    refresh: () => fetchDocuments(),
  };
}