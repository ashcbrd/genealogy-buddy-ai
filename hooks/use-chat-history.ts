"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessages {
  id: string;
  title?: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryResponse {
  chats: ChatHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

export function useChatHistory() {
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchChatHistory = useCallback(async (page = 1, search = "", append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/research/history?${params.toString()}`);
      
      if (!response.ok) {
        // Handle different error scenarios
        if (response.status === 500) {
          throw new Error("Database connection issue. Please check if your database is running and try again.");
        }
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }

      const data: ChatHistoryResponse = await response.json();
      
      // Check for database error in response
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (append) {
        setChats(prev => [...prev, ...data.chats]);
      } else {
        setChats(data.chats);
      }
      
      setPagination(data.pagination);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat history');
      console.error('Chat history fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreChats = useCallback(() => {
    if (pagination.hasNext && !isLoading) {
      fetchChatHistory(currentPage + 1, searchQuery, true);
    }
  }, [currentPage, searchQuery, pagination.hasNext, isLoading, fetchChatHistory]);

  const searchChats = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchChatHistory(1, query, false);
  }, [fetchChatHistory]);

  const loadChat = useCallback(async (chatId: string): Promise<ChatMessages | null> => {
    try {
      const response = await fetch(`/api/research/chat/${chatId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load chat: ${response.status}`);
      }

      const chat: ChatMessages = await response.json();
      
      // Convert timestamp strings to Date objects
      chat.messages = chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      return chat;
    } catch (err) {
      console.error('Chat load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat');
      return null;
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/research/history?id=${chatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.status}`);
      }

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
      }));

      return true;
    } catch (err) {
      console.error('Chat deletion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
      return false;
    }
  }, []);

  const updateChatTitle = useCallback(async (chatId: string, title: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/research/chat/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update chat: ${response.status}`);
      }

      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));

      return true;
    } catch (err) {
      console.error('Chat update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update chat');
      return false;
    }
  }, []);

  const refreshHistory = useCallback(() => {
    fetchChatHistory(1, searchQuery, false);
  }, [searchQuery, fetchChatHistory]);

  // Initial fetch
  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  return {
    chats,
    isLoading,
    error,
    searchQuery,
    pagination,
    currentPage,
    fetchChatHistory,
    loadMoreChats,
    searchChats,
    loadChat,
    deleteChat,
    updateChatTitle,
    refreshHistory,
    setError,
  };
}