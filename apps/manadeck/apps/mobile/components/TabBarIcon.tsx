import { Icon } from './ui/Icon';

export const TabBarIcon = (props: { name: string; color: string }) => {
  return (
    <Icon
      name={props.name}
      color={props.color}
      size={28}
      library="FontAwesome"
      className="mb-[-3px]"
    />
  );
};
