"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestComposer } from './request-composer';
import { ResponseViewer } from './response-viewer';
import { RequestHistory } from './request-history';
import type { RequestData, ResponseData, HeaderItem, HistoryItem, HttpMethod } from '@/types/api-explorer';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

const initialRequestData: RequestData = {
  url: '',
  method: 'GET',
  headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
  body: null,
};

async function makeExternalRequest(requestData: RequestData): Promise<ResponseData> {
  const { url, method, headers: headerItems, body } = requestData;

  if (!url) {
    return { status: null, statusText: null, headers: null, data: null, rawBody: null, error: "URL is required." };
  }
  
  let parsedUrl = url;
  try {
    // Ensure URL has a protocol, default to https if missing
    if (!/^https?:\/\//i.test(parsedUrl)) {
      parsedUrl = 'https://' + parsedUrl;
    }
    // Validate URL
    new URL(parsedUrl);
  } catch (e) {
     return { status: null, statusText: null, headers: null, data: null, rawBody: null, error: `Invalid URL: ${(e as Error).message}. Ensure it includes a protocol (e.g., https://).` };
  }


  const activeHeaders = headerItems.filter(h => h.enabled && h.key.trim() !== '');
  const requestHeaders = new Headers();
  activeHeaders.forEach(header => {
    requestHeaders.append(header.key, header.value);
  });

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestOptions.body = body;
  }
  
  const startTime = performance.now();

  try {
    const response = await fetch(parsedUrl, requestOptions);
    const endTime = performance.now();

    const responseSize = parseInt(response.headers.get('content-length') || "0");
    const responseTime = Math.round(endTime - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const rawBody = await response.text();
    let responseBodyData: any = rawBody;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseBodyData = JSON.parse(rawBody);
      } catch (e) {
        // Not valid JSON, keep rawBody as data
      }
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseBodyData,
      rawBody: rawBody,
      error: null,
      size: responseSize,
      time: responseTime,
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      status: null,
      statusText: null,
      headers: null,
      data: null,
      rawBody: null,
      error: (error as Error).message || 'An unknown network error occurred.',
      time: Math.round(endTime - startTime),
    };
  }
}

export default function ApiExplorerClientPage() {
  const [currentTab, setCurrentTab] = useState<string>("request");
  const [requestData, setRequestData] = useState<RequestData>(initialRequestData);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0); // To trigger history refresh
  const { toast } = useToast();

  const handleRequestDataChange = useCallback((field: keyof RequestData, value: any) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const saveToHistory = async (request: RequestData, response: ResponseData) => {
    if (!response.error) { // Only save successful or non-network-error requests
      const historyEntry: Omit<HistoryItem, 'id' | 'timestamp'> & { responseSummary : {status: number | null, statusText: string | null }} = {
        ...request,
        responseSummary: {
          status: response.status,
          statusText: response.statusText,
        }
      };
      try {
        const apiResponse = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(historyEntry),
        });
        if (apiResponse.ok) {
          setHistoryRefreshKey(prev => prev + 1); // Trigger history refresh
        } else {
          const errorData = await apiResponse.json();
          toast({ title: "History Save Error", description: `Could not save to history: ${errorData.message}`, variant: "destructive" });
        }
      } catch (error) {
        console.error('Failed to save history:', error);
        toast({ title: "History Save Error", description: "Failed to connect to history service.", variant: "destructive" });
      }
    }
  };

  const handleSendRequest = useCallback(async () => {
    setIsLoading(true);
    setResponseData(null); // Clear previous response
    setCurrentTab("response"); // Switch to response tab

    const response = await makeExternalRequest(requestData);
    setResponseData(response);
    setIsLoading(false);

    if (response.error) {
      toast({ title: "Request Error", description: response.error, variant: "destructive" });
    } else {
      toast({ title: "Request Successful", description: `Status: ${response.status} ${response.statusText}`});
    }
    
    // Save to history regardless of error for now, as long as it's not a pre-flight client error
    // (e.g. invalid URL handled by makeExternalRequest before fetch)
    if (response.status !== null || response.error?.startsWith("Invalid URL") === false) {
       await saveToHistory(requestData, response);
    }

  }, [requestData, toast]);


  const handleSelectHistoryItem = useCallback((item: RequestData) => {
    setRequestData({
      url: item.url,
      method: item.method,
      headers: item.headers.map(h => ({...h, id: Math.random().toString(36).substring(7)})), // Ensure new IDs for headers if needed
      body: item.body,
    });
    setResponseData(null); // Clear previous response
    setCurrentTab("request"); // Switch to request tab
    toast({ title: "History Item Loaded", description: "Request details loaded into composer."});
  }, [toast]);
  
  useEffect(() => {
    // This is a simple way to warn about potential CORS issues for external APIs.
    // In a real app, you might detect this more intelligently or provide a proxy solution.
    if (requestData.url && !requestData.url.startsWith('/') && !requestData.url.includes(window.location.hostname)) {
        console.warn("API Explorer: Attempting to call an external URL. This might be blocked by CORS policy in the browser. For development, consider using a browser extension to disable CORS or a server-side proxy.");
    }
  }, [requestData.url]);


  return (
    <div className="container mx-auto p-4 h-[calc(100vh-2rem)]">
      <h1 className="font-headline text-3xl font-bold mb-6 text-primary">API Explorer</h1>
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-[calc(100%-5rem)] flex flex-col">
        <TabsList className="mb-4 shrink-0">
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="request" className="flex-grow overflow-hidden m-0">
           <RequestComposer
              requestData={requestData}
              onRequestDataChange={handleRequestDataChange}
              onSendRequest={handleSendRequest}
              isLoading={isLoading}
            />
        </TabsContent>
        <TabsContent value="response" className="flex-grow overflow-hidden m-0">
          <ResponseViewer responseData={responseData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="history" className="flex-grow overflow-hidden m-0">
          <RequestHistory onSelectHistoryItem={handleSelectHistoryItem} refreshKey={historyRefreshKey} />
        </TabsContent>
      </Tabs>
       <p className="text-xs text-muted-foreground mt-4 text-center">
        Note: Requests to external domains may be subject to CORS restrictions by your browser.
      </p>
    </div>
  );
}
