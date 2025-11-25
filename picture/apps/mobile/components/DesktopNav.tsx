import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';

type NavItem = {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems: NavItem[] = [
    { route: '/(tabs)', label: 'Galerie', icon: 'image' },
    { route: '/(tabs)/explore', label: 'Entdecken', icon: 'compass' },
    { route: '/(tabs)/generate', label: 'Studio', icon: 'color-palette' },
    { route: '/(tabs)/profile', label: 'Profil', icon: 'person' },
  ];

  const isActiveRoute = (route: string) => {
    if (route === '/(tabs)' && (pathname === '/(tabs)' || pathname === '/')) {
      return true;
    }
    return pathname === route;
  };

  return (
    <View className="bg-black/50 border-b border-dark-border/50">
      <View className="flex-row items-center justify-between px-6 py-2">
        {/* Logo/Brand on the left */}
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-indigo-400 mr-8">Picture</Text>
          
          {/* Navigation Items */}
          <View className="flex-row items-center">
            {navItems.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => router.push(item.route as any)}
                className={({ pressed }) => 
                  `flex-row items-center px-4 py-3 mr-2 border-b-2 ${
                    isActiveRoute(item.route) 
                      ? 'border-indigo-500' 
                      : 'border-transparent'
                  } ${pressed ? 'opacity-70' : 'opacity-100'}`
                }
              >
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={isActiveRoute(item.route) ? '#818cf8' : '#9ca3af'} 
                />
                <Text 
                  className={`ml-2 font-medium ${
                    isActiveRoute(item.route) 
                      ? 'text-indigo-400' 
                      : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* User actions on the right */}
        <View className="flex-row items-center">
          {user && (
            <>
              <Pressable
                onPress={() => router.push('/tags')}
                className={({ pressed }) => 
                  `px-3 py-2 mr-2 ${pressed ? 'opacity-70' : 'opacity-100'}`
                }
              >
                <View className="flex-row items-center">
                  <Ionicons name="pricetags" size={20} color="#9ca3af" />
                  <Text className="ml-2 text-gray-400">Tags</Text>
                </View>
              </Pressable>
              
              <View className="h-6 w-px bg-gray-700 mx-2" />
              
              <Pressable
                onPress={signOut}
                className={({ pressed }) => 
                  `px-3 py-2 ${pressed ? 'opacity-70' : 'opacity-100'}`
                }
              >
                <View className="flex-row items-center">
                  <Ionicons name="log-out" size={20} color="#ef4444" />
                  <Text className="ml-2 text-red-500">Abmelden</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}