import { create } from 'zustand';
import { VIDEO_CONFIG, type AspectRatio } from '@/lib/config';
import {
  normalizeDraftSnapshot,
  type AudioClip,
  type DraftSnapshot,
  type ProjectAssetLike,
  type TextClip,
  type VisualClip,
} from '@/lib/video/draft-schema';

export type TimelineLane = 'visual' | 'text' | 'audio';

export interface EditorAsset extends ProjectAssetLike {
  previewUrl: string;
  sourceUrl: string;
}

interface EditorState {
  assets: EditorAsset[];
  snapshot: DraftSnapshot | null;
  selectedClipId: string | null;
  selectedLane: TimelineLane | null;
  playheadFrame: number;
  zoom: number;
  isDirty: boolean;
  isPlaying: boolean;
  initialize: (snapshot: DraftSnapshot, assets: EditorAsset[]) => void;
  replaceSnapshot: (snapshot: DraftSnapshot) => void;
  markSaved: () => void;
  setPlayheadFrame: (frame: number) => void;
  setZoom: (zoom: number) => void;
  setPlaying: (playing: boolean) => void;
  selectClip: (lane: TimelineLane, clipId: string | null) => void;
  updateTheme: (theme: Partial<DraftSnapshot['theme']>) => void;
  setRatio: (ratio: AspectRatio) => void;
  setDurationInFrames: (durationInFrames: number) => void;
  updateVisualClips: (clips: VisualClip[]) => void;
  updateTextClips: (clips: TextClip[]) => void;
  updateVisualClip: (clipId: string, patch: Partial<VisualClip>) => void;
  updateTextClip: (clipId: string, patch: Partial<TextClip>) => void;
  addVisualClip: (assetId: string) => void;
  addTextClip: () => void;
  removeClip: (lane: TimelineLane, clipId: string) => void;
  setAudioAsset: (assetId: string | null) => void;
  updateAudioClip: (patch: Partial<AudioClip>) => void;
}

function reflowLane<T extends { startFrame: number; durationInFrames: number }>(clips: T[]) {
  let startFrame = 0;
  return clips.map((clip) => {
    const nextClip = {
      ...clip,
      startFrame,
    };
    startFrame += clip.durationInFrames;
    return nextClip;
  });
}

function clampFrame(frame: number, durationInFrames: number) {
  return Math.min(Math.max(0, Math.round(frame)), durationInFrames);
}

