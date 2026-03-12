'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
});

export async function createProject(name: string) {
  const validation = createProjectSchema.safeParse({ name });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Invalid input' };
  }
  try {
    const [project] = await db
      .insert(projects)
      .values({ name })
      .returning();

    revalidatePath('/projects');
    return { success: true, project };
  } catch (error) {
    console.error('Failed to create project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

export async function listProjects() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return { success: true, projects: allProjects };
  } catch (error) {
    console.error('Failed to list projects:', error);
    return { success: false, error: 'Failed to list projects', projects: [] };
  }
}

export async function getProjectById(projectId: string) {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        assets: true,
        videoDrafts: {
          with: {
            template: true,
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project };
  } catch (error) {
    console.error('Failed to get project:', error);
    return { success: false, error: 'Failed to get project' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    await db.delete(projects).where(eq(projects.id, projectId));

    revalidatePath('/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}
