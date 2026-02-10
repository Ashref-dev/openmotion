'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadAsset } from '@/app/actions/assets';
import { Upload, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssetUploadProps {
  projectId: string;
}

export function AssetUpload({ projectId }: AssetUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);
    formData.append('type', 'screenshot');

    const result = await uploadAsset(formData);
    setUploading(false);

    if (result.success) {
      router.refresh();
      e.target.value = '';
    } else {
      setError(result.error || 'Failed to upload asset');
    }
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="file-upload">Upload Screenshots or Logos</Label>
      <div className="flex items-center gap-4">
        <Input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="max-w-sm"
        />
        <Button disabled={uploading} variant="secondary">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Supports JPG, PNG, WebP. Images will be optimized automatically.
      </p>
    </div>
  );
}
