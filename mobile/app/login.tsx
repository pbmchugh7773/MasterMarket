import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { AxiosError } from 'axios';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleLogin = async () => {
    console.log('🟢 handleLogin ejecutado');
  
    try {
      console.log('📡 Enviando request de login a FastAPI...');
      const data = new URLSearchParams();
      data.append('username', email);
      data.append('password', password);
  
      const response = await axios.post('https://mastermarket-production.up.railway.app/auth/login', data, {
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
  
  const handleRegister = async () => {
    try {
      console.log('📡 Enviando request de registro a FastAPI...');
      const response = await axios.post('https://mastermarket-production.up.railway.app/auth/register', {
        email,
        password,
        full_name: fullName,
      });
  
      Alert.alert('✅ Usuario creado', 'Ya puedes iniciar sesión');
      setIsRegistering(false); // volver al modo login
    } catch (error: any) {
      console.error('❌ Error al registrar:', error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo crear el usuario');
    }
  };
  
  return (
<View style={styles.container}>
  <Text style={styles.title}>{isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}</Text>

  {isRegistering && (
    <TextInput
      style={styles.input}
      placeholder="Nombre completo"
      value={fullName}
      onChangeText={setFullName}
    />
  )}

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

  <Button
    title={isRegistering ? 'Registrarse' : 'Entrar'}
    onPress={isRegistering ? handleRegister : handleLogin}
  />

  <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 16 }}>
    <Text style={{ color: 'blue', textAlign: 'center' }}>
      {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
    </Text>
  </TouchableOpacity>
</View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
