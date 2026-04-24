import * as React from 'react';
import { UploadCloudIcon, X, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { productsApi } from '../api/products.api';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  urls: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUpload({ urls, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const { url: uploadUrl, timestamp, signature, apiKey } = await productsApi.getUploadUrl();
      const newUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);

        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        newUrls.push(data.secure_url || data.url);
      }

      onChange([...urls, ...newUrls].slice(0, 8));
    } catch {
      // fallback: create object URL for local preview
      const localUrls = files.map((f) => URL.createObjectURL(f));
      onChange([...urls, ...localUrls].slice(0, 8));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUrl = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Upload ${idx + 1}`}
                className="h-20 w-20 rounded-md object-cover border"
              />
              <button
                type="button"
                onClick={() => removeUrl(idx)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < 8 && (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadCloudIcon className="h-4 w-4 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-1" />
              URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-3">
            <div
              className={cn(
                'flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer transition-colors',
                'hover:border-blue-400 hover:bg-blue-50/50',
                uploading && 'opacity-50 pointer-events-none',
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Spinner className="h-6 w-6 mb-2" />
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <UploadCloudIcon className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Click or drag to upload (max {8 - urls.length} more)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </TabsContent>
          <TabsContent value="url" className="pt-3 space-y-2">
            <Label>Image URL</Label>
            <Input
              placeholder="https://example.com/image.jpg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value;
                  if (val && urls.length < 8) {
                    onChange([...urls, val]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">Press Enter to add URL</p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}