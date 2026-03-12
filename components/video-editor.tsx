'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@remotion/player';
import { DynamicVideo, DynamicVideoProps } from '@/remotion/DynamicVideo';
import { updateVideoDraft } from '@/app/actions/video-drafts';
import { startExport } from '@/app/actions/export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Upload } from 'lucide-react';

import { VIDEO_CONFIG } from '@/lib/config';

interface VideoConfig {
  primaryColor?: string;
  bgStyle?: 'gradient' | 'solid';
  supportedRatios?: string[];
  scenes?: unknown[];
  assets?: { url: string; type: 'screenshot' | 'logo' }[];
}

interface VideoAsset {
  id: string;
  type: string;
  originalS3Key: string;
  processedS3Key: string | null;
}

interface VideoDraft {
  id: string;
  projectId: string;
  templateId: string;
  ratio: string;
  fps: number;
  durationInFrames: number;
  propsJson: Record<string, unknown>;
  status: string;
  template?: {
    id: string;
    name: string;
    defaultConfigJson: Record<string, unknown>;
  } | null;
  project?: {
    assets: VideoAsset[];
  } | null;
}

interface VideoEditorProps {
  draft: VideoDraft;
  projectId: string;
}

export function VideoEditor({ draft, projectId }: VideoEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [propsJson, setPropsJson] = useState(draft.propsJson);
  const [ratio, setRatio] = useState(draft.ratio);
  const [fps, setFps] = useState(draft.fps);
  const [durationInFrames, setDurationInFrames] = useState(draft.durationInFrames);

  const assets = useMemo(() => {
    const projectAssets = draft.project?.assets || [];
    return projectAssets.map((asset) => ({
      url: asset.processedS3Key || asset.originalS3Key,
      type: asset.type as 'screenshot' | 'logo',
    }));
  }, [draft.project]);

  const currentConfig = useMemo((): VideoConfig => {
    const defaultConfig = (draft.template?.defaultConfigJson || {}) as VideoConfig;
    return {
      ...defaultConfig,
      ...propsJson,
      assets,
    };
  }, [draft.template, propsJson, assets]);

  const typedConfig = currentConfig as VideoConfig;

  const dimensions = useMemo(() => {
    return VIDEO_CONFIG.aspectRatios[ratio as keyof typeof VIDEO_CONFIG.aspectRatios] 
      || VIDEO_CONFIG.aspectRatios['16:9'];
  }, [ratio]);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateVideoDraft(draft.id, {
      ...propsJson,
      ratio,
      fps,
      durationInFrames,
    });
    setIsSaving(false);

    if (result.success) {
      console.log('Draft saved successfully');
    }
  }

  async function handleExport() {
    await handleSave();

    setIsExporting(true);
    const result = await startExport(draft.id);
    setIsExporting(false);

    if (result.success && result.runId) {
      router.push(`/projects/${projectId}/render/${result.runId}`);
    } else {
      alert('Failed to start export: ' + (result.error || 'Unknown error'));
    }
  }

  function handlePropChange(key: string, value: unknown) {
    setPropsJson((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-black/95 shadow-[0_20px_40px_-30px_rgba(14,8,30,0.7)]">
              <Player
                component={DynamicVideo}
                inputProps={currentConfig as DynamicVideoProps}
                durationInFrames={durationInFrames}
                compositionWidth={dimensions.width}
                compositionHeight={dimensions.height}
                fps={fps}
                style={{
                  width: '100%',
                  aspectRatio: ratio.replace(':', '/'),
                }}
                controls
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold">Video Settings</h3>

              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={ratio} onValueChange={setRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typedConfig.supportedRatios?.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (frames)</Label>
                <Input
                  type="number"
                  value={durationInFrames}
                  onChange={(e) => setDurationInFrames(Number(e.target.value))}
                  min={VIDEO_CONFIG.duration.minFrames}
                  max={VIDEO_CONFIG.duration.maxFrames}
                />
                <p className="text-xs text-muted-foreground">
                  {(durationInFrames / fps).toFixed(1)} seconds at {fps}fps
                </p>
              </div>

              <div className="space-y-2">
                <Label>Frame Rate (FPS)</Label>
                <Select value={String(fps)} onValueChange={(v) => setFps(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_CONFIG.fps.options.map((fpsOption) => (
                      <SelectItem key={fpsOption} value={String(fpsOption)}>
                        {fpsOption} FPS ({VIDEO_CONFIG.fps.labels[fpsOption]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-display text-base font-semibold">Template Properties</h3>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={typedConfig.primaryColor || VIDEO_CONFIG.colors.defaultPrimary}
                    onChange={(e) => handlePropChange('primaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={typedConfig.primaryColor || VIDEO_CONFIG.colors.defaultPrimary}
                    onChange={(e) => handlePropChange('primaryColor', e.target.value)}
                    placeholder={VIDEO_CONFIG.colors.defaultPrimary}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Style</Label>
                <Select
                  value={typedConfig.bgStyle || 'gradient'}
                  onValueChange={(v) => handlePropChange('bgStyle', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Button onClick={handleSave} disabled={isSaving} className="w-full" variant="outline">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button onClick={handleExport} disabled={isExporting || isSaving} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isExporting ? 'Starting Export...' : 'Export Video'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Assets Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} loaded
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {assets.slice(0, 4).map((asset) => (
                <div key={asset.url} className="relative aspect-video rounded overflow-hidden border">
                  <img src={asset.url} alt="Asset preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
