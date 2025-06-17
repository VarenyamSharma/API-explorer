"use client";

import type { ChangeEvent, FormEvent } from 'react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Send, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { HttpMethod, HeaderItem, RequestData } from '@/types/api-explorer';

interface RequestComposerProps {
  requestData: RequestData;
  onRequestDataChange: (field: keyof RequestData, value: any) => void;
  onSendRequest: () => void;
  isLoading: boolean;
}

const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
const methodsWithBody: HttpMethod[] = ['POST', 'PUT', 'PATCH'];

export function RequestComposer({ requestData, onRequestDataChange, onSendRequest, isLoading }: RequestComposerProps) {
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>(["headers"]);
  
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    onRequestDataChange('url', e.target.value);
  };

  const handleMethodChange = (value: HttpMethod) => {
    onRequestDataChange('method', value);
    if (!methodsWithBody.includes(value)) {
      onRequestDataChange('body', ''); // Clear body if method doesn't support it
    }
  };

  const handleHeaderChange = (index: number, field: keyof HeaderItem, value: string | boolean) => {
    const newHeaders = [...requestData.headers];
    (newHeaders[index] as any)[field] = value;
    onRequestDataChange('headers', newHeaders);
  };

  const addHeader = () => {
    const newHeaders = [...requestData.headers, { id: Date.now().toString(), key: '', value: '', enabled: true }];
    onRequestDataChange('headers', newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = requestData.headers.filter((_, i) => i !== index);
    onRequestDataChange('headers', newHeaders);
  };

  const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onRequestDataChange('body', e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSendRequest();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Compose Request</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pr-3 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2 items-end">
            <div className="w-32">
              <Label htmlFor="method" className="sr-only">Method</Label>
              <Select value={requestData.method} onValueChange={handleMethodChange}>
                <SelectTrigger id="method" aria-label="HTTP Method">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {httpMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow">
              <Label htmlFor="url" className="sr-only">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://api.example.com/data"
                value={requestData.url}
                onChange={handleUrlChange}
                required
                aria-label="Request URL"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground" aria-label="Send Request">
              <Send size={18} className="mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          <Accordion type="multiple" value={activeAccordionItems} onValueChange={setActiveAccordionItems} className="w-full">
            <AccordionItem value="headers">
              <AccordionTrigger className="text-base font-medium hover:no-underline">
                <div className="flex items-center">
                  {activeAccordionItems.includes("headers") ? <ChevronDown size={20} className="mr-2" /> : <ChevronRight size={20} className="mr-2" />}
                  Headers ({requestData.headers.filter(h => h.enabled).length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {requestData.headers.map((header, index) => (
                  <div key={header.id} className="flex space-x-2 items-center">
                    <Input
                      type="checkbox"
                      className="h-5 w-5 accent-primary shrink-0"
                      checked={header.enabled}
                      onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
                      aria-label={`Enable header ${index + 1}`}
                    />
                    <Input
                      type="text"
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                      className="flex-1"
                      aria-label={`Header ${index + 1} key`}
                      disabled={!header.enabled}
                    />
                    <Input
                      type="text"
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                      className="flex-1"
                      aria-label={`Header ${index + 1} value`}
                      disabled={!header.enabled}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeHeader(index)} aria-label={`Remove header ${index + 1}`} disabled={!header.enabled}>
                      <Trash2 size={18} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addHeader} className="mt-2">
                  <PlusCircle size={18} className="mr-2" /> Add Header
                </Button>
              </AccordionContent>
            </AccordionItem>

            {methodsWithBody.includes(requestData.method) && (
              <AccordionItem value="body">
                <AccordionTrigger className="text-base font-medium hover:no-underline">
                 <div className="flex items-center">
                    {activeAccordionItems.includes("body") ? <ChevronDown size={20} className="mr-2" /> : <ChevronRight size={20} className="mr-2" />}
                    Body
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <Textarea
                    placeholder='{ "key": "value" }'
                    value={requestData.body || ''}
                    onChange={handleBodyChange}
                    rows={8}
                    className="font-code text-sm"
                    aria-label="Request body"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter request body (e.g., JSON, XML, plain text).
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </form>
      </CardContent>
    </Card>
  );
}
