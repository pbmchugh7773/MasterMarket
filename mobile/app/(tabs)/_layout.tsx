import React, { useEffect } from 'react';
import { Alert, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { BasketProvider } from '../../context/BasketContext';
import { useAuth } from '../../context/AuthContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function Layout() {
  const colorScheme = useColorScheme();
  const showHeader = useClientOnlyValue(false, true);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente.");
      router.replace('/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) return null;

  // ✅ Definimos los tabs según el rol
  const screens = [
    {
      name: 'index',
      options: {
        title: 'Home',
        tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
      },
    },
    {
      name: 'basket',
      options: {
        title: 'Basket',
        tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
      },
    },
    {
      name: 'me',
      options: {
        title: 'Perfil',
        tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
      },
    },
  ];

  // 👀 Agregamos Admin solo si el rol es admin (ignorando mayúsculas/minúsculas)
  if (user?.role?.toLowerCase() === 'admin') {
    screens.push({
      name: 'admin',
      options: {
        title: 'Admin',
        tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
      },
    });
  }

  return (
    <BasketProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: showHeader,
        }}
      >
        {screens.map((screen) => (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={screen.options}
          />
        ))}
      </Tabs>
    </BasketProvider>
  );
}
