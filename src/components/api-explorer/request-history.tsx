"use client";

import React, { useEffect, useState }from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { HistoryItem, RequestData } from '@/types/api-explorer';
import { Badge } from '@/components/ui/badge';
import { History, RefreshCcw, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface RequestHistoryProps {
  onSelectHistoryItem: (item: RequestData) => void;
  refreshKey: number; // Used to trigger a refresh
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-sky-500 hover:bg-sky-600';
    case 'POST': return 'bg-green-500 hover:bg-green-600';
    case 'PUT': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    case 'DELETE': return 'bg-red-500 hover:bg-red-600';
    case 'PATCH': return 'bg-purple-500 hover:bg-purple-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};


export function RequestHistory({ onSelectHistoryItem, refreshKey }: RequestHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data: HistoryItem[] = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: "Error", description: "Could not fetch request history.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);


  const handleClearHistory = async () => {
    // This is a placeholder. In a real app, you'd send a DELETE request to an API endpoint.
    // For this demo, we'll just clear the local state and log a message.
    // To properly clear, the backend /api/history would need a DELETE method or similar.
    // For now, let's assume it only clears the fetched list, not persistent storage.
    // To make it clear to the user, we should inform them this is a temporary clear.
    
    // As a temporary measure, if we want to simulate clearing the in-memory store on the server,
    // we would need a specific API endpoint. For now, just clear client-side.
    // This is not ideal as `historyStore` is server-side.
    // A proper solution would be:
    // 1. Add DELETE /api/history endpoint to clear `historyStore`.
    // 2. Call that endpoint here.
    
    // For now, let's just re-fetch an empty list (as if it was cleared)
    // This part is tricky without modifying the API route to support deletion.
    // So, we'll just inform the user.
    if (confirm("This will clear the history display. Persistent history (if any) might not be cleared. Continue?")) {
        setHistory([]); // Clears client-side view.
        toast({ title: "History Cleared (Display Only)", description: "Request history display has been cleared."});
    }

  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-lg flex items-center">
            <History size={22} className="mr-2" /> Request History
          </CardTitle>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoading} aria-label="Refresh history">
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
            </Button>
             {/* Placeholder for clear history functionality
            <Button variant="outline" size="sm" onClick={handleClearHistory} aria-label="Clear history" title="Clear History (Display Only)">
              <Trash2 size={16} />
            </Button>
            */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          {isLoading && history.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No history yet. Send some requests!</div>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectHistoryItem(item)}
                    className="w-full text-left p-3 hover:bg-muted/50 focus:outline-none focus:bg-accent/20 transition-colors"
                    aria-label={`Load request to ${item.url} with method ${item.method}`}
                  >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                        <Badge className={`px-2 py-0.5 text-xs ${getMethodColor(item.method)} text-white`}>{item.method}</Badge>
                        <span className="text-sm font-medium truncate flex-1" title={item.url}>{item.url}</span>
                      </div>
                      {item.responseSummary?.status && (
                         <Badge variant={item.responseSummary.status >= 400 ? "destructive" : "secondary"} className="text-xs">
                           {item.responseSummary.status}
                         </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
