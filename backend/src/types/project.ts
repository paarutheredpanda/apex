import type { ProjectStatus } from '../generated/prisma/enums';

export type { ProjectStatus };

export type CreateProjectBody = {
  name: string;
  description?: string;
  status?: ProjectStatus;
};
