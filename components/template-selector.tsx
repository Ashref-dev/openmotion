'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createVideoDraft } from '@/app/actions/video-drafts';
import { AlertCircle } from 'lucide-react';

interface Asset {
  id: string;
  aspectRatio: string;
}

interface TemplateSelectorProps {
  projectId: string;
  assets: Asset[];
}

// Template definitions - MUST match lib/db/seed/templates.ts
interface Template {
  id: string;
  name: string;
  category: string;
  minScreens: number;
  maxScreens: number;
  ratios: string[];
}

const TEMPLATES: Template[] = [
  { id: 't1-hero-drift', name: 'Hero Drift', category: 'minimal-hero', minScreens: 1, maxScreens: 3, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't2-hero-copy', name: 'Hero Copy', category: 'minimal-hero', minScreens: 1, maxScreens: 2, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't3-hero-zoomcut', name: 'Hero ZoomCut', category: 'minimal-hero', minScreens: 2, maxScreens: 4, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't4-smooth-carousel', name: 'Smooth Carousel', category: 'landing-showcase', minScreens: 3, maxScreens: 8, ratios: ['9:16', '16:9'] },
  { id: 't5-stack-reveal', name: 'Stack Reveal', category: 'landing-showcase', minScreens: 3, maxScreens: 6, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't6-split-showcase', name: 'Split Showcase', category: 'landing-showcase', minScreens: 4, maxScreens: 8, ratios: ['16:9', '1:1'] },
  { id: 't7-logo-hero', name: 'Logo → Hero', category: 'brand-product', minScreens: 1, maxScreens: 3, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't8-brand-carousel', name: 'Brand Carousel', category: 'brand-product', minScreens: 4, maxScreens: 10, ratios: ['9:16', '16:9'] },
  { id: 't9-clean-endcard', name: 'Clean End Card', category: 'brand-product', minScreens: 2, maxScreens: 5, ratios: ['9:16', '16:9', '1:1'] },
  { id: 't10-7sec-reel', name: '7-Second Reel', category: 'fast-reels', minScreens: 3, maxScreens: 5, ratios: ['9:16'] },
  { id: 't11-feature-beats', name: 'Feature Beats', category: 'fast-reels', minScreens: 4, maxScreens: 8, ratios: ['9:16', '1:1'] },
  { id: 't12-dark-premium', name: 'Dark Premium', category: 'fast-reels', minScreens: 3, maxScreens: 6, ratios: ['16:9', '1:1'] },
];

export function TemplateSelector({ projectId, assets }: TemplateSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSelectTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    if (assets.length < template.minScreens) {
      setError(`This template requires at least ${template.minScreens} images. Please upload more.`);
      return;
    }

    const ratio = assets[0]?.aspectRatio || '16:9';
    const selectedAssets = assets.slice(0, template.maxScreens);

    const propsJson = {
      templateId,
      assetUrls: selectedAssets.map((a) => a.id),
      ratio,
    };

    setLoading(true);
    setError(null);
    
    const result = await createVideoDraft({
      projectId,
      templateId,
      ratio,
      durationInFrames: 300,
      propsJson,
    });
    setLoading(false);

    if (result.success && result.draft) {
      router.push(`/projects/${projectId}/editor/${result.draft.id}`);
    } else {
      setError(result.error || 'Failed to create video draft. Please try again.');
    }
  }

  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-md mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {assets.length === 0 && !error && (
        <p className="text-muted-foreground text-center py-8">
          Upload at least one image to choose a template
        </p>
      )}

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 capitalize">
            {category.replace('-', ' ')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const canUse = assets.length >= template.minScreens;
              return (
                <Card key={template.id} className={!canUse ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.minScreens === template.maxScreens
                        ? `${template.minScreens} images`
                        : `${template.minScreens}-${template.maxScreens} images`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {template.ratios.map((r) => (
                          <Badge key={r} variant="outline">
                            {r}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        disabled={!canUse || loading}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
