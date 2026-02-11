import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View className="flex-1 items-center justify-center px-8">
				{/* Empty state card */}
				<View style={{ position: 'relative' }}>
					<View
						className="bg-primary-dark rounded-lg"
						style={{ position: 'absolute', top: 5, left: 5, right: -5, bottom: -5 }}
					/>
					<View
						className="bg-surface rounded-lg items-center"
						style={{
							borderWidth: 3,
							borderColor: 'rgb(255, 204, 0)',
							paddingHorizontal: 32,
							paddingVertical: 32,
						}}
					>
						<View
							className="bg-input rounded-lg items-center justify-center mb-4"
							style={{ width: 56, height: 56, borderWidth: 2, borderColor: 'rgb(50, 50, 80)' }}
						>
							<Text style={{ fontSize: 24 }}>📦</Text>
						</View>
						<Text
							className="text-foreground"
							style={{ fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}
						>
							No figures yet
						</Text>
						<Text
							className="text-muted-foreground text-center mt-2"
							style={{ fontSize: 14, lineHeight: 20 }}
						>
							Create your first Figgo{'\n'}to start your collection.
						</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
