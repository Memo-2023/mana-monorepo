import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
	bg: '#1a1a2e',
	card: '#16213e',
	cardBorder: '#e94560',
	blue: '#0f3460',
	red: '#e94560',
	redDark: '#a3304a',
	yellow: '#f5c518',
	yellowDark: '#b8940f',
	text: '#eeeef0',
	textMuted: '#6a6a8a',
	inputBg: '#0f1a30',
	inputBorder: '#2a3a5a',
};

export default function RetroPixelScreen() {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
			<ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
				{/* Header */}
				<View
					style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 28, alignItems: 'center' }}
				>
					{/* Chunky badge */}
					<View
						style={{
							backgroundColor: C.red,
							borderRadius: 4,
							paddingHorizontal: 16,
							paddingVertical: 6,
							marginBottom: 14,
							borderWidth: 3,
							borderColor: C.redDark,
						}}
					>
						<Text
							style={{
								fontSize: 11,
								fontWeight: '900',
								color: '#fff',
								letterSpacing: 4,
								textTransform: 'uppercase',
							}}
						>
							Player 1
						</Text>
					</View>
					<Text
						style={{
							fontSize: 30,
							fontWeight: '900',
							color: C.text,
							textAlign: 'center',
							letterSpacing: 2,
							textTransform: 'uppercase',
						}}
					>
						Create your{'\n'}Figgo
					</Text>
				</View>

				<View style={{ paddingHorizontal: 20 }}>
					{/* Form container */}
					<View
						style={{
							backgroundColor: C.card,
							borderRadius: 4,
							borderWidth: 3,
							borderColor: C.inputBorder,
							padding: 20,
							marginBottom: 20,
						}}
					>
						{/* Name */}
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
							<View
								style={{
									width: 8,
									height: 8,
									backgroundColor: C.red,
									borderRadius: 1,
									marginRight: 8,
								}}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: '900',
									color: C.red,
									letterSpacing: 2,
									textTransform: 'uppercase',
								}}
							>
								Name
							</Text>
						</View>
						<TextInput
							style={{
								backgroundColor: C.inputBg,
								borderWidth: 2,
								borderColor: C.inputBorder,
								borderRadius: 4,
								paddingHorizontal: 14,
								height: 48,
								fontSize: 16,
								color: C.text,
								marginBottom: 20,
							}}
							placeholder="Captain Thunderstrike"
							placeholderTextColor={C.textMuted}
						/>

						{/* Story */}
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
							<View
								style={{
									width: 8,
									height: 8,
									backgroundColor: C.yellow,
									borderRadius: 1,
									marginRight: 8,
								}}
							/>
							<Text
								style={{
									fontSize: 13,
									fontWeight: '900',
									color: C.yellow,
									letterSpacing: 2,
									textTransform: 'uppercase',
								}}
							>
								Story
							</Text>
						</View>
						<TextInput
							style={{
								backgroundColor: C.inputBg,
								borderWidth: 2,
								borderColor: C.inputBorder,
								borderRadius: 4,
								paddingHorizontal: 14,
								paddingVertical: 12,
								fontSize: 16,
								color: C.text,
								minHeight: 120,
								textAlignVertical: 'top',
							}}
							placeholder="A cyberpunk warrior with lightning gauntlets..."
							placeholderTextColor={C.textMuted}
							multiline
						/>
					</View>

					{/* Button */}
					<Pressable style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
						<View style={{ position: 'relative' }}>
							<View
								style={{
									position: 'absolute',
									top: 5,
									left: 3,
									right: -3,
									bottom: -5,
									backgroundColor: C.yellowDark,
									borderRadius: 4,
								}}
							/>
							<View
								style={{
									backgroundColor: C.yellow,
									borderRadius: 4,
									borderWidth: 3,
									borderColor: '#ffe066',
									paddingVertical: 16,
									alignItems: 'center',
								}}
							>
								<Text
									style={{
										fontSize: 18,
										fontWeight: '900',
										color: '#1a1a2e',
										letterSpacing: 3,
										textTransform: 'uppercase',
									}}
								>
									Generate!
								</Text>
							</View>
						</View>
					</Pressable>

					{/* Stats bar */}
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-around',
							marginTop: 28,
							backgroundColor: C.card,
							borderRadius: 4,
							borderWidth: 2,
							borderColor: C.inputBorder,
							paddingVertical: 12,
						}}
					>
						<View style={{ alignItems: 'center' }}>
							<Text
								style={{
									fontSize: 10,
									fontWeight: '800',
									color: C.textMuted,
									letterSpacing: 1,
									textTransform: 'uppercase',
								}}
							>
								Common
							</Text>
							<Text style={{ fontSize: 16, fontWeight: '900', color: '#888' }}>60%</Text>
						</View>
						<View style={{ alignItems: 'center' }}>
							<Text
								style={{
									fontSize: 10,
									fontWeight: '800',
									color: C.textMuted,
									letterSpacing: 1,
									textTransform: 'uppercase',
								}}
							>
								Rare
							</Text>
							<Text style={{ fontSize: 16, fontWeight: '900', color: '#74b9ff' }}>25%</Text>
						</View>
						<View style={{ alignItems: 'center' }}>
							<Text
								style={{
									fontSize: 10,
									fontWeight: '800',
									color: C.textMuted,
									letterSpacing: 1,
									textTransform: 'uppercase',
								}}
							>
								Epic
							</Text>
							<Text style={{ fontSize: 16, fontWeight: '900', color: '#a29bfe' }}>12%</Text>
						</View>
						<View style={{ alignItems: 'center' }}>
							<Text
								style={{
									fontSize: 10,
									fontWeight: '800',
									color: C.textMuted,
									letterSpacing: 1,
									textTransform: 'uppercase',
								}}
							>
								Lgndy
							</Text>
							<Text style={{ fontSize: 16, fontWeight: '900', color: '#ffd73c' }}>3%</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
