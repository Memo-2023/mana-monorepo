import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
	bg: '#0f0f1e',
	card: '#1a1a35',
	border: '#ffcc00',
	borderDark: '#b38f00',
	accent: '#ff3366',
	accentDark: '#b3234a',
	text: '#f5f5f5',
	textMuted: '#8888aa',
	input: '#141428',
	button: '#ffcc00',
	buttonText: '#0f0f1e',
};

export default function NeoBrutalistScreen() {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
			<ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
				{/* Header */}
				<View
					style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32, alignItems: 'center' }}
				>
					<View
						style={{
							backgroundColor: C.accent,
							paddingHorizontal: 14,
							paddingVertical: 4,
							borderRadius: 4,
							marginBottom: 8,
							transform: [{ rotate: '-2deg' }],
						}}
					>
						<Text
							style={{
								fontSize: 11,
								fontWeight: '900',
								color: '#fff',
								letterSpacing: 3,
								textTransform: 'uppercase',
							}}
						>
							New Drop
						</Text>
					</View>
					<Text
						style={{
							fontSize: 32,
							fontWeight: '900',
							color: C.text,
							textAlign: 'center',
							letterSpacing: -1,
						}}
					>
						CREATE YOUR{'\n'}FIGGO
					</Text>
				</View>

				<View style={{ paddingHorizontal: 24 }}>
					{/* Name */}
					<Text
						style={{
							fontSize: 13,
							fontWeight: '900',
							color: C.border,
							letterSpacing: 3,
							textTransform: 'uppercase',
							marginBottom: 8,
						}}
					>
						Name
					</Text>
					<View style={{ position: 'relative', marginBottom: 24 }}>
						<View
							style={{
								position: 'absolute',
								top: 5,
								left: 5,
								right: -5,
								bottom: -5,
								backgroundColor: C.borderDark,
								borderRadius: 8,
							}}
						/>
						<TextInput
							style={{
								backgroundColor: C.input,
								borderWidth: 3,
								borderColor: C.border,
								borderRadius: 8,
								paddingHorizontal: 16,
								height: 52,
								fontSize: 16,
								color: C.text,
							}}
							placeholder="Captain Thunderstrike"
							placeholderTextColor={C.textMuted}
						/>
					</View>

					{/* Story */}
					<Text
						style={{
							fontSize: 13,
							fontWeight: '900',
							color: C.border,
							letterSpacing: 3,
							textTransform: 'uppercase',
							marginBottom: 8,
						}}
					>
						Story
					</Text>
					<View style={{ position: 'relative', marginBottom: 32 }}>
						<View
							style={{
								position: 'absolute',
								top: 5,
								left: 5,
								right: -5,
								bottom: -5,
								backgroundColor: C.borderDark,
								borderRadius: 8,
							}}
						/>
						<TextInput
							style={{
								backgroundColor: C.input,
								borderWidth: 3,
								borderColor: C.border,
								borderRadius: 8,
								paddingHorizontal: 16,
								paddingVertical: 14,
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
					<Pressable style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
						<View style={{ position: 'relative' }}>
							<View
								style={{
									position: 'absolute',
									top: 6,
									left: 4,
									right: -4,
									bottom: -6,
									backgroundColor: C.borderDark,
									borderRadius: 8,
								}}
							/>
							<View
								style={{
									backgroundColor: C.button,
									borderRadius: 8,
									borderWidth: 3,
									borderColor: '#ffe066',
									paddingVertical: 18,
									alignItems: 'center',
								}}
							>
								<Text
									style={{
										fontSize: 18,
										fontWeight: '900',
										color: C.buttonText,
										letterSpacing: 2,
										textTransform: 'uppercase',
									}}
								>
									Generate Figure
								</Text>
							</View>
						</View>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
