"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  History,
  Search,
  MessageCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Plus,
  Clock,
  MessageSquare,
  X,
} from "lucide-react";
import { useChatHistory, type ChatHistoryItem } from "@/hooks/use-chat-history";
import { formatDistanceToNow } from "date-fns";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId?: string | null;
}

export function ChatHistorySidebar({
  isOpen,
  onToggle,
  onChatSelect,
  onNewChat,
  currentChatId,
}: ChatHistorySidebarProps) {
  const {
    chats,
    isLoading,
    error,
    searchQuery,
    pagination,
    searchChats,
    loadMoreChats,
    deleteChat,
    updateChatTitle,
    refreshHistory,
    setError,
  } = useChatHistory();

  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleSearch = (query: string) => {
    searchChats(query);
  };

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const success = await deleteChat(chatId);
    if (success && chatId === currentChatId) {
      // If we deleted the current chat, start a new one
      onNewChat();
    }
  };

  const handleEditTitle = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setNewTitle(chat.title);
      setEditingChat(chatId);
    }
  };

  const handleSaveTitle = async () => {
    if (editingChat && newTitle.trim()) {
      const success = await updateChatTitle(editingChat, newTitle.trim());
      if (success) {
        setEditingChat(null);
        setNewTitle("");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingChat(null);
    setNewTitle("");
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed left-4 top-4 z-40 lg:hidden"
      >
        <History className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      {/* Mobile Overlay - only show on mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar - always fixed positioned */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-background border-r z-50 flex flex-col shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Chat History</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-destructive mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={refreshHistory}>
                  Try Again
                </Button>
              </div>
            )}

            {isLoading && chats.length === 0 && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {chats.length === 0 && !isLoading && !error && (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new research chat to see your history</p>
              </div>
            )}

            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors mb-2 ${
                  currentChatId === chat.id ? "bg-muted border-primary" : ""
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {chat.preview}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {chat.messageCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEditTitle(chat.id, e)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {pagination.hasNext && (
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreChats}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Edit Title Dialog */}
        <Dialog open={!!editingChat} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Conversation</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new title..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTitle();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveTitle} disabled={!newTitle.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}