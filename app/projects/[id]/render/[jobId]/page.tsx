import { notFound } from 'next/navigation';
import { getExportStatus } from '@/app/actions/export';
import { RenderStatusClient } from '@/components/render-status-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface RenderPageProps {
  params: Promise<{ id: string; jobId: string }>;
}

export default async function RenderPage({ params }: RenderPageProps) {
  const { id, jobId } = await params;
  const result = await getExportStatus(jobId);

  if (!result.success) {
    notFound();
  }

  const { job } = result;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      <RenderStatusClient job={job} jobId={jobId} videoDraftId={job?.videoDraftId || ''} />
    </div>
  );
}
