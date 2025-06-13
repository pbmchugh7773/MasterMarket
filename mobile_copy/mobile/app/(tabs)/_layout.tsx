import React, { useEffect } from 'react';
import { Alert, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { BasketProvider } from '../../context/BasketContext';
import { useBasket } from '../../context/BasketContext';
import { useAuth } from '../../context/AuthContext';

function BasketTabIconWithBadge({ color }: { color: string }) {
  const { basket } = useBasket();
  const count = basket.length;

  return (
    <View style={{ width: 28, height: 28 }}>
      <FontAwesome name="shopping-basket" color={color} size={28} />
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -10,
            backgroundColor: 'red',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 3,
            zIndex: 1,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );
}

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
    tabBarIcon: ({ color }) => <BasketTabIconWithBadge color={color} />,
    // ¡NO pongas tabBarBadge aquí!
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
