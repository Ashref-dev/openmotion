import { notFound } from 'next/navigation';
import { getVideoDraft } from '@/app/actions/video-drafts';
import { VideoEditor } from '@/components/video-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditorPageProps {
  params: Promise<{ id: string; draftId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id, draftId } = await params;
  const result = await getVideoDraft(draftId);

  if (!result.success || !result.draft) {
    notFound();
  }

  const { draft } = result;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          {draft.template?.name || 'Template'} • {draft.ratio} • {draft.fps}fps
        </div>
      </div>

      <VideoEditor draft={draft} projectId={id} />
    </div>
  );
}
