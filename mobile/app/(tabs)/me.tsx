import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

export default function MeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token leído desde AsyncStorage:', token);

      if (!token) {
        Alert.alert('No autenticado');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://192.168.1.25:8000/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error: any) {
        console.error('❌ Error al obtener el perfil:', error.response?.data || error.message);
        Alert.alert('Error', 'No se pudo obtener el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    Alert.alert('Sesión cerrada');
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>No se pudo cargar el perfil</Text>
        <Button title="Volver al login" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wellcome, {user.full_name || 'Usuario'}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Profile: {user.is_premium ? 'Premium' : 'Free'}</Text>
      <Text>Active: {user.is_active ? 'Sí' : 'No'}</Text>
      <Text>Registered at: {new Date(user.created_at).toLocaleString()}</Text>
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
