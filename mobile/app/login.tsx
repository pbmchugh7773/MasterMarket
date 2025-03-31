import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { AxiosError } from 'axios';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log('🟢 handleLogin ejecutado');
  
    try {
      console.log('📡 Enviando request de login a FastAPI...');
      const data = new URLSearchParams();
      data.append('username', email);
      data.append('password', password);
  
      const response = await axios.post('http://192.168.1.25:8000/auth/login', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
  
      const { access_token } = response.data;
      console.log('✅ Login OK. Token recibido:', access_token);
  
      await AsyncStorage.setItem('token', access_token);
      Alert.alert('Login exitoso');
      router.push('/');
    } catch (err) {
      const error = err as AxiosError;
      console.error('❌ Error en login:', error.response?.data || error.message);
      Alert.alert('Error', 'Credenciales incorrectas o servidor no disponible');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
