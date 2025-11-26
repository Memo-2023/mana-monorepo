import { Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import { CameraModal } from '../../components/camera/CameraModal';
import { useAppStore } from '../../store/AppStore';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { showCameraModal, cameraMode } = useAppStore();
  const { isDark } = useTheme();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6366f1',
          tabBarStyle: {
            backgroundColor: isDark ? '#1f2937' : 'white',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#e5e7eb',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Meals',
            tabBarIcon: ({ color }) => (
              <TabBarIcon sfSymbol="fork.knife" fallbackIcon="cutlery" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color }) => (
              <TabBarIcon sfSymbol="chart.bar" fallbackIcon="bar-chart" color={color} />
            ),
          }}
        />
      </Tabs>

      {showCameraModal && <CameraModal mode={cameraMode || 'camera'} />}
    </>
  );
}
