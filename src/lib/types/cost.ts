export type CostSummary = {
  today: number;
  month: number;
  averagePerImage: number;
  mostExpensiveProject: {
    projectId: string | null;
    name: string | null;
    total: number;
  };
};

export type CostLogListItem = {
  id: string;
  projectId: string;
  projectName: string;
  model: string;
  totalPrice: number;
  createdAt: string;
};
