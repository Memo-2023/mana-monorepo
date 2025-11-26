import { View } from 'react-native';
import { Text } from '~/components/Text';

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  padding?: number;
};

export function EmptyState({
  icon,
  title,
  description,
  padding = 32
}: EmptyStateProps) {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding,
    }}>
      <Text style={{ fontSize: 60, marginBottom: 16 }}>{icon}</Text>
      <Text variant="h3" color="primary" align="center" style={{ marginBottom: 8 }}>
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {description}
      </Text>
    </View>
  );
}
