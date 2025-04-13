import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { BasketProvider } from '../../context/BasketContext';
import { router } from 'expo-router';
import { isLoggedIn } from '../../lib/auth'; // usa ../lib/auth si no usás alias '@/'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function Layout() {
  const [checked, setChecked] = useState(false);
  const colorScheme = useColorScheme(); // ✅ Hook antes de cualquier return
  const showHeader = useClientOnlyValue(false, true); // ✅ Hook también arriba

  useEffect(() => {
    const checkAuth = async () => {
      const logged = await isLoggedIn();
      if (!logged) {
        router.replace('/login');
      } else {
        setChecked(true);
      }
    };
    checkAuth();
  }, []);

  if (!checked) return null;

  return (
    <BasketProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: {
              backgroundColor: '#000',
              borderTopWidth: 0,
              height: 65,
              paddingBottom: 10,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: '600',
            },
            tabBarIconStyle: {
              marginBottom: -3,
            },
            headerShown: showHeader,
            headerStyle: {
              backgroundColor: '#000',
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: '#fff', // título blanco
            },
            headerTintColor: '#fff', // íconos y flechas blancas
          }}
        >

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="basket"
          options={{
            title: '🛒 Your Basket',
            tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </BasketProvider>
  );
}
