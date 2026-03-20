'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { createVideoDraft } from '@/app/actions/video-drafts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listSupportedTemplates } from '@/lib/video/template-catalog';

interface Asset {
  id: string;
  aspectRatio: string;
  type: string;
}

interface TemplateSelectorProps {
  projectId: string;
  assets: Asset[];
}

export function TemplateSelector({ projectId, assets }: TemplateSelectorProps) {
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const imageAssets = useMemo(() => assets.filter((asset) => asset.type !== 'audio'), [assets]);
  const templatesByCategory = useMemo(() => {
    return listSupportedTemplates().reduce<Record<string, ReturnType<typeof listSupportedTemplates>>>(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      },
      {}
    );
  }, []);

  async function handleSelectTemplate(templateId: string) {
    setLoadingTemplateId(templateId);
    setError(null);

    const result = await createVideoDraft({
      projectId,
      templateId,
    });

    setLoadingTemplateId(null);

    if (result.success && result.draft) {
      router.push(`/projects/${projectId}/editor/${result.draft.id}`);
      return;
    }

    setError(result.error || 'Failed to create video draft.');
  }

  if (imageAssets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center text-sm text-muted-foreground">
        Upload at least one image before choosing a template.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      ) : null}

      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <section key={category} className="space-y-4">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">{category}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Purpose-built presets with a shared render pipeline and editable timeline.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {templates.map((template) => {
              const canUse = imageAssets.length >= template.minScreens;
              const isLoading = loadingTemplateId === template.id;

              return (
                <Card
                  key={template.id}
                  className={`group h-full border-border/70 bg-card/85 transition-all duration-200 ${
                    canUse ? 'hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-36px_rgba(13,10,27,0.52)]' : 'opacity-60'
                  }`}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-2 leading-6">{template.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {template.supportedRatios.map((ratio) => (
                        <Badge key={ratio} variant="secondary">
                          {ratio}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {template.minScreens}-{template.maxScreens} images
                      </span>
                      <span>{imageAssets.length} available</span>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!canUse || isLoading}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      {isLoading ? 'Creating draft...' : 'Open in editor'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
