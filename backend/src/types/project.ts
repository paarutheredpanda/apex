export type ProjectStatus = "active" | "paused" | "completed";

export interface CreateProjectBody {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectBody {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}