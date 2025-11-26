import { View } from 'react-native';
import Icon from '~/components/atoms/Icon';

export const TabBarIcon = (props: {
  name: string;
  color: string;
  focused?: boolean;
  size?: number;
}) => {
  // If focused, use the filled version of the icon by removing '-outline' suffix
  const iconName = props.focused 
    ? props.name.replace('-outline', '') 
    : props.name;
    
  return (
    <View className="mb-[-3px]">
      <Icon 
        name={iconName} 
        size={props.size || 28} 
        color={props.color} 
      />
    </View>
  );
};
