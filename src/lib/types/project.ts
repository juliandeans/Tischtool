export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  userId: string;
  createdAt: string;
};

export type CreateProjectInput = {
  name: string;
  description: string | null;
};
