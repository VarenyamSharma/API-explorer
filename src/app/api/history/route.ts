import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { HistoryItem } from '@/types/api-explorer';

// In-memory store for demo purposes. Replace with MikroORM integration.
let historyStore: HistoryItem[] = [];

export async function GET(request: NextRequest) {
  // Simulate fetching from a database
  const sortedHistory = [...historyStore].sort((a, b) => b.timestamp - a.timestamp);
  return NextResponse.json(sortedHistory);
}

export async function POST(request: NextRequest) {
  try {
    const newHistoryItem = (await request.json()) as Omit<HistoryItem, 'id' | 'timestamp'> & { responseSummary: { status: number, statusText: string }};
    
    if (!newHistoryItem.url || !newHistoryItem.method) {
      return NextResponse.json({ message: 'Missing required fields: url and method' }, { status: 400 });
    }

    const itemToStore: HistoryItem = {
      ...newHistoryItem,
      id: Date.now().toString(), // Simple ID generation
      timestamp: Date.now(),
    };

    // Simulate saving to a database
    // Add to the beginning of the array to keep it sorted by newest first for simplicity
    historyStore.unshift(itemToStore);
    // Optional: Limit history size
    if (historyStore.length > 50) {
      historyStore = historyStore.slice(0, 50);
    }
    
    return NextResponse.json({ message: 'Request saved to history', item: itemToStore }, { status: 201 });
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json({ message: 'Error saving history', error: (error as Error).message }, { status: 500 });
  }
}
