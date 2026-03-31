import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Button from '~/components/atoms/Button';

interface ToolbarAction {
	icon: string;
	label: string;
	onPress: () => void;
	color?: string;
	variant?: 'primary' | 'secondary' | 'danger';
}

interface ToolbarProps {
	// Position options
	position: 'top' | 'bottom';

	// Layout options
	layout?: 'row' | 'column';

	// Content options
	title?: string;
	primaryActions?: ToolbarAction[];
	secondaryActions?: ToolbarAction[];
	additionalActions?: ToolbarAction[];

	// For selection toolbar specific
	selectedCount?: number;

	// For edit toolbar specific
	onSave?: () => void;
	onCancel?: () => void;

	// Style options
	scrollable?: boolean;
	className?: string;
	backgroundColor?: string;
	disableAbsolutePosition?: boolean;
}

/**
 * A unified toolbar component that can be used for various purposes like
 * editing, selection, or other actions. It can be positioned at the top or bottom
 * of the screen and can have different layouts.
 */
const Toolbar = ({
	position = 'top',
	layout = 'row',
	title,
	primaryActions = [],
	secondaryActions = [],
	additionalActions = [],
	selectedCount,
	onSave,
	onCancel,
	scrollable = false,
	className = '',
	backgroundColor,
	disableAbsolutePosition = false,
}: ToolbarProps): React.ReactElement => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	// Dynamic classes based on theme
	const containerBgClass = isDark ? 'bg-gray-800' : 'bg-gray-200';
	const textColorClass = isDark ? 'text-white' : 'text-black';

	// Use custom background color if provided
	const finalBackgroundColor = backgroundColor || (isDark ? '#1F1F1F' : '#E5E5EA');

	// Position classes
	const positionClass =
		position === 'top' ? 'top-0 left-0 right-0 z-50' : 'bottom-0 left-0 right-0 z-50';

	// Layout classes
	const layoutClass = layout === 'row' ? 'flex-row justify-between' : 'flex-col justify-center';

	// Prepare actions
	const allActions = [
		...(onCancel
			? [
					{
						icon: 'close-outline',
						label: t('common.cancel', 'Cancel'),
						onPress: onCancel,
						variant: 'secondary' as const,
					},
				]
			: []),
		...primaryActions,
		...additionalActions,
		...(onSave
			? [
					{
						icon: 'checkmark-outline',
						label: t('common.save', 'Save'),
						onPress: onSave,
						variant: 'primary' as const,
					},
				]
			: []),
		...secondaryActions,
	];

	// Render the content
	const renderContent = () => {
		// If we have a selection count, show title, actions, and count
		if (selectedCount !== undefined) {
			return (
				<>
					<Text className={`text-base font-medium mb-3 ml-3 ${textColorClass}`}>
						{selectedCount === 1
							? t('memo.process_selected_singular', 'Ausgewähltes {{count}} Memo verarbeiten:', {
									count: selectedCount,
								})
							: t('memo.process_selected_plural', 'Ausgewählte {{count}} Memos verarbeiten:', {
									count: selectedCount,
								})}
					</Text>

					{renderActions()}
				</>
			);
		}

		// If we have a title, show it
		if (title) {
			return (
				<>
					<Text className={`text-base font-medium mb-3 ml-3 ${textColorClass}`}>{title}</Text>

					{renderActions()}
				</>
			);
		}

		// Otherwise just show the actions
		return renderActions();
	};

	// Render the actions
	const renderActions = () => {
		if (scrollable) {
			return (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: 8,
						paddingLeft: 12,
						paddingRight: 12,
					}}
					style={{
						width: '100%',
						flexGrow: 1,
					}}
				>
					{allActions.map((action, index) => renderAction(action, index))}
				</ScrollView>
			);
		}

		if (layout === 'row') {
			return (
				<>
					{/* Left side */}
					{onCancel && (
						<Button
							title={t('common.cancel', 'Cancel')}
							variant="secondary"
							iconName="close-outline"
							onPress={onCancel}
						/>
					)}

					{/* Middle section - Additional actions */}
					<View className="flex-row gap-2">
						{additionalActions.map((action, index) => (
							<Button
								key={`action-${index}`}
								title={action.label}
								iconName={action.icon}
								style={{ backgroundColor: action.color || '#007AFF' }}
								onPress={action.onPress}
							/>
						))}
					</View>

					{/* Right side */}
					{onSave && (
						<Button
							title={t('common.save', 'Save')}
							variant="primary"
							iconName="checkmark-outline"
							onPress={onSave}
						/>
					)}
				</>
			);
		}

		return (
			<View className="flex-row flex-wrap gap-2 px-3">
				{allActions.map((action, index) => renderAction(action, index))}
			</View>
		);
	};

	// Render a single action
	const renderAction = (action: ToolbarAction, index: number) => {
		// Always use the Button component for consistency
		return (
			<Button
				key={`action-${index}`}
				title={action.label}
				iconName={action.icon}
				variant={action.variant || 'primary'}
				style={action.color ? { backgroundColor: action.color } : undefined}
				onPress={action.onPress}
			/>
		);
	};

	if (disableAbsolutePosition) {
		return (
			<View
				className={`${layoutClass} items-center px-0 py-4 w-full`}
				style={{ backgroundColor: finalBackgroundColor }}
			>
				{renderContent()}
			</View>
		);
	}

	return (
		<View className={`absolute ${positionClass} px-4 py-2 ${className}`}>
			<View
				className={`${layoutClass} items-center px-4 py-3 rounded-xl w-full ${containerBgClass} shadow-md`}
				style={{ elevation: 5 }}
			>
				{renderContent()}
			</View>
		</View>
	);
};

export default Toolbar;
