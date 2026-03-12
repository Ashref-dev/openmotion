import Link from 'next/link';
import { listProjects } from '@/app/actions/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateProjectDialog } from '@/components/create-project-dialog';

export default async function ProjectsPage() {
  const { projects } = await listProjects();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Create and manage your video projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <Card className="p-10 text-center">
          <CardContent className="space-y-4">
            <h3 className="font-display text-2xl font-semibold">No projects yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your first project to start making cinematic videos
            </p>
            <CreateProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-32px_rgba(22,12,51,0.55)]">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
