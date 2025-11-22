import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

const getVariantClasses = (variant: TextVariant): string => {
  switch (variant) {
    case 'h1':
      return 'text-4xl font-bold';
    case 'h2':
      return 'text-3xl font-bold';
    case 'h3':
      return 'text-2xl font-semibold';
    case 'h4':
      return 'text-xl font-semibold';
    case 'body':
      return 'text-base';
    case 'caption':
      return 'text-sm';
    case 'small':
      return 'text-xs';
    default:
      return 'text-base';
  }
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = getVariantClasses(variant);
  const combinedClassName = `${variantClasses} ${className}`.trim();

  return (
    <RNText className={combinedClassName} {...props}>
      {children}
    </RNText>
  );
};
