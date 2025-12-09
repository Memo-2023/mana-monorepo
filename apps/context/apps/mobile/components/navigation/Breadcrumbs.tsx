import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	TouchableOpacity,
	Modal,
	ScrollView,
	findNodeHandle,
	UIManager,
	Pressable,
	Platform,
	StyleSheet,
	TextInput,
} from 'react-native';
import { Text } from '~/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { Card } from '~/components/ui/Card';
import { useTheme, twMerge, useThemeClasses } from '~/utils/theme/theme';
import { Skeleton } from '~/components/ui/Skeleton';

export interface BreadcrumbItem {
	label: string;
	href?: string;
	id?: string;
	dropdownItems?: Array<{
		id: string;
		label: string;
		href: string;
	}>;
	customComponent?: React.ReactNode;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
	showSettingsIcon?: boolean;
	onSettingsPress?: () => void;
	loading?: boolean;
	rightComponent?: React.ReactNode;
}

// Styles für die Breadcrumbs-Komponente
const styles = StyleSheet.create({
	breadcrumbItem: {
		flexDirection: 'row',
		alignItems: 'center',
		...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
	},
	breadcrumbItemHovered: {
		opacity: 0.8,
	},
	textHovered: {
		// Kein fontWeight mehr, um zu verhindern, dass das Layout springt
	},
});

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
	items,
	className = '',
	showSettingsIcon = false,
	onSettingsPress,
	loading = false,
	rightComponent,
}) => {
	const router = useRouter();
	const { mode, themeName } = useTheme();
	const isDark = mode === 'dark';
	const themeClasses = useThemeClasses();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;
	const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
	const [dropdownPosition, setDropdownPosition] = useState({ x: 0 });
	const [showSearch, setShowSearch] = useState(false);
	const [searchText, setSearchText] = useState('');
	const itemRefs = useRef<Array<any>>([]);
	const searchInputRef = useRef<TextInput>(null);

	// Berechne die Position des Dropdowns basierend auf dem angeklickten Element
	const measureItem = (index: number) => {
		if (itemRefs.current[index]) {
			const handle = findNodeHandle(itemRefs.current[index]);
			if (handle) {
				UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
					setDropdownPosition({ x: pageX });
				});
			}
		}
	};

	const handleItemPress = (index: number, href?: string) => {
		const item = items[index];
		if (item?.dropdownItems && item.dropdownItems.length > 0) {
			measureItem(index);
			setActiveDropdown(activeDropdown === index ? null : index);
		} else if (href) {
			router.push(href as any);
		}
	};

	const closeDropdown = () => {
		setActiveDropdown(null);
	};

	const toggleSearch = () => {
		setShowSearch(!showSearch);
		// Focus the search input when it becomes visible
		if (!showSearch) {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		} else {
			setSearchText('');
		}
	};

	const handleSearch = () => {
		// Implement your search functionality here
		console.log('Searching for:', searchText);
		// Example: router.push(`/search?q=${encodeURIComponent(searchText)}`);
	};

	const handleKeyPress = (e: any) => {
		if (e.nativeEvent.key === 'Enter') {
			handleSearch();
		}
	};

	// Skeleton Loader für Breadcrumbs
	if (loading) {
		return (
			<View
				className={`flex-row items-center justify-between h-10 ${className}`}
				style={{ backgroundColor: 'transparent', width: '100%' }}
			>
				{/* Left side container for search and breadcrumb items */}
				<View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
					{/* Skeleton für Search Icon */}
					<View style={{ marginRight: 8, padding: 4 }}>
						<Skeleton width={20} height={20} borderRadius={10} />
					</View>

					{/* Skeleton für Breadcrumb Items */}
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Skeleton width={80} height={16} />
						<Text style={{ marginHorizontal: 8, color: isDark ? '#4b5563' : '#d1d5db' }}>/</Text>
						<Skeleton width={120} height={16} />
					</View>
				</View>

				{/* Skeleton für Settings Icon (falls vorhanden) */}
				{showSettingsIcon && (
					<View style={{ marginLeft: 'auto' }}>
						<Skeleton width={24} height={24} borderRadius={12} />
					</View>
				)}
			</View>
		);
	}

	return (
		<View
			className={`flex-row items-center justify-between h-10 ${className}`}
			style={{ backgroundColor: 'transparent', width: '100%' }}
		>
			{/* Left side container for search and breadcrumb items */}
			<View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
				<TouchableOpacity
					onPress={toggleSearch}
					className="mr-2 flex-row items-center justify-center"
					style={{ padding: 4 }}
				>
					<Ionicons
						name={showSearch ? 'search' : 'search'}
						size={20}
						color={isDark ? '#d1d5db' : '#4b5563'}
					/>
				</TouchableOpacity>

				{!showSearch ? (
					<>
						{items.map((item, index) => {
							const isLast = index === items.length - 1;

							return (
								<React.Fragment key={`breadcrumb-${index}`}>
									{item.customComponent ? (
										<>
											<Text
												className={twMerge(
													isDesktop ? 'text-base' : 'text-sm',
													'font-medium text-gray-800 dark:text-gray-200 mr-2'
												)}
											>
												{item.label}:
											</Text>
											<View style={{ marginLeft: 4 }}>{item.customComponent}</View>
										</>
									) : item.href !== undefined ||
									  (item.dropdownItems && item.dropdownItems.length > 0) ? (
										<Pressable
											ref={(el) => (itemRefs.current[index] = el)}
											onPress={() => handleItemPress(index, item.href)}
											className="flex-row items-center"
											style={({ pressed }) => [
												styles.breadcrumbItem,
												pressed && !isLast && styles.breadcrumbItemHovered,
											]}
										>
											{({ pressed }) => (
												<>
													<Text
														className={twMerge(
															isDesktop ? 'text-base' : 'text-sm',
															isLast
																? 'font-medium text-gray-800 dark:text-gray-200'
																: 'text-gray-500 dark:text-gray-400'
														)}
														style={[pressed && !isLast && styles.textHovered]}
													>
														{item.label}
													</Text>
													{item.dropdownItems && item.dropdownItems.length > 0 && (
														<Ionicons
															name={activeDropdown === index ? 'chevron-up' : 'chevron-down'}
															size={14}
															color={isDark ? '#d1d5db' : '#4b5563'}
															style={{ marginLeft: 4 }}
														/>
													)}
												</>
											)}
										</Pressable>
									) : (
										<View className="flex-row items-center" style={styles.breadcrumbItem}>
											<Text
												className={twMerge(
													isDesktop ? 'text-base' : 'text-sm',
													isLast
														? 'font-medium text-gray-800 dark:text-gray-200'
														: 'text-gray-500 dark:text-gray-400'
												)}
											>
												{item.label}
											</Text>
										</View>
									)}

									{!isLast && (
										<Ionicons
											name="chevron-forward"
											size={14}
											color={isDark ? '#d1d5db' : '#4b5563'}
											style={{ marginHorizontal: 4 }}
										/>
									)}
								</React.Fragment>
							);
						})}
					</>
				) : (
					<View className="flex-1 flex-row items-center">
						<TextInput
							ref={searchInputRef}
							value={searchText}
							onChangeText={setSearchText}
							onKeyPress={handleKeyPress}
							placeholder="Suchen..."
							className={twMerge(
								'flex-1 px-2',
								isDark
									? 'text-white bg-gray-800 border-gray-700'
									: 'text-gray-900 bg-white border-gray-300'
							)}
							style={{
								borderWidth: 1,
								borderRadius: 4,
								height: 28,
							}}
						/>
						<TouchableOpacity
							onPress={handleSearch}
							className="ml-2 flex-row items-center justify-center"
							style={{ padding: 4 }}
						>
							<Ionicons name="arrow-forward" size={20} color={isDark ? '#d1d5db' : '#4b5563'} />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={toggleSearch}
							className="ml-2 flex-row items-center justify-center"
							style={{ padding: 4 }}
						>
							<Ionicons name="close" size={20} color={isDark ? '#d1d5db' : '#4b5563'} />
						</TouchableOpacity>
					</View>
				)}
				{/* Dropdown Menu als Modal */}
				{activeDropdown !== null && items[activeDropdown]?.dropdownItems && (
					<Modal
						transparent={true}
						visible={activeDropdown !== null}
						onRequestClose={closeDropdown}
						animationType="fade"
					>
						<TouchableOpacity
							style={{
								flex: 1,
								backgroundColor: 'transparent', // Keine Abdunkelung
							}}
							activeOpacity={1}
							onPress={closeDropdown}
						>
							<View
								style={{
									position: 'absolute',
									top: 40, // Direkt unter den Breadcrumbs
									left: dropdownPosition.x, // Bündig unter dem angeklickten Element
									minWidth: 200,
									maxWidth: 300,
									maxHeight: 300,
									borderRadius: 0, // Keine abgerundeten Ecken
									backgroundColor: isDark ? '#1f2937' : '#ffffff',
									borderWidth: 1,
									borderColor: isDark ? '#374151' : '#e5e7eb',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.1,
									shadowRadius: 3,
									elevation: 3,
								}}
							>
								<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
									<View
										style={{
											overflow: 'hidden',
											borderRadius: 0,
											backgroundColor: isDark ? '#1f2937' : '#ffffff',
										}}
									>
										<ScrollView style={{ maxHeight: 256 }}>
											{items[activeDropdown].dropdownItems?.map((dropdownItem) => (
												<Pressable
													key={dropdownItem.id}
													style={({ pressed }) => [
														{
															padding: 12,
															borderBottomWidth: 1,
															borderBottomColor: isDark ? '#374151' : '#e5e7eb',
															backgroundColor: pressed
																? isDark
																	? '#374151'
																	: '#f3f4f6'
																: isDark
																	? '#1f2937'
																	: '#ffffff',
														},
													]}
													onPress={() => {
														closeDropdown();
														router.push(dropdownItem.href as any);
													}}
												>
													{({ pressed }) => (
														<Text
															style={[
																{ color: isDark ? '#f3f4f6' : '#1f2937' },
																pressed && styles.textHovered,
															]}
														>
															{dropdownItem.label}
														</Text>
													)}
												</Pressable>
											))}
										</ScrollView>
									</View>
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					</Modal>
				)}
			</View>

			{/* Right component or settings icon */}
			{rightComponent ? (
				<View style={{ marginLeft: 'auto' }}>{rightComponent}</View>
			) : (
				showSettingsIcon && (
					<TouchableOpacity onPress={onSettingsPress} style={{ marginLeft: 'auto', padding: 4 }}>
						<Ionicons name="settings-outline" size={24} color={isDark ? '#d1d5db' : '#4b5563'} />
					</TouchableOpacity>
				)
			)}
		</View>
	);
};
