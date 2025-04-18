import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { BasketProvider } from '../../context/BasketContext';
import { router } from 'expo-router';
import { isLoggedIn } from '../../lib/auth';
import { useAuth } from '@/context/AuthContext';


function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function Layout() {
  const [checked, setChecked] = useState(false);
  const colorScheme = useColorScheme();
  const showHeader = useClientOnlyValue(false, true);
  const { user } = useAuth(); // 👈 Obtenemos el usuario actual

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

  if (!checked || !user) return null;

  return (
    <BasketProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: showHeader,
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
            title: 'Basket',
            tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />

        {user?.role === 'admin' && (
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Admin',
              tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
            }}
          />
        )}
      </Tabs>
    </BasketProvider>
  );
}
