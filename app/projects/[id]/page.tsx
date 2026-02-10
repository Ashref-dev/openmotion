import { notFound } from 'next/navigation';
import { getProjectById } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssetGallery } from '@/components/asset-gallery';
import { AssetUpload } from '@/components/asset-upload';
import { TemplateSelector } from '@/components/template-selector';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const result = await getProjectById(id);

  if (!result.success || !result.project) {
    notFound();
  }

  const { project } = result;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground mt-2">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetUpload projectId={project.id} />
            <Separator className="my-6" />
            <AssetGallery assets={project.assets || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose a Template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateSelector projectId={project.id} assets={project.assets || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
