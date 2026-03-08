export type PresetCategory = 'style' | 'light' | 'environment';

export type PresetOption = {
  value: string;
  label: string;
};

export type PresetSummary = {
  id: string;
  userId: string | null;
  category: PresetCategory;
  name: string;
  promptFragment: string;
  isDefault: boolean;
  createdAt: string;
};
