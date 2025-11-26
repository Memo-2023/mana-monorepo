import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from './atoms/Text';
import Button from './atoms/Button';
import { PulsingLogoAnimation } from './molecules/PulsingLogoAnimation';
import { SpinnerAnimation } from './molecules/SpinnerAnimation';
import { DotsAnimation } from './molecules/DotsAnimation';
import { LogoSpinnerAnimation } from './molecules/LogoSpinnerAnimation';

/**
 * Demo-Screen zum Vergleichen aller Loading-Animationen
 *
 * Zum Testen: Importiere diese Komponente temporär in einer Route
 */
export default function LoadingAnimationDemo() {
  const { isDark, colors } = useTheme();
  const [selectedAnimation, setSelectedAnimation] = useState<string>('all');

  const animations = [
    {
      id: 'pulsing',
      name: 'Pulsing Logo',
      description: 'Minimalistisch - Logo pulst sanft',
      component: <PulsingLogoAnimation size={80} />,
      recommended: true,
    },
    {
      id: 'spinner',
      name: 'Spinner',
      description: 'Modern - Rotierender Ring',
      component: <SpinnerAnimation size={60} />,
      recommended: false,
    },
    {
      id: 'dots',
      name: 'Three Dots',
      description: 'Subtil - Drei pulsierende Punkte',
      component: <DotsAnimation size={60} />,
      recommended: false,
    },
    {
      id: 'logo-spinner',
      name: 'Logo + Spinner',
      description: 'Branded - Logo mit rotierendem Ring',
      component: <LogoSpinnerAnimation size={100} />,
      recommended: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#FFFFFF' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Loading Animations
        </Text>
        <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
          Wähle eine Animation oder betrachte alle
        </Text>

        {/* Filter Buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          <Button
            title="Alle"
            variant={selectedAnimation === 'all' ? 'primary' : 'secondary'}
            onPress={() => setSelectedAnimation('all')}
            style={{ height: 36, paddingHorizontal: 16 }}
          />
          {animations.map((anim) => (
            <Button
              key={anim.id}
              title={anim.name}
              variant={selectedAnimation === anim.id ? 'primary' : 'secondary'}
              onPress={() => setSelectedAnimation(anim.id)}
              style={{ height: 36, paddingHorizontal: 16 }}
            />
          ))}
        </View>

        {/* Animation Display */}
        {animations
          .filter((anim) => selectedAnimation === 'all' || selectedAnimation === anim.id)
          .map((anim) => (
            <View
              key={anim.id}
              style={{
                backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
                borderRadius: 16,
                padding: 24,
                marginBottom: 20,
                borderWidth: anim.recommended ? 2 : 0,
                borderColor: colors.primary,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }}>
                  {anim.name}
                </Text>
                {anim.recommended && (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>
                      Empfohlen
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>
                {anim.description}
              </Text>

              <View
                style={{
                  height: 150,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {anim.component}
              </View>
            </View>
          ))}

        {/* Usage Instructions */}
        <View
          style={{
            backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
          }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Verwendung
          </Text>
          <Text style={{ fontSize: 14, opacity: 0.7, lineHeight: 20 }}>
            Ersetze in LoadingScreen.tsx die LottieAnimation durch eine dieser Komponenten:{'\n\n'}
            {`import { LogoSpinnerAnimation } from '~/components/molecules/LogoSpinnerAnimation';\n\n`}
            {`<LogoSpinnerAnimation size={100} />`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
