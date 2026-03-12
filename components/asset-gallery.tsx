'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { deleteAsset } from '@/app/actions/assets';
import { useRouter } from 'next/navigation';

interface Asset {
  id: string;
  type: string;
  originalS3Key: string;
  processedS3Key: string | null;
  width: number;
  height: number;
  aspectRatio: string;
  createdAt: Date;
}

interface AssetGalleryProps {
  assets: Asset[];
}

export function AssetGallery({ assets }: AssetGalleryProps) {
  const router = useRouter();

  async function handleDelete(assetId: string) {
    if (!confirm('Delete this asset?')) return;

    await deleteAsset(assetId);
    router.refresh();
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No assets yet. Upload your first image to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <Card
          key={asset.id}
          className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-30px_rgba(22,12,51,0.5)]"
        >
          <CardContent className="p-0">
            <div className="relative aspect-square">
              <Image
                src={asset.processedS3Key || asset.originalS3Key}
                alt="Asset"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{asset.aspectRatio}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(asset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {asset.width} × {asset.height}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
