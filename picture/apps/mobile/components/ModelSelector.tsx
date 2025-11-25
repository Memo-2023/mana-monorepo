import React from 'react';
import { OptionSelector, OptionItem } from './OptionSelector';

export type Model = {
  id: string;
  display_name: string;
  version: string;
  estimated_time_seconds: number;
  description?: string;
};

type ModelSelectorProps = {
  models: Model[];
  selectedModel: Model | null;
  onSelectModel: (model: Model) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
};

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  loading = false,
  error = null,
  onRetry,
  disabled = false,
}: ModelSelectorProps) {
  // Convert models to OptionItems
  const options: OptionItem[] = models.map(model => ({
    id: model.id,
    label: model.display_name,
    subtitle: `~${model.estimated_time_seconds}s`,
    description: model.description,
  }));

  // Handle selection
  const handleSelect = (option: OptionItem) => {
    const model = models.find(m => m.id === option.id);
    if (model) {
      onSelectModel(model);
    }
  };

  return (
    <OptionSelector
      options={options}
      selectedId={selectedModel?.id || null}
      onSelect={handleSelect}
      loading={loading}
      error={error}
      onRetry={onRetry}
      disabled={disabled}
      title="Modell"
    />
  );
}
