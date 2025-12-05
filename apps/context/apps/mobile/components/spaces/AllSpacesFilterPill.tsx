import React from 'react';
import { useRouter } from 'expo-router';
import { FilterPill } from '~/components/ui/FilterPill';

interface AllSpacesFilterPillProps {
	isSelected: boolean;
	onPress: () => void;
}

export const AllSpacesFilterPill: React.FC<AllSpacesFilterPillProps> = ({
	isSelected,
	onPress,
}) => {
	const router = useRouter();

	const navigateToAllSpaces = () => {
		router.push('/spaces');
	};

	return (
		<FilterPill
			label="Alle"
			isSelected={isSelected}
			variant="space"
			onPress={onPress}
			actionButton={{
				icon: 'chevron-forward',
				onPress: navigateToAllSpaces,
			}}
		/>
	);
};
