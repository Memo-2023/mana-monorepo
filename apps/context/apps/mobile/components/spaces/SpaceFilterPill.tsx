import React from 'react';
import { useRouter } from 'expo-router';
import { FilterPill } from '~/components/ui/FilterPill';

interface SpaceFilterPillProps {
	id: string;
	name: string;
	isSelected: boolean;
	onPress: (id: string | null) => void;
}

export const SpaceFilterPill: React.FC<SpaceFilterPillProps> = ({
	id,
	name,
	isSelected,
	onPress,
}) => {
	const router = useRouter();

	const navigateToSpace = () => {
		router.push(`/spaces/${id}`);
	};

	return (
		<FilterPill
			label={name}
			isSelected={isSelected}
			variant="space"
			onPress={() => onPress(id)}
			actionButton={{
				icon: 'chevron-forward',
				onPress: navigateToSpace,
			}}
		/>
	);
};
