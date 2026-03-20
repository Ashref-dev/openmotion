'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player, type PlayerRef } from '@remotion/player';
import {
  AlertCircle,
  Film,
  GripVertical,
  Music2,
  Pause,
  Play,
  Plus,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { startExport } from '@/app/actions/export';
import { updateVideoDraft } from '@/app/actions/video-drafts';
import { TimelineComposition } from '@/remotion/TimelineComposition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { VIDEO_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useEditorStore, type EditorAsset, type TimelineLane } from '@/lib/editor/use-editor-store';
import { type AudioClip, type DraftSnapshot, type TextClip, type VisualClip } from '@/lib/video/draft-schema';
import { resolveDraftSnapshot } from '@/lib/video/resolve-draft';
import { getTemplateDefinition } from '@/lib/video/template-catalog';

interface VideoDraft {
  id: string;
  projectId: string;
  templateId: string;
  ratio: string;
  fps: number;
  durationInFrames: number;
  schemaVersion?: string | null;
  propsJson: DraftSnapshot;
  status: string;
  outputS3Key?: string | null;
  posterKey?: string | null;
  template?: {
    id: string;
    name: string;
  } | null;
  project?: {
    assets: (EditorAsset & { previewUrl: string; sourceUrl: string })[];
  } | null;
}

interface VideoEditorProps {
  draft: VideoDraft;
  projectId: string;
}

type TimelineClip = VisualClip | TextClip | AudioClip;

function formatFrames(frames: number, fps: number) {
  return `${(frames / fps).toFixed(1)}s`;
}

function timelineLabelForClip(clip: TimelineClip, assets: EditorAsset[]) {
  if ('assetId' in clip && 'motionPreset' in clip) {
    const asset = assets.find((item) => item.id === clip.assetId);
    return asset ? `Shot · ${asset.aspectRatio}` : 'Visual clip';
  }

  if ('text' in clip) {
    return clip.text;
  }

  const asset = assets.find((item) => item.id === clip.assetId);
  return asset ? 'Audio bed' : 'Audio clip';
}

function LaneClipBlock({
  lane,
  clip,
  assets,
  pixelsPerFrame,
  selected,
  onSelect,
  onResizeStart,
}: {
  lane: TimelineLane;
  clip: TimelineClip;
  assets: EditorAsset[];
  pixelsPerFrame: number;
  selected: boolean;
  onSelect: () => void;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>, clipId: string, lane: TimelineLane) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
    data: { lane },
  });

  const style: React.CSSProperties = {
    width: Math.max(140, clip.durationInFrames * pixelsPerFrame),
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex h-20 shrink-0 items-stretch rounded-2xl border border-border/60 bg-card/95 shadow-[0_16px_45px_-35px_rgba(10,9,24,0.65)]',
        selected && 'border-primary/60 ring-1 ring-primary/30',
        isDragging && 'z-20 shadow-[0_24px_70px_-36px_rgba(10,9,24,0.7)]'
      )}
    >
      <button
        type="button"
        className="flex flex-1 items-center gap-3 overflow-hidden px-3 text-left"
        onClick={onSelect}
      >
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white',
            lane === 'visual' && 'bg-[linear-gradient(145deg,#9064E8,#5E43B0)]',
            lane === 'text' && 'bg-[linear-gradient(145deg,#151121,#2A223B)]',
            lane === 'audio' && 'bg-[linear-gradient(145deg,#0F2B22,#1B6A4C)]'
          )}
        >
          {lane === 'visual' ? <Film className="h-4 w-4" /> : lane === 'text' ? <Sparkles className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {timelineLabelForClip(clip, assets)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatFrames(clip.durationInFrames, 30)}
          </div>
        </div>
      </button>

      <button
        type="button"
        className="flex w-9 cursor-ew-resize items-center justify-center rounded-r-2xl border-l border-border/60 bg-background/60 text-muted-foreground transition group-hover:text-foreground"
        onPointerDown={(event) => onResizeStart(event, clip.id, lane)}
        aria-label="Resize clip"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white/70"
        {...attributes}
        {...listeners}
        aria-label="Drag clip"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function TimelineRow({
  lane,
  clips,
  assets,
  pixelsPerFrame,
  onDragEnd,
  sensors,
  selectedClipId,
  onSelectClip,
  onResizeStart,
  title,
}: {
  lane: TimelineLane;
  clips: TimelineClip[];
  assets: EditorAsset[];
  pixelsPerFrame: number;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: SensorDescriptor<SensorOptions>[];
  selectedClipId: string | null;
  onSelectClip: (lane: TimelineLane, clipId: string) => void;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>, clipId: string, lane: TimelineLane) => void;
  title: string;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4 rounded-3xl border border-border/60 bg-card/65 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{clips.length} clips</div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={clips.map((clip) => clip.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex min-h-24 items-stretch gap-3">
            {clips.map((clip) => (
              <LaneClipBlock
                key={clip.id}
                lane={lane}
                clip={clip}
                assets={assets}
                pixelsPerFrame={pixelsPerFrame}
                selected={selectedClipId === clip.id}
                onSelect={() => onSelectClip(lane, clip.id)}
                onResizeStart={onResizeStart}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function VideoEditor({ draft, projectId }: VideoEditorProps) {
  const router = useRouter();
  const playerRef = useRef<PlayerRef>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const assets = (draft.project?.assets || []) as EditorAsset[];
  const template = getTemplateDefinition(draft.templateId);

  const {
    snapshot,
    selectedClipId,
    selectedLane,
    playheadFrame,
    zoom,
    isDirty,
    isPlaying,
    initialize,
    markSaved,
    setPlayheadFrame,
    setZoom,
    setPlaying,
    selectClip,
    updateTheme,
    setRatio,
    setDurationInFrames,
    updateVisualClips,
    updateTextClips,
    updateVisualClip,
    updateTextClip,
    addVisualClip,
    addTextClip,
    removeClip,
    setAudioAsset,
    updateAudioClip,
  } = useEditorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageAssets = useMemo(() => assets.filter((asset) => asset.type !== 'audio'), [assets]);
  const audioAssets = useMemo(() => assets.filter((asset) => asset.type === 'audio'), [assets]);

  useEffect(() => {
    initialize(draft.propsJson, assets);
  }, [assets, draft.propsJson, initialize]);

  const resolved = useMemo(() => {
    if (!snapshot) return null;
    try {
      return resolveDraftSnapshot(snapshot, assets);
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [assets, snapshot]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrameUpdate = ({ detail }: { detail: { frame: number } }) => {
      setPlayheadFrame(detail.frame);
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    player.addEventListener('frameupdate', handleFrameUpdate);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
    };
  }, [resolved, setPlayheadFrame, setPlaying]);

  const pixelsPerFrame = Math.max(1.1, 1.8 * zoom);
  const timelineWidth = snapshot ? Math.max(900, snapshot.durationInFrames * pixelsPerFrame) : 900;

  const selectedVisualClip = snapshot?.tracks.visual.find((clip) => clip.id === selectedClipId) || null;
  const selectedTextClip = snapshot?.tracks.text.find((clip) => clip.id === selectedClipId) || null;
  const selectedAudioClip = snapshot?.tracks.audio.find((clip) => clip.id === selectedClipId) || null;

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleVisualDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!snapshot || !over || active.id === over.id) return;

    const oldIndex = snapshot.tracks.visual.findIndex((clip) => clip.id === active.id);
    const newIndex = snapshot.tracks.visual.findIndex((clip) => clip.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    updateVisualClips(arrayMove(snapshot.tracks.visual, oldIndex, newIndex));
  }

  function handleTextDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!snapshot || !over || active.id === over.id) return;

    const oldIndex = snapshot.tracks.text.findIndex((clip) => clip.id === active.id);
    const newIndex = snapshot.tracks.text.findIndex((clip) => clip.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    updateTextClips(arrayMove(snapshot.tracks.text, oldIndex, newIndex));
  }

  function handleAudioDragEnd() {
    // Single-track audio lane in MVP; drag reordering is intentionally disabled.
  }

  function handleResizeStart(event: React.PointerEvent<HTMLButtonElement>, clipId: string, lane: TimelineLane) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const sourceSnapshot = useEditorStore.getState().snapshot;
    if (!sourceSnapshot) return;

    const clip =
      lane === 'visual'
        ? sourceSnapshot.tracks.visual.find((item) => item.id === clipId)
        : lane === 'text'
          ? sourceSnapshot.tracks.text.find((item) => item.id === clipId)
          : sourceSnapshot.tracks.audio.find((item) => item.id === clipId);

    if (!clip) return;

    const originalDuration = clip.durationInFrames;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaFrames = Math.round((moveEvent.clientX - startX) / pixelsPerFrame / VIDEO_CONFIG.duration.frameStep) * VIDEO_CONFIG.duration.frameStep;
      const nextDuration = Math.max(15, originalDuration + deltaFrames);
      if (lane === 'visual') {
        updateVisualClip(clipId, { durationInFrames: nextDuration });
      } else if (lane === 'text') {
        updateTextClip(clipId, { durationInFrames: nextDuration });
      } else {
        updateAudioClip({ durationInFrames: nextDuration });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function seekFromTimeline(clientX: number) {
    if (!timelineContainerRef.current || !snapshot) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const frame = Math.round((clientX - rect.left + timelineContainerRef.current.scrollLeft) / pixelsPerFrame);
    const bounded = Math.min(snapshot.durationInFrames, Math.max(0, frame));
    setPlayheadFrame(bounded);
    playerRef.current?.seekTo(bounded);
  }

  async function handleSave() {
    if (!snapshot) return false;

    setIsSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const result = await updateVideoDraft(draft.id, snapshot as unknown as Record<string, unknown>);
    setIsSaving(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to save draft.');
      return false;
    }

    markSaved();
    setStatusMessage('Draft saved.');
    return true;
  }

  async function handleExport() {
    if (!snapshot) return;

    const saved = await handleSave();
    if (!saved) return;

    setIsExporting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const result = await startExport(draft.id);
    setIsExporting(false);

    if (!result.success || !result.jobId) {
      setErrorMessage(result.error || 'Failed to queue export.');
      return;
    }

    router.push(`/projects/${projectId}/render/${result.jobId}`);
  }

  if (!snapshot || !resolved) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 h-5 w-5" />
          The draft payload is invalid. Create a fresh draft from the project page.
        </CardContent>
      </Card>
    );
  }

  const selectedVisualAsset = selectedVisualClip
    ? imageAssets.find((asset) => asset.id === selectedVisualClip.assetId)
    : null;
  const selectedAudioAsset = selectedAudioClip
    ? audioAssets.find((asset) => asset.id === selectedAudioClip.assetId)
    : null;
  const unusedVisualAssets = imageAssets.filter(
    (asset) => !snapshot.tracks.visual.some((clip) => clip.assetId === asset.id)
  );
  const activeAudioId = snapshot.tracks.audio[0]?.assetId ?? null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_400px]">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/60 bg-card/90 shadow-[0_32px_90px_-48px_rgba(12,10,28,0.6)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-display text-2xl">{template.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (isPlaying) {
                    playerRef.current?.pause();
                  } else {
                    playerRef.current?.play();
                  }
                }}
              >
                {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : isDirty ? 'Save draft' : 'Saved'}
              </Button>
              <Button type="button" size="sm" onClick={handleExport} disabled={isExporting || isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                {isExporting ? 'Queueing...' : 'Render video'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[28px] border border-border/60 bg-[#070614] p-3 shadow-[0_24px_70px_-42px_rgba(8,7,20,0.8)]">
              <Player
                ref={playerRef}
                component={TimelineComposition}
                inputProps={resolved.props}
                durationInFrames={resolved.snapshot.durationInFrames}
                compositionWidth={resolved.width}
                compositionHeight={resolved.height}
                fps={resolved.snapshot.fps}
                controls
                style={{
                  width: '100%',
                  aspectRatio: `${resolved.width} / ${resolved.height}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              <div>
                Playhead {playheadFrame} / {snapshot.durationInFrames} frames
              </div>
              <div>
                {snapshot.ratio} · {formatFrames(snapshot.durationInFrames, snapshot.fps)} · {snapshot.tracks.visual.length} visual / {snapshot.tracks.text.length} text / {snapshot.tracks.audio.length} audio
              </div>
            </div>

            {statusMessage ? <p className="text-sm text-emerald-600">{statusMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Drag to reorder clips. Resize from the right edge. Click anywhere in the timeline to scrub.
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Label className="text-muted-foreground">Zoom</Label>
                <Input
                  type="range"
                  min="0.7"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-36"
                />
              </div>
            </div>

            <div
              ref={timelineContainerRef}
              className="relative overflow-x-auto rounded-3xl border border-border/60 bg-background/70 p-4"
              onClick={(event) => seekFromTimeline(event.clientX)}
            >
              <div style={{ width: timelineWidth }} className="relative min-w-full space-y-4">
                <div className="relative h-8 rounded-2xl border border-border/50 bg-card/70 px-2">
                  <div className="absolute inset-y-0 left-0 flex items-center gap-0">
                    {Array.from({ length: Math.ceil(snapshot.durationInFrames / 30) + 1 }).map((_, index) => (
                      <div
                        key={index}
                        className="border-l border-border/60 pl-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                        style={{ width: 30 * pixelsPerFrame }}
                      >
                        {index}s
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute inset-y-0 top-10 z-10 w-px bg-primary/80 shadow-[0_0_22px_rgba(144,100,232,0.45)]"
                  style={{ left: playheadFrame * pixelsPerFrame + 16 }}
                />

                <TimelineRow
                  lane="visual"
                  title="Visual"
                  clips={snapshot.tracks.visual}
                  assets={assets}
                  pixelsPerFrame={pixelsPerFrame}
                  onDragEnd={handleVisualDragEnd}
                  sensors={sensors}
                  selectedClipId={selectedClipId}
                  onSelectClip={selectClip}
                  onResizeStart={handleResizeStart}
                />

                <TimelineRow
                  lane="text"
                  title="Text"
                  clips={snapshot.tracks.text}
                  assets={assets}
                  pixelsPerFrame={pixelsPerFrame}
                  onDragEnd={handleTextDragEnd}
                  sensors={sensors}
                  selectedClipId={selectedClipId}
                  onSelectClip={selectClip}
                  onResizeStart={handleResizeStart}
                />

                <TimelineRow
                  lane="audio"
                  title="Audio"
                  clips={snapshot.tracks.audio}
                  assets={assets}
                  pixelsPerFrame={pixelsPerFrame}
                  onDragEnd={handleAudioDragEnd}
                  sensors={sensors}
                  selectedClipId={selectedClipId}
                  onSelectClip={selectClip}
                  onResizeStart={handleResizeStart}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Aspect ratio</Label>
              <Select value={snapshot.ratio} onValueChange={(value) => setRatio(value as DraftSnapshot['ratio'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {template.supportedRatios.map((ratio) => (
                    <SelectItem key={ratio} value={ratio}>
                      {ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (frames)</Label>
              <Input
                type="number"
                min={VIDEO_CONFIG.duration.minFrames}
                max={VIDEO_CONFIG.duration.maxFrames}
                step={VIDEO_CONFIG.duration.frameStep}
                value={snapshot.durationInFrames}
                onChange={(event) => setDurationInFrames(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">Hosted MVP limit: 15 seconds / 720p output.</p>
            </div>

            <div className="space-y-2">
              <Label>Primary color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={snapshot.theme.primaryColor}
                  onChange={(event) => updateTheme({ primaryColor: event.target.value })}
                  className="h-11 w-20"
                />
                <Input
                  value={snapshot.theme.primaryColor}
                  onChange={(event) => updateTheme({ primaryColor: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background</Label>
              <Select
                value={snapshot.theme.backgroundStyle}
                onValueChange={(value) => updateTheme({ backgroundStyle: value as DraftSnapshot['theme']['backgroundStyle'] })}
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
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle>Track actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Add screenshot clip</Label>
              <div className="grid gap-2">
                {unusedVisualAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All uploaded images are already in the sequence.</p>
                ) : (
                  unusedVisualAssets.map((asset) => (
                    <Button
                      key={asset.id}
                      type="button"
                      variant="outline"
                      className="justify-between"
                      onClick={() => addVisualClip(asset.id)}
                    >
                      <span>Add {asset.aspectRatio} image</span>
                      <Plus className="h-4 w-4" />
                    </Button>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Text overlays</Label>
              <Button type="button" variant="outline" className="w-full" onClick={() => addTextClip()}>
                <Plus className="mr-2 h-4 w-4" />
                Add text clip
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Background audio</Label>
              <Select value={activeAudioId ?? '__none__'} onValueChange={(value) => setAudioAsset(value === '__none__' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an uploaded audio track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No audio</SelectItem>
                  {audioAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.type} · {asset.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedVisualClip ? (
              <>
                <div className="space-y-2">
                  <Label>Motion preset</Label>
                  <Select value={selectedVisualClip.motionPreset} onValueChange={(value) => updateVisualClip(selectedVisualClip.id, { motionPreset: value as VisualClip['motionPreset'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drift">Drift</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="pan">Pan</SelectItem>
                      <SelectItem value="stack">Stack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={selectedVisualClip.durationInFrames}
                    onChange={(event) => updateVisualClip(selectedVisualClip.id, { durationInFrames: Number(event.target.value) })}
                  />
                </div>

                {selectedVisualAsset ? (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/70">
                    <img src={selectedVisualAsset.previewUrl} alt="Selected clip" className="aspect-video w-full object-cover" />
                  </div>
                ) : null}

                <Button type="button" variant="ghost" className="w-full text-red-600 hover:text-red-700" onClick={() => removeClip('visual', selectedVisualClip.id)}>
                  Remove visual clip
                </Button>
              </>
            ) : null}

            {selectedTextClip ? (
              <>
                <div className="space-y-2">
                  <Label>Text</Label>
                  <Textarea
                    rows={4}
                    value={selectedTextClip.text}
                    onChange={(event) => updateTextClip(selectedTextClip.id, { text: event.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={selectedTextClip.stylePreset} onValueChange={(value) => updateTextClip(selectedTextClip.id, { stylePreset: value as TextClip['stylePreset'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="headline">Headline</SelectItem>
                        <SelectItem value="caption">Caption</SelectItem>
                        <SelectItem value="cta">CTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Alignment</Label>
                    <Select value={selectedTextClip.align} onValueChange={(value) => updateTextClip(selectedTextClip.id, { align: value as TextClip['align'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={selectedTextClip.durationInFrames}
                    onChange={(event) => updateTextClip(selectedTextClip.id, { durationInFrames: Number(event.target.value) })}
                  />
                </div>

                <Button type="button" variant="ghost" className="w-full text-red-600 hover:text-red-700" onClick={() => removeClip('text', selectedTextClip.id)}>
                  Remove text clip
                </Button>
              </>
            ) : null}

            {selectedAudioClip ? (
              <>
                <div className="space-y-2">
                  <Label>Audio source</Label>
                  <Select value={selectedAudioClip.assetId} onValueChange={(value) => setAudioAsset(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedAudioClip.volume}
                    onChange={(event) => updateAudioClip({ volume: Number(event.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">{Math.round(selectedAudioClip.volume * 100)}%</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fade in</Label>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      step={15}
                      value={selectedAudioClip.fadeInFrames}
                      onChange={(event) => updateAudioClip({ fadeInFrames: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fade out</Label>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      step={15}
                      value={selectedAudioClip.fadeOutFrames}
                      onChange={(event) => updateAudioClip({ fadeOutFrames: Number(event.target.value) })}
                    />
                  </div>
                </div>

                {selectedAudioAsset ? (
                  <p className="text-sm text-muted-foreground">Selected audio asset: {selectedAudioAsset.id.slice(0, 8)}</p>
                ) : null}

                <Button type="button" variant="ghost" className="w-full text-red-600 hover:text-red-700" onClick={() => setAudioAsset(null)}>
                  Remove audio
                </Button>
              </>
            ) : null}

            {!selectedVisualClip && !selectedTextClip && !selectedAudioClip ? (
              <p className="text-sm text-muted-foreground">Select a clip from the timeline to edit its properties.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
