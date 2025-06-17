"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ResponseData } from '@/types/api-explorer';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ResponseViewerProps {
  responseData: ResponseData | null;
  isLoading: boolean;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function ResponseViewer({ responseData, isLoading }: ResponseViewerProps) {
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Response</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <svg aria-hidden="true" className="w-10 h-10 text-primary animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="hsl(var(--primary))"/>
            </svg>
            <p className="text-muted-foreground">Loading response...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!responseData) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Response</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Info size={48} className="mx-auto mb-2" />
            <p>Send a request to see the response here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { status, statusText, headers, rawBody, error, size, time } = responseData;

  const getStatusBadgeVariant = (status: number | null) => {
    if (status === null) return 'secondary';
    if (status >= 200 && status < 300) return 'default'; // Success (Greenish if using custom variants)
    if (status >= 400 && status < 500) return 'destructive'; // Client Error (Red)
    if (status >= 500) return 'destructive'; // Server Error (Red)
    if (status >= 300 && status < 400) return 'secondary'; // Redirect (Yellowish if custom)
    return 'secondary';
  };

  const StatusIcon = ({ status }: { status: number | null }) => {
    if (status === null) return <Info size={16} className="mr-1" />;
    if (status >= 200 && status < 300) return <CheckCircle2 size={16} className="mr-1 text-green-500" />;
    if (status >= 400) return <AlertTriangle size={16} className="mr-1 text-red-500" />;
    return <Info size={16} className="mr-1" />;
  };


  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Response Error</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive font-medium">Error:</p>
            <pre className="font-code text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  let formattedBody = rawBody;
  if (rawBody) {
    try {
      const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
      if (contentType.includes('application/json')) {
        const jsonData = JSON.parse(rawBody);
        formattedBody = JSON.stringify(jsonData, null, 2);
      }
    } catch (e) {
      // Not JSON or invalid JSON, keep rawBody
    }
  }


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-lg">Response</CardTitle>
          {status !== null && (
            <div className="flex items-center space-x-2">
               <Badge variant={getStatusBadgeVariant(status)} className="text-sm">
                <StatusIcon status={status} />
                Status: {status} {statusText}
              </Badge>
              {size !== undefined && <Badge variant="outline">Size: {formatBytes(size)}</Badge>}
              {time !== undefined && <Badge variant="outline">Time: {time} ms</Badge>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <Tabs defaultValue="body" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers ({headers ? Object.keys(headers).length : 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="flex-grow overflow-hidden mt-0">
            <ScrollArea className="h-full pr-3">
              {formattedBody ? (
                <pre className="font-code text-sm p-2 bg-muted/30 rounded whitespace-pre-wrap break-all">{formattedBody}</pre>
              ) : (
                <div className="text-muted-foreground p-4 text-center">No content in response body.</div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="headers" className="flex-grow overflow-hidden mt-0">
            <ScrollArea className="h-full pr-3">
              {headers && Object.keys(headers).length > 0 ? (
                <div className="space-y-1 p-2 bg-muted/30 rounded">
                  {Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="font-code text-sm grid grid-cols-[max-content_1fr] gap-x-2">
                      <strong className="truncate">{key}:</strong>
                      <span className="truncate">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground p-4 text-center">No headers in response.</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
