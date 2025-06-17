export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestData {
  url: string;
  method: HttpMethod;
  headers: HeaderItem[];
  body: string | null;
}

export interface ResponseData {
  status: number | null;
  statusText: string | null;
  headers: Record<string, string> | null;
  data: any | null; // Parsed data (e.g., JSON object) or raw text
  rawBody: string | null; // Raw response body as text
  error: string | null;
  size?: number; // size in bytes
  time?: number; // time in ms
}

export interface HistoryItem extends RequestData {
  id: string; // Unique ID for the history item (e.g., timestamp or UUID)
  timestamp: number;
  responseSummary?: {
    status: number | null;
    statusText: string | null;
  }
}
