# OpenMotion

**Convert screenshots into cinematic animated videos** — Production-ready Next.js application powered by Remotion.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![Remotion](https://img.shields.io/badge/Remotion-4.0.407-blue)](https://www.remotion.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.1-green)](https://orm.drizzle.team/)

---

## Overview

**OpenMotion** transforms your product screenshots, landing pages, or brand assets into professional animated videos using pre-built templates. This is **Milestone 1: Template Mode** — 12 carefully crafted templates optimized for different use cases.

### Key Features

[DONE] **12 Pre-built Templates** across 4 categories  
[DONE] **Drag-and-drop asset management** with deduplication  
[DONE] **Real-time preview** with Remotion Player  
[DONE] **Customizable properties** (aspect ratio, duration, FPS, colors)  
[DONE] **Background rendering** with progress tracking  
[DONE] **Local file storage** (no cloud dependencies)  
[DONE] **Type-safe** with TypeScript strict mode  
[DONE] **Production-ready** build (verified)

---

## >> Quick Start

### Prerequisites

- **Bun** (>= 1.0) — [Install Bun](https://bun.sh/)
- **PostgreSQL** (>= 14) — [Install PostgreSQL](https://www.postgresql.org/download/)
- **Node.js** (>= 18) — Only needed for certain Remotion operations

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openmotion.git
cd openmotion

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Create database
createdb openmotion

# Push schema and seed templates
DATABASE_URL="postgresql://user@localhost:5432/openmotion" bun run db:push
DATABASE_URL="postgresql://user@localhost:5432/openmotion" bun run db:seed

# Start development server
DATABASE_URL="postgresql://user@localhost:5432/openmotion" bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

##  Available Scripts

```bash
# Development
bun run dev              # Start dev server with Turbopack
bun run build            # Production build
bun run start            # Start production server
bun run lint             # Run ESLint

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema to database (quick)
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed 12 templates

# Type Checking
bunx tsc --noEmit        # Check TypeScript errors
```

---

##  Template Categories

OpenMotion includes **12 templates** across **4 categories**:

### 1. Minimal Hero (T1-T3)
**Best for**: Hero sections, single-screen highlights  
**Assets needed**: 1-2 images  
**Duration**: 3-5 seconds

- **Hero Drift** — Subtle pan with elegant fade
- **Hero Copy** — Dynamic text reveal with image
- **Hero ZoomCut** — Cinematic zoom with cut transition

### 2. Landing Showcase (T4-T6)
**Best for**: Multi-screen flows, landing pages  
**Assets needed**: 3-6 images  
**Duration**: 8-12 seconds

- **Smooth Carousel** — Seamless horizontal carousel
- **Stack Reveal** — Layered card reveal effect
- **Split Showcase** — Side-by-side split transitions

### 3. Brand Product (T7-T9)
**Best for**: Product launches, brand identity  
**Assets needed**: Logo + 2-5 screenshots  
**Duration**: 10-15 seconds

- **Logo → Hero** — Logo intro to product showcase
- **Brand Carousel** — Branded carousel with logo overlay
- **Clean End Card** — Professional ending with logo

### 4. Fast Reels (T10-T12)
**Best for**: Social media (Instagram, TikTok)  
**Assets needed**: 3-6 images  
**Duration**: 7-15 seconds  
**Optimized for**: 9:16 (vertical)

- **7-Second Reel** — Quick-cut vertical carousel
- **Feature Beats** — Rhythmic feature highlights
- **Dark Premium** — Premium dark theme with gold accents

---

## Architecture Architecture

```
openmotion/
├── app/                      # Next.js App Router
│   ├── actions/              # Server actions (projects, assets, drafts, export)
│   ├── projects/             # Main application routes
│   │   ├── page.tsx          # Projects list
│   │   └── [id]/
│   │       ├── page.tsx      # Project detail (upload, templates)
│   │       ├── editor/       # Timeline editor
│   │       └── render/       # Render status
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind v4 styles
│
├── components/               # React components
│   ├── ui/                   # shadcn/ui primitives
│   ├── video-editor.tsx      # Remotion Player + controls
│   ├── render-status-client.tsx  # Progress polling
│   ├── asset-gallery.tsx     # Image grid
│   ├── asset-upload.tsx      # File upload
│   └── template-selector.tsx # Template picker
│
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (5 tables)
│   │   ├── seed/             # Template seeds
│   │   └── index.ts          # DB connection
│   ├── rendering/
│   │   ├── render-engine.ts  # Main render function
│   │   ├── browser-manager.ts # Chromium helpers
│   │   └── logger.ts         # Structured logging
│   └── storage/
│       ├── local.ts          # File operations
│       └── image-processor.ts # Sharp processing
│
├── remotion/
│   ├── scenes/               # 6 scene primitives
│   │   ├── carousel.tsx
│   │   ├── drift.tsx
│   │   ├── logo-intro.tsx
│   │   ├── split-screen.tsx
│   │   ├── stack-reveal.tsx
│   │   └── zoom-cut.tsx
│   ├── utils/
│   │   └── motion.ts         # Constrained animations
│   ├── DynamicVideo.tsx      # Main composition
│   └── Root.tsx              # Remotion root
│
├── workflows/
│   ├── render-video.ts       # Main workflow
│   └── render-steps.ts       # 7 step functions
│
└── public/uploads/           # Local storage
    ├── original/
    ├── processed/
    └── renders/
```

---

##  Tech Stack

### Frontend
- **Next.js 15.1.6** — App Router, Server Actions, RSC
- **React 19** — Latest React features
- **Remotion 4.0.407** — Video rendering and preview
- **Tailwind CSS v4** — Utility-first styling
- **shadcn/ui** — High-quality component library
- **TypeScript 5.9** — Strict type checking

### Backend
- **Drizzle ORM** — Type-safe database queries
- **PostgreSQL** — Primary database
- **Sharp** — Image processing (resize, optimize)
- **Vercel Workflow** — Durable background jobs (beta)

### Build & Dev Tools
- **Bun** — Fast JavaScript runtime and package manager
- **Turbopack** — Next.js dev server (faster than Webpack)
- **ESLint** — Code linting
- **PostCSS** — CSS processing

---

## 📊 Database Schema

```typescript
// 5 tables: projects, assets, templates, videoDrafts, renderJobs

projects
  id: uuid (PK)
  name: string
  userId: string (future: auth)
  createdAt, updatedAt

assets
  id: uuid (PK)
  projectId: uuid (FK → projects)
  originalS3Key: string (local path)
  processedS3Key: string (local path)
  hash: string (deduplication)
  aspectRatio: decimal
  width, height: integer
  createdAt

templates
  id: string (PK, e.g., "t1-hero-drift")
  name: string
  category: enum (4 categories)
  aspectRatio: enum (16:9, 9:16, 1:1, 4:5)
  durationSeconds: integer
  fps: integer (30 or 60)
  minAssets, maxAssets: integer
  propsSchema: json (Zod schema)

videoDrafts
  id: uuid (PK)
  projectId: uuid (FK → projects)
  templateId: string (FK → templates)
  propsJson: json (Remotion props)
  status: enum (draft, rendering, complete, failed)
  ratio: enum
  fps: integer
  createdAt, updatedAt

renderJobs
  id: uuid (PK)
  videoDraftId: uuid (FK → videoDrafts)
  workflowRunId: string (Vercel workflow)
  status: enum (pending, bundling, rendering, complete, failed)
  progress: decimal (0-100)
  stage: string (current step)
  logsJson: json (structured logs)
  outputS3Key: string (when complete)
  sizeInBytes: bigint
  createdAt, updatedAt
```

---

##  How It Works

### 1. Project Creation
User creates a project → stored in `projects` table.

### 2. Asset Upload
- User uploads screenshots (JPG/PNG/WebP)
- Sharp processes images (resize, optimize, hash)
- Deduplicated by hash → stored in `assets` table
- Files saved to `public/uploads/original/` and `public/uploads/processed/`

### 3. Template Selection
- User selects from 12 templates
- System validates: min/max asset requirements
- Creates `videoDraft` with initial props

### 4. Timeline Editor
- Remotion Player previews video in real-time
- User adjusts properties (colors, duration, fps)
- Changes saved to `videoDraft.propsJson`

### 5. Video Export
- User clicks "Export Video"
- Creates `renderJob` with unique `workflowRunId`
- Triggers Vercel workflow (background)

### 6. Render Workflow
```typescript
// workflows/render-video.ts
"use workflow";  // Vercel durable workflow

1. Load draft + assets from DB
2. Bundle Remotion project (webpack)
3. Select composition (template)
4. Render video (Chromium headless)
5. Save result to public/uploads/renders/
6. Update job status → complete
7. Cleanup temp files
```

### 7. Render Status
- User redirected to `/projects/[id]/render/[runId]`
- Page polls every 2 seconds for updates
- Displays: progress bar, current stage, logs
- When complete: download button appears

---

##  API Routes & Server Actions

### Server Actions (app/actions/)

```typescript
// projects.ts
createProject(name: string) → { id, name, userId }
getProjects() → Project[]
getProject(id: string) → Project

// assets.ts
uploadAssets(projectId: string, files: File[]) → Asset[]
getAssets(projectId: string) → Asset[]

// video-drafts.ts
createVideoDraft(data: CreateDraftInput) → VideoDraft
updateVideoDraft(id: string, propsJson: object) → VideoDraft
getVideoDraft(id: string) → VideoDraft

// export.ts
startExport(videoDraftId: string) → { success, runId, jobId }
getRenderStatus(runId: string) → RenderJob
cancelRender(runId: string) → { success }
```

---

##  Customization

### Adding New Templates

1. **Create scene primitive** in `remotion/scenes/`
2. **Define props schema** with Zod
3. **Add template seed** to `lib/db/seed/templates.ts`
4. **Test with Remotion Player**
5. **Seed database**: `bun run db:seed`

Example:
```typescript
// lib/db/seed/templates.ts
{
  id: 't13-custom',
  name: 'Custom Template',
  category: 'minimal-hero',
  aspectRatio: '16:9',
  durationSeconds: 5,
  fps: 30,
  minAssets: 1,
  maxAssets: 1,
  propsSchema: {
    type: 'object',
    properties: {
      primaryColor: { type: 'string', default: '#FF0000' },
      // ...
    },
  },
}
```

### Modifying Scene Animations

All animations use **constrained motion** (`remotion/utils/motion.ts`):

```typescript
import { drift, easeInOut } from '@/remotion/utils/motion';

// Horizontal drift (constrained to 5% of width)
const x = drift(frame, fps, durationInFrames, 0.05);

// Smooth easing
const opacity = easeInOut(frame, 0, 30, 0, 1);
```

---

##  Testing

### Manual Testing (Completed [DONE])
- **7/7 flows passed** (100% pass rate)
- **0 critical bugs** found
- **Full report**: `docs/openmotion/E2E_Test_Report_20260122.md`

### Automated Testing (TODO)
```bash
# Unit tests (future)
bun test

# Integration tests (future)
bun test:integration
```

---

## >> Deployment

### Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/openmotion
NODE_ENV=production
```

### Production Build

```bash
# Build and verify
bun run build
bun run start  # Test production build locally

# Deploy to Vercel (recommended)
vercel --prod
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

---

## Security Security Notes

- **No authentication** in Milestone 1 (single-user mode)
- **Local file storage** (no AWS S3 credentials needed)
- **SQL injection protected** by Drizzle ORM parameterization
- **File upload validation** (type, size, hash)

**For production**:
- Add authentication (Clerk, NextAuth, etc.)
- Move to cloud storage (S3, R2)
- Add rate limiting
- Implement CSRF protection

---

## Roadmap Roadmap

### Milestone 1: Template Mode [DONE] (Current)
- [x] 12 pre-built templates
- [x] Asset management
- [x] Timeline editor
- [x] Background rendering
- [x] E2E testing

### Milestone 2: AI Agent (Future)
- [ ] Natural language → video generation
- [ ] AI template selection
- [ ] Smart asset cropping
- [ ] Voice-over integration

### Milestone 3: Advanced Features (Future)
- [ ] Multi-user authentication
- [ ] Team collaboration
- [ ] Custom fonts and branding
- [ ] Audio track support
- [ ] Batch rendering

---

##  Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  License

MIT License — See [LICENSE](LICENSE) for details.

---

##  Acknowledgments

- **Remotion** — Incredible video rendering library
- **Next.js** — Best React framework
- **shadcn/ui** — Beautiful component library
- **Drizzle** — Developer-friendly ORM

---

##  Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/openmotion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/openmotion/discussions)

---

**Built with  by [Your Name]**
