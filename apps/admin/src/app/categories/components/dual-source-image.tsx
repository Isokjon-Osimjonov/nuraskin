import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloudIcon, LinkIcon } from 'lucide-react';
import { categoriesApi } from '../api/categories.api';
import { Spinner } from '@/components/ui/spinner';

interface DualSourceImageProps {
  value: string;
  onChange: (url: string) => void;
}

export function DualSourceImage({ value, onChange }: DualSourceImageProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { url, timestamp, signature, apiKey } = await categoriesApi.getUploadUrl();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onChange(data.secure_url || data.url);
    } catch (error) {
      console.error('Upload failed', error);
      // Fallback for mock if upload fails
      onChange(URL.createObjectURL(file));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border">
          <img src={value} alt="Preview" className="object-cover w-full h-full" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange('')}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadCloudIcon className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="w-4 h-4 mr-2" />
              Paste URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 space-y-2">
              <UploadCloudIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select an image from your device</p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading && <Spinner className="mr-2 h-4 w-4" />}
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </TabsContent>
          <TabsContent value="url" className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                onBlur={(e) => {
                  if (e.target.value) onChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.currentTarget.value) onChange(e.currentTarget.value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Press Enter or blur to save</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}