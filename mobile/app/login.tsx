import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { AxiosError } from "axios";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";
import { registerUser } from "../services/api";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '758094174857-oafpsei99h13tpgujjlcbt02bthust93.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
  scopes: ['profile', 'email'],
  webClientId: GOOGLE_CLIENT_ID, // This is needed to get the idToken
});

// Country and currency options
const COUNTRIES = [
  { code: "UK", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("UK");
  const [currency, setCurrency] = useState("GBP");
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showCountrySelection, setShowCountrySelection] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState<any>(null);
  const handleLogin = async () => {
    try {
      const data = new URLSearchParams();
      data.append("username", email);
      data.append("password", password);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { access_token, user } = response.data;
      await login(user, access_token);
    } catch (err) {
      const error = err as AxiosError;
      Alert.alert("Error", "Credenciales incorrectas o servidor no disponible");
      console.error(error.response?.data || error.message);
    }
  };

  const handleRegister = async () => {
    try {
      await registerUser({
        email,
        password,
        full_name: fullName,
        country,
        currency,
      });

      Alert.alert("✅ Usuario creado", "Ya puedes iniciar sesión");
      setIsRegistering(false);
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear el usuario");
      console.error(error);
    }
  };

  const handleGoogleAuth = async (idToken: string | undefined, accessToken: string | undefined) => {
    if (!idToken) {
      Alert.alert("Error", "No ID token received from Google");
      return;
    }

    try {
      // Check if user exists by attempting login
      try {
        const response = await axios.post(
          `${API_URL}/users/google-auth`,
          { google_token: idToken },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const { access_token, user } = response.data;
        await login(user, access_token);
      } catch (err: any) {
        // If user doesn't exist, show country selection
        if (err.response?.status === 400 || err.response?.status === 404) {
          // Get user info from Google using access token
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
          );
          const googleUserInfo = await userInfoResponse.json();
          
          // Store Google data temporarily
          setGoogleAuthData({
            idToken,
            email: googleUserInfo.email,
            fullName: googleUserInfo.name
          });
          setShowCountrySelection(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const error = err as AxiosError;
      Alert.alert("Error", "Google authentication failed");
      console.error(error.response?.data || error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔍 Starting Google Sign-In...');
      console.log('🔑 Using Client ID:', GOOGLE_CLIENT_ID);
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', userInfo);
      console.log('🆔 ID Token from userInfo:', userInfo.idToken);
      
      // Get the tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('🎫 Tokens received:', tokens);
      
      // Use idToken from userInfo or tokens
      const idToken = userInfo.idToken || tokens.idToken;
      const accessToken = tokens.accessToken;
      
      if (idToken) {
        await handleGoogleAuth(idToken, accessToken);
      } else {
        console.error('❌ No ID token received');
        Alert.alert('Error', 'Failed to get ID token from Google');
      }
    } catch (error: any) {
      console.error('🔥 Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('🚫 User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('⏳ Sign-In already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('📱 Play Services not available');
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        console.log('❌ Other error:', error.message);
        Alert.alert('Error', 'Failed to sign in with Google');
      }
    }
  };

  const completeGoogleRegistration = async () => {
    if (!googleAuthData) return;

    try {
      // Create user with country/currency selection
      const response = await axios.post(
        `${API_URL}/users/google-auth`,
        { 
          google_token: googleAuthData.idToken,
          country: country,
          currency: currency
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { access_token, user } = response.data;
      await login(user, access_token);
      
      // Reset state
      setShowCountrySelection(false);
      setGoogleAuthData(null);
    } catch (error) {
      console.error('Google registration error:', error);
      Alert.alert('Error', 'Failed to complete registration');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>
        {isRegistering ? "Crear cuenta" : "Login"}
      </Text>
       <Text style={styles.buttonText }>
        Url API ${API_URL}
      </Text>     

      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
          
          {/* Country Selection */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Country:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.countryScroll}
            >
              {COUNTRIES.map((countryOption) => (
                <TouchableOpacity
                  key={countryOption.code}
                  style={[
                    styles.countryChip,
                    country === countryOption.code && styles.selectedChip
                  ]}
                  onPress={() => {
                    setCountry(countryOption.code);
                    setCurrency(countryOption.currency);
                  }}
                >
                  <Text style={[
                    styles.countryChipText,
                    country === countryOption.code && styles.selectedChipText
                  ]}>
                    {countryOption.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Currency Display */}
          <View style={styles.currencyContainer}>
            <Text style={styles.currencyLabel}>Currency: {currency}</Text>
          </View>
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Emal"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={isRegistering ? handleRegister : handleLogin}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? "Registrarse" : "Entrar"}
        </Text>
      </TouchableOpacity>

      {!isRegistering && (
        <>
          <Text style={styles.orText}>or</Text>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={20} color="#4285f4" />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={() => setIsRegistering(!isRegistering)}
        style={styles.switch}
      >
        <Text style={styles.switchText}>
          {isRegistering
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Regístrate"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  switch: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    color: "#4a90e2",
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  countryScroll: {
    maxHeight: 60,
  },
  countryChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: "#4a90e2",
    borderColor: "#4a90e2",
  },
  countryChipText: {
    fontSize: 14,
    color: "#333",
  },
  selectedChipText: {
    color: "#fff",
    fontWeight: "600",
  },
  currencyContainer: {
    backgroundColor: "#f0f4ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  currencyLabel: {
    fontSize: 14,
    color: "#4a90e2",
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  orText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginVertical: 10,
  },
});
