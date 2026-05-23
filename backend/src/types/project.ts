export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
}

export type CreateProjectBody = {
  name: string;
  description?: string;
  status?: ProjectStatus;
};
