export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: 'ACTIVE', color: '#3fb96e' },
  paused: { label: 'PAUSED', color: '#d4a017' },
  completed: { label: 'DONE', color: '#6b8fd6' },
};
