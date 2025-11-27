import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Icon } from '~/components/Icon';
import Text from '~/components/Text';
import { useQuotesStore } from '~/store/quotesStore';
import { useIsDarkMode } from '~/store/settingsStore';
import { AuthorAvatar } from '~/components/authors/AuthorAvatar';
import QuoteCard from '~/components/QuoteCard';
import { GlassTabSelector } from '~/components/common/GlassTabSelector';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, {
	FadeIn,
	FadeInDown,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import { useTheme } from '~/hooks/useTheme';

export default function AuthorDetailScreen() {
	const { id } = useLocalSearchParams();
	const { t } = useTranslation();
	const router = useRouter();
	const isDarkMode = useIsDarkMode();
	const { colors } = useTheme();
	const likeScale = useSharedValue(1);
	const {
		authors,
		quotes,
		initializeStore,
		isLoading,
		toggleFavorite,
		toggleAuthorFavorite,
		isAuthorFavorite,
	} = useQuotesStore();
	const [activeTab, setActiveTab] = useState<'quotes' | 'bio'>('quotes');

	useEffect(() => {
		initializeStore();
	}, []);

	const author = authors?.find((a) => a.id === id);
	const authorQuotes = quotes?.filter((q) => q.authorId === id) || [];
	const isFavorite = author ? isAuthorFavorite(author.id) : false;

	const tabs = [
		{ key: 'quotes', label: t('authors.quotes'), count: authorQuotes.length },
		{ key: 'bio', label: t('authors.biography') },
	];

	const likeAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: likeScale.value }],
	}));

	const handleFavoriteToggle = () => {
		if (author) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			likeScale.value = withSpring(1.3, {}, () => {
				likeScale.value = withSpring(1);
			});
			toggleAuthorFavorite(author.id);
		}
	};

	if (isLoading) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
				</View>
			</View>
		);
	}

	if (!author) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<View className="flex-1 justify-center items-center">
					<Text variant="body" color="secondary">
						{t('authors.notFound')}
					</Text>
					<Pressable
						onPress={() => router.back()}
						className="mt-4 px-4 py-2 bg-blue-500 rounded-full"
					>
						<Text variant="body" color="primary">
							{t('common.back')}
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	const getLifeYears = () => {
		if (!author.lifespan) return null;
		const birth = author.lifespan.birth?.substring(0, 4);
		const death = author.lifespan.death?.substring(0, 4);

		if (birth && death) {
			const birthYear = parseInt(birth);
			const deathYear = parseInt(death);
			const age = deathYear - birthYear;
			return `${birth} – ${death} (${age} ${t('authors.years')})`;
		}
		if (birth) {
			const birthYear = parseInt(birth);
			const currentYear = new Date().getFullYear();
			const age = currentYear - birthYear;
			return `${t('authors.born')} ${birth} (${age} ${t('authors.yearsOld')})`;
		}
		return null;
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: author.name,
					headerShown: true,
					headerTransparent: true,
					headerBlurEffect: isDarkMode ? 'dark' : 'light',
					headerStyle: {
						backgroundColor: 'transparent',
					},
					headerTintColor: isDarkMode ? '#ffffff' : '#000000',
					headerShadowVisible: false,
					headerBackTitle: 'Autoren',
				}}
			/>

			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
				>
					{/* Author Info - with max width constraint */}
					<Animated.View entering={FadeIn.duration(600)} className="pb-4 px-6">
						<Animated.View entering={FadeInDown.delay(100).duration(600)} className="items-center">
							<AuthorAvatar name={author.name} imageUrl={author.imageUrl} size="large" />

							<Text
								variant="title"
								color="primary"
								weight="bold"
								className="mt-4 text-center"
								numberOfLines={2}
							>
								{author.name}
							</Text>

							{getLifeYears() && (
								<Text variant="body" color="secondary" className="mt-1">
									{getLifeYears()}
								</Text>
							)}

							{/* Professions - with max width and proper wrapping */}
							{author.profession && author.profession.length > 0 && (
								<View
									className="flex-row flex-wrap justify-center mt-2.5 px-4"
									style={{ maxWidth: 300 }}
								>
									{author.profession.slice(0, 2).map((prof, idx) => (
										<View
											key={idx}
											className={`px-2.5 py-1 rounded-full mr-1.5 mb-1.5 ${
												isDarkMode ? 'bg-white/10' : 'bg-black/10'
											}`}
											style={{ maxWidth: 100 }}
										>
											<Text
												variant="caption"
												color="secondary"
												numberOfLines={1}
												style={{ fontSize: 10 }}
											>
												{prof.length > 12 ? prof.substring(0, 12) + '...' : prof}
											</Text>
										</View>
									))}
									{author.profession.length > 2 && (
										<View
											className={`px-2.5 py-1 rounded-full mb-1.5 ${
												isDarkMode ? 'bg-white/10' : 'bg-black/10'
											}`}
										>
											<Text variant="caption" color="secondary" style={{ fontSize: 10 }}>
												+{author.profession.length - 2}
											</Text>
										</View>
									)}
								</View>
							)}

							{/* Favorite Button - compact and responsive */}
							<View className="mt-3 mb-2 items-center">
								<Pressable
									onPress={handleFavoriteToggle}
									className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} px-3.5 py-2 rounded-full`}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								>
									<Animated.View style={likeAnimatedStyle}>
										<Icon
											name={isFavorite ? 'heart' : 'heart-outline'}
											size={22}
											color={
												isFavorite
													? '#ef4444'
													: isDarkMode
														? 'rgba(255,255,255,0.8)'
														: 'rgba(0,0,0,0.6)'
											}
										/>
									</Animated.View>
								</Pressable>
							</View>

							{/* Stats - with proper spacing */}
							<View className="flex-row mt-3">
								<View className="items-center px-3">
									<Text variant="bodyLarge" color="primary" weight="bold">
										{authorQuotes.length}
									</Text>
									<Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
										{t('navigation.quotes')}
									</Text>
								</View>

								{author.nationality && (
									<View
										className={`items-center px-3 border-l ${isDarkMode ? 'border-white/20' : 'border-black/20'}`}
									>
										<Text variant="body" color="primary" numberOfLines={1} style={{ fontSize: 14 }}>
											{Array.isArray(author.nationality)
												? author.nationality[0]
												: typeof author.nationality === 'string' && author.nationality.length > 12
													? author.nationality.substring(0, 12) + '...'
													: author.nationality}
										</Text>
										<Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
											Nationalität
										</Text>
									</View>
								)}
							</View>
						</Animated.View>
					</Animated.View>

					{/* Tabs */}
					<View className="mb-2">
						<GlassTabSelector
							tabs={tabs}
							activeTab={activeTab}
							onTabChange={(tab) => setActiveTab(tab as 'quotes' | 'bio')}
							animationDelay={200}
						/>
					</View>

					{/* Content */}
					<Animated.View entering={FadeInDown.delay(300).duration(600)} className="pt-4">
						{activeTab === 'quotes' ? (
							<View>
								{authorQuotes.length > 0 ? (
									authorQuotes.map((quote, index) => (
										<View key={quote.id} className="mb-5">
											<QuoteCard
												quote={quote}
												onToggleFavorite={toggleFavorite}
												onAuthorPress={() => {}}
												showDate={true}
											/>
										</View>
									))
								) : (
									<View className="py-12">
										<Text variant="body" color="secondary" className="text-center">
											{t('authors.noQuotes')}
										</Text>
									</View>
								)}
							</View>
						) : (
							<View className="px-6">
								{/* Biography */}
								{author.biography?.long || author.biography?.short || author.biography?.sections ? (
									<View>
										{/* Main Biography Text */}
										{(author.biography.long || author.biography.short) && (
											<View
												className={`p-3 rounded-2xl mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
											>
												<Text variant="body" color="primary" className="leading-relaxed">
													{author.biography.long || author.biography.short}
												</Text>
											</View>
										)}

										{/* Biography Sections */}
										{author.biography.sections && (
											<View className="mb-6">
												{Object.entries(author.biography.sections).map(
													([key, section]: [string, any]) => (
														<View key={key} className="mb-6">
															<Text
																variant="bodyLarge"
																color="primary"
																weight="semibold"
																className="mb-3"
															>
																{section.title}
															</Text>
															<View
																className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
															>
																<Text variant="body" color="primary" className="leading-relaxed">
																	{section.content}
																</Text>
															</View>
														</View>
													)
												)}
											</View>
										)}

										{/* Key Achievements */}
										{author.biography.keyAchievements &&
											author.biography.keyAchievements.length > 0 && (
												<View className="mb-6">
													<Text
														variant="bodyLarge"
														color="primary"
														weight="semibold"
														className="mb-3"
													>
														{t('authors.keyAchievements', {
															defaultValue: 'Wichtige Errungenschaften',
														})}
													</Text>
													<View
														className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
													>
														{author.biography.keyAchievements.map(
															(achievement: string, idx: number) => (
																<View key={idx} className="flex-row mb-2">
																	<Text variant="body" color="secondary" className="mr-2">
																		•
																	</Text>
																	<Text variant="body" color="primary" className="flex-1">
																		{achievement}
																	</Text>
																</View>
															)
														)}
													</View>
												</View>
											)}

										{/* Famous Quote */}
										{author.biography.famousQuote && (
											<View
												className={`p-3 rounded-2xl mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
											>
												<View className="flex-row mb-2">
													<Icon
														name="quote"
														size={20}
														color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
													/>
												</View>
												<Text
													variant="bodyLarge"
													color="primary"
													className="leading-relaxed italic"
												>
													"{author.biography.famousQuote}"
												</Text>
											</View>
										)}
									</View>
								) : (
									<View className="py-12">
										<Text variant="body" color="secondary" className="text-center">
											{t('authors.noBiography')}
										</Text>
									</View>
								)}

								{/* Links Section */}
								{author.links && (author.links.wikipedia || author.links.website) && (
									<View>
										<Text variant="bodyLarge" color="primary" weight="semibold" className="mb-3">
											{t('authors.moreInfo')}
										</Text>

										{author.links.wikipedia && (
											<Pressable
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
													// Open Wikipedia link
												}}
												className={`flex-row items-center py-3 px-4 rounded-xl mb-2 ${
													isDarkMode ? 'bg-white/10' : 'bg-black/10'
												}`}
											>
												<Icon
													name="globe-outline"
													size={20}
													color={isDarkMode ? 'white' : 'black'}
												/>
												<Text variant="body" color="primary" className="ml-3">
													{t('authors.wikipedia')}
												</Text>
											</Pressable>
										)}

										{author.links?.website && (
											<Pressable
												onPress={() => {
													Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
													// Open website
												}}
												className={`flex-row items-center py-3 px-4 rounded-xl ${
													isDarkMode ? 'bg-white/10' : 'bg-black/10'
												}`}
											>
												<Icon
													name="link-outline"
													size={20}
													color={isDarkMode ? 'white' : 'black'}
												/>
												<Text variant="body" color="primary" className="ml-3">
													{t('authors.website')}
												</Text>
											</Pressable>
										)}
									</View>
								)}
							</View>
						)}
					</Animated.View>
				</ScrollView>
			</View>
		</>
	);
}