function updateSnapshot(snapshot: DraftSnapshot, updater: (snapshot: DraftSnapshot) => DraftSnapshot) {
  return normalizeDraftSnapshot(updater(snapshot));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  assets: [],
  snapshot: null,
  selectedClipId: null,
  selectedLane: null,
  playheadFrame: 0,
  zoom: 1,
  isDirty: false,
  isPlaying: false,
  initialize: (snapshot, assets) => {
    set({
      snapshot,
      assets,
      selectedClipId: snapshot.tracks.visual[0]?.id ?? snapshot.tracks.text[0]?.id ?? null,
      selectedLane: snapshot.tracks.visual[0] ? 'visual' : snapshot.tracks.text[0] ? 'text' : null,
      playheadFrame: 0,
      zoom: 1,
      isDirty: false,
      isPlaying: false,
    });
  },
  replaceSnapshot: (snapshot) => set({ snapshot, isDirty: true }),
  markSaved: () => set({ isDirty: false }),
  setPlayheadFrame: (frame) => {
    const snapshot = get().snapshot;
    set({ playheadFrame: snapshot ? clampFrame(frame, snapshot.durationInFrames) : 0 });
  },
  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.7, zoom)) }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  selectClip: (lane, clipId) => set({ selectedLane: lane, selectedClipId: clipId }),
  updateTheme: (theme) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        theme: {
          ...current.theme,
          ...theme,
        },
      })),
      isDirty: true,
    });
  },
  setRatio: (ratio) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({ ...current, ratio })),
      isDirty: true,
    });
  },
  setDurationInFrames: (durationInFrames) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    const nextDuration = Math.min(
      VIDEO_CONFIG.duration.maxFrames,
      Math.max(VIDEO_CONFIG.duration.minFrames, durationInFrames)
    );
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        durationInFrames: nextDuration,
      })),
      isDirty: true,
    });
  },
  updateVisualClips: (clips) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          visual: reflowLane(clips),
        },
      })),
      isDirty: true,
    });
  },
  updateTextClips: (clips) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          text: reflowLane(clips),
        },
      })),
      isDirty: true,
    });
  },
  updateVisualClip: (clipId, patch) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    const clips = snapshot.tracks.visual.map((clip) =>
      clip.id === clipId
        ? {
            ...clip,
            ...patch,
            durationInFrames: Math.max(15, Math.round((patch.durationInFrames ?? clip.durationInFrames) / 15) * 15),
          }
        : clip
    );
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          visual: reflowLane(clips),
        },
      })),
      isDirty: true,
    });
  },
  updateTextClip: (clipId, patch) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    const clips = snapshot.tracks.text.map((clip) =>
      clip.id === clipId
        ? {
            ...clip,
            ...patch,
            durationInFrames: Math.max(15, Math.round((patch.durationInFrames ?? clip.durationInFrames) / 15) * 15),
          }
        : clip
    );
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          text: reflowLane(clips),
        },
      })),
      isDirty: true,
    });
  },
  addVisualClip: (assetId) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    const nextVisuals = reflowLane([
      ...snapshot.tracks.visual,
      {
        id: `visual-${crypto.randomUUID()}`,
        assetId,
        startFrame: snapshot.durationInFrames,
        durationInFrames: 60,
        motionPreset: 'drift',
        transitionAfter: 'fade',
      },
    ]);
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          visual: nextVisuals,
        },
      })),
      isDirty: true,
      selectedClipId: nextVisuals[nextVisuals.length - 1]?.id ?? null,
      selectedLane: 'visual',
    });
  },
  addTextClip: () => {
    const snapshot = get().snapshot;
    if (!snapshot) return;
    const nextTexts = reflowLane([
      ...snapshot.tracks.text,
      {
        id: `text-${crypto.randomUUID()}`,
        startFrame: snapshot.durationInFrames,
        durationInFrames: 60,
        text: 'New text overlay',
        stylePreset: 'caption',
        align: 'left',
      },
    ]);
    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          text: nextTexts,
        },
      })),
      isDirty: true,
      selectedClipId: nextTexts[nextTexts.length - 1]?.id ?? null,
      selectedLane: 'text',
    });
  },
  removeClip: (lane, clipId) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;

    if (lane === 'visual') {
      const nextClips = snapshot.tracks.visual.filter((clip) => clip.id !== clipId);
      if (nextClips.length === 0) return;
      set({
        snapshot: updateSnapshot(snapshot, (current) => ({
          ...current,
          tracks: {
            ...current.tracks,
            visual: reflowLane(nextClips),
          },
        })),
        isDirty: true,
      });
      return;
    }

    if (lane === 'text') {
      set({
        snapshot: updateSnapshot(snapshot, (current) => ({
          ...current,
          tracks: {
            ...current.tracks,
            text: reflowLane(current.tracks.text.filter((clip) => clip.id !== clipId)),
          },
        })),
        isDirty: true,
      });
      return;
    }

    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          audio: [],
        },
      })),
      isDirty: true,
    });
  },
  setAudioAsset: (assetId) => {
    const snapshot = get().snapshot;
    if (!snapshot) return;

    const nextAudio = assetId
      ? [
          {
            id: `audio-${crypto.randomUUID()}`,
            assetId,
            startFrame: 0,
            durationInFrames: snapshot.durationInFrames,
            volume: 0.7,
            fadeInFrames: 15,
            fadeOutFrames: 30,
          },
        ]
      : [];

    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          audio: nextAudio,
        },
      })),
      isDirty: true,
      selectedClipId: nextAudio[0]?.id ?? null,
      selectedLane: nextAudio[0] ? 'audio' : null,
    });
  },
  updateAudioClip: (patch) => {
    const snapshot = get().snapshot;
    if (!snapshot || snapshot.tracks.audio.length === 0) return;

    const [clip] = snapshot.tracks.audio;
    const nextClip: AudioClip = {
      ...clip,
      ...patch,
      startFrame: patch.startFrame ?? clip.startFrame,
      durationInFrames: Math.max(15, Math.round((patch.durationInFrames ?? clip.durationInFrames) / 15) * 15),
      volume: patch.volume ?? clip.volume,
      fadeInFrames: patch.fadeInFrames ?? clip.fadeInFrames,
      fadeOutFrames: patch.fadeOutFrames ?? clip.fadeOutFrames,
    };

    set({
      snapshot: updateSnapshot(snapshot, (current) => ({
        ...current,
        tracks: {
          ...current.tracks,
          audio: [nextClip],
        },
      })),
      isDirty: true,
    });
  },
}));
