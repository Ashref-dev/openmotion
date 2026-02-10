'use client';

import { useState, useEffect } from 'react';
import { getExportStatus, cancelExport, getVideoDownloadUrl } from '@/app/actions/export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Download, StopCircle, Loader2 } from 'lucide-react';

interface RenderJob {
  id: string;
  videoDraftId: string;
  workflowRunId: string;
  progress: number;
  stage: string;
  logsJson?: string[] | null;
  errorJson?: Record<string, unknown> | null;
  startedAt: Date;
  finishedAt?: Date | null;
}

interface RenderStatusClientProps {
  job: RenderJob | null | undefined;
  runId: string;
  videoDraftId: string;
}

const STAGE_LABELS: Record<string, string> = {
  bundling: 'Bundling Remotion Project',
  rendering: 'Rendering Video',
  encoding: 'Encoding Video',
  uploading: 'Uploading Result',
  completed: 'Completed',
  failed: 'Failed',
  canceled: 'Canceled',
};

const STAGE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bundling: 'secondary',
  rendering: 'secondary',
  encoding: 'secondary',
  uploading: 'secondary',
  completed: 'default',
  failed: 'destructive',
  canceled: 'outline',
};

export function RenderStatusClient({ job: initialJob, runId, videoDraftId }: RenderStatusClientProps) {
  const [job, setJob] = useState(initialJob);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isInProgress = job?.stage && !['completed', 'failed', 'canceled'].includes(job.stage);

  useEffect(() => {
    if (!isInProgress) return;

    const interval = setInterval(async () => {
      const result = await getExportStatus(runId);
      if (result.success && result.job) {
        setJob(result.job);
        
        const updatedStage = result.job.stage;
        if (updatedStage && ['completed', 'failed', 'canceled'].includes(updatedStage)) {
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, isInProgress]);

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this render?')) return;

    setIsCanceling(true);
    const result = await cancelExport(runId);
    setIsCanceling(false);

    if (result.success) {
      const statusResult = await getExportStatus(runId);
      if (statusResult.success && statusResult.job) {
        setJob(statusResult.job);
      }
    } else {
      alert('Failed to cancel export: ' + (result.error || 'Unknown error'));
    }
  }

  async function handleDownload() {
    if (!videoDraftId) {
      alert('Video draft ID not found');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await getVideoDownloadUrl(videoDraftId);
      
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.filename || `video-${videoDraftId.slice(0, 8)}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.error || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Render job not found</p>
        </CardContent>
      </Card>
    );
  }

  const stageLabel = STAGE_LABELS[job.stage] || job.stage;
  const stageColor = STAGE_COLORS[job.stage] || 'default';
  const logs = job.logsJson || [];
  const error = job.errorJson;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Render Status</CardTitle>
            <Badge variant={stageColor}>{stageLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>

          {isInProgress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Rendering in progress...</span>
            </div>
          )}

          {job.stage === 'completed' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Video rendered successfully!</span>
            </div>
          )}

          {job.stage === 'failed' && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Render failed</span>
            </div>
          )}

          {job.stage === 'canceled' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StopCircle className="h-4 w-4" />
              <span>Render was canceled</span>
            </div>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Started</span>
              <span>{new Date(job.startedAt).toLocaleString()}</span>
            </div>
            {job.finishedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Finished</span>
                <span>{new Date(job.finishedAt).toLocaleString()}</span>
              </div>
            )}
            {job.finishedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>
                  {Math.round(
                    (new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000
                  )}{' '}
                  seconds
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-3">
            {isInProgress && (
              <Button onClick={handleCancel} disabled={isCanceling} variant="destructive" size="sm">
                <StopCircle className="mr-2 h-4 w-4" />
                {isCanceling ? 'Canceling...' : 'Cancel Render'}
              </Button>
            )}
            {job.stage === 'completed' && (
              <Button onClick={handleDownload} disabled={isDownloading} size="sm">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Preparing...' : 'Download Video'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Render Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {logs.map((log, idx) => (
                <div key={idx} className="text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
