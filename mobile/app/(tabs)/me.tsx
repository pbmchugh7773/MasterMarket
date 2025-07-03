import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { API_URL } from '@/config';

export default function MeScreen() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !authUser) {
      console.log('🔒 No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [authLoading, authUser]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) return;
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token leído desde AsyncStorage:', token);

      if (!token) {
        Alert.alert('No autenticado');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(response.data);
      } catch (error: any) {
        console.error('❌ Error al obtener el perfil:', error.response?.data || error.message);
        Alert.alert('Error', 'No se pudo obtener el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
    Alert.alert('Sesión cerrada');
  };

  // Show loading screen while checking auth
  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  // If user is null after loading, it will redirect in useEffect
  if (!authUser) {
    return null;
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>No se pudo cargar el perfil</Text>
        <Button title="Volver al login" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wellcome, {userData.full_name || 'Usuario'}</Text>
      <Text>Email: {userData.email}</Text>
      <Text>Profile: {userData.is_premium ? 'Premium' : 'Free'}</Text>
      <Text>Active: {userData.is_active ? 'Sí' : 'No'}</Text>
      <Text>Registered at: {new Date(userData.created_at).toLocaleString()}</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Cerrar sesión" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});
