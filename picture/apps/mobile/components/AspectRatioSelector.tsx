import React from 'react';
import { OptionSelector, OptionItem } from './OptionSelector';

export type AspectRatio = {
  label: string;
  value: string;
  width: number;
  height: number;
  icon: string;
};

type AspectRatioSelectorProps = {
  aspectRatios: AspectRatio[];
  selectedAspectRatio: AspectRatio;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  disabled?: boolean;
};

export function AspectRatioSelector({
  aspectRatios,
  selectedAspectRatio,
  onSelectAspectRatio,
  disabled = false,
}: AspectRatioSelectorProps) {
  // Convert aspect ratios to OptionItems
  const options: OptionItem[] = aspectRatios.map(ratio => ({
    id: ratio.value,
    label: ratio.label,
    subtitle: `${ratio.width}×${ratio.height}`,
  }));

  // Handle selection
  const handleSelect = (option: OptionItem) => {
    const ratio = aspectRatios.find(r => r.value === option.id);
    if (ratio) {
      onSelectAspectRatio(ratio);
    }
  };

  return (
    <OptionSelector
      options={options}
      selectedId={selectedAspectRatio.value}
      onSelect={handleSelect}
      disabled={disabled}
      minWidth={80}
      title="Seitenverhältnis"
    />
  );
}
