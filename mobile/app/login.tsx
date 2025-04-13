import * as React from 'react';
import { useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const redirectUri = `https://auth.expo.io/@pbmchugh7773/mastermarket`;


  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '780606737434-r3pbiu5lhirnl5gt5pjr3s75lr80v99i.apps.googleusercontent.com',
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    console.log('🟡 Google response:', JSON.stringify(response, null, 2));
    console.log('🔗 redirectUri:', redirectUri);

    if (response?.type === 'success' && response.authentication?.idToken) {
      const id_token = response.authentication.idToken;
      console.log('✅ ID TOKEN:', id_token);

      axios
        .post('http://192.168.1.25:8000/google-login', { id_token })
        .then((res) => {
          const jwt = res.data.access_token;
          console.log('✅ JWT recibido del backend:', jwt);
          Alert.alert('Login exitoso', 'Redirigiendo...');
          router.replace('/');
        })
        .catch((err) => {
          console.error('❌ Error autenticando con el backend:', err);
          Alert.alert('Error', 'No se pudo autenticar con el backend');
        });
    }
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title="Iniciar sesión con Google"
        disabled={!request}
        onPress={() => {
          console.log('🔵 Ejecutando promptAsync');
          promptAsync();
        }}
      />
    </View>
  );
}
