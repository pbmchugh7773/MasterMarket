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
  Modal,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { AxiosError } from "axios";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../config";
import { registerUser } from "../services/api";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Constants
const GOOGLE_CLIENT_ID = '758094174857-oafpsei99h13tpgujjlcbt02bthust93.apps.googleusercontent.com';

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

// Configure Google Sign-In
GoogleSignin.configure({
  scopes: ['profile', 'email'],
  webClientId: GOOGLE_CLIENT_ID,
});

// Types
interface GoogleAuthData {
  idToken: string;
  email: string;
  fullName: string;
}

interface Country {
  code: string;
  name: string;
  currency: string;
}

// Components
const CountrySelector: React.FC<{
  countries: Country[];
  selectedCountry: string;
  onSelectCountry: (code: string, currency: string) => void;
  t: (key: string) => string;
}> = ({ countries, selectedCountry, onSelectCountry, t }) => (
  <View style={styles.pickerContainer}>
    <Text style={styles.pickerLabel}>{t('profile.country')}:</Text>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.countryScroll}
    >
      {countries.map((country) => (
        <TouchableOpacity
          key={country.code}
          style={[
            styles.countryChip,
            selectedCountry === country.code && styles.selectedChip
          ]}
          onPress={() => onSelectCountry(country.code, country.currency)}
        >
          <Text style={[
            styles.countryChipText,
            selectedCountry === country.code && styles.selectedChipText
          ]}>
            {country.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const CountrySelectionModal: React.FC<{
  visible: boolean;
  googleAuthData: GoogleAuthData | null;
  selectedCountry: string;
  onSelectCountry: (code: string, currency: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string, options?: any) => string;
}> = ({ visible, googleAuthData, selectedCountry, onSelectCountry, onConfirm, onCancel, t }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
        <Text style={styles.modalSubtitle}>
          {t('messages.welcomeUser', { name: googleAuthData?.fullName })} {t('auth.selectCountry')}.
        </Text>

        <Text style={styles.pickerLabel}>{t('auth.selectCountry')}:</Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.countryList}
        >
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryItem,
                selectedCountry === country.code && styles.selectedCountryItem
              ]}
              onPress={() => onSelectCountry(country.code, country.currency)}
            >
              <Text style={[
                styles.countryItemText,
                selectedCountry === country.code && styles.selectedCountryItemText
              ]}>
                {country.name}
              </Text>
              <Text style={styles.currencyText}>
                {country.currency}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>{t('common.next')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Main Component
export default function LoginScreen() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("UK");
  const [currency, setCurrency] = useState("GBP");
  
  // UI state
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCountrySelection, setShowCountrySelection] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState<GoogleAuthData | null>(null);
  
  // Hooks
  const { login } = useAuth();
  const { t } = useLanguage();

  // Handlers
  const handleSelectCountry = (countryCode: string, countryCurrency: string) => {
    setCountry(countryCode);
    setCurrency(countryCurrency);
  };

  const handleLogin = async () => {
    try {
      const data = new URLSearchParams();
      data.append("username", email);
      data.append("password", password);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        data,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token, user } = response.data;
      await login(user, access_token);
    } catch (err) {
      const error = err as AxiosError;
      Alert.alert(t('common.error'), t('auth.loginError'));
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

      Alert.alert(t('common.success'), t('auth.registrationSuccess'));
      setIsRegistering(false);
      resetForm();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.registrationError'));
      console.error(error);
    }
  };

  const handleGoogleAuth = async (idToken: string | undefined, accessToken: string | undefined) => {
    if (!idToken) {
      Alert.alert(t('common.error'), t('errors.unknownError'));
      return;
    }

    try {
      console.log("🔄 Attempting Google auth with backend...");
      const response = await axios.post(
        `${API_URL}/users/google-auth`,
        { google_token: idToken },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ User exists, logging in...");
      const { access_token, user } = response.data;
      await login(user, access_token);
    } catch (err: any) {
      console.log("🔍 Backend response error:", {
        status: err.response?.status,
        data: err.response?.data,
        detail: err.response?.data?.detail
      });
      
      // Check if it's a new user that needs country/currency selection
      if (err.response?.status === 400 && 
          (err.response?.data?.detail?.includes("Country and currency are required") ||
           err.response?.data?.detail?.includes("Google authentication failed: 400: Country and currency are required"))) {
        console.log("📍 New user detected, showing country selection");
        
        // Parse user info from the ID token
        try {
          const tokenParts = idToken.split('.');
          const payload = JSON.parse(atob(tokenParts[1]));
          
          setGoogleAuthData({
            idToken,
            email: payload.email,
            fullName: payload.name
          });
          setShowCountrySelection(true);
        } catch (parseError) {
          console.error("Failed to parse ID token:", parseError);
          Alert.alert(t('common.error'), t('errors.unknownError'));
        }
      } else {
        Alert.alert(t('common.error'), t('auth.loginError'));
        console.error(err.response?.data || err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔍 Starting Google Sign-In...');
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', userInfo);
      
      const tokens = await GoogleSignin.getTokens();
      console.log('🎫 Tokens received:', tokens);
      
      // The idToken comes from tokens, not from userInfo
      const idToken = tokens.idToken;
      const accessToken = tokens.accessToken;
      
      if (idToken) {
        await handleGoogleAuth(idToken, accessToken);
      } else {
        console.error('❌ No ID token received');
        Alert.alert(t('common.error'), t('errors.unknownError'));
      }
    } catch (error: any) {
      console.error('🔥 Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('🚫 User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('⏳ Sign-In already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('📱 Play Services not available');
        Alert.alert(t('common.error'), t('errors.unknownError'));
      } else {
        console.log('❌ Other error:', error.message);
        Alert.alert(t('common.error'), t('auth.loginError'));
      }
    }
  };

  const completeGoogleRegistration = async () => {
    if (!googleAuthData) return;

    try {
      console.log('🎯 Completing Google registration with:', {
        country,
        currency,
        email: googleAuthData.email,
        fullName: googleAuthData.fullName
      });
      
      const requestData = { 
        google_token: googleAuthData.idToken,
        country: country,
        currency: currency
      };
      
      console.log('📤 Sending request:', requestData);
      
      const response = await axios.post(
        `${API_URL}/users/google-auth`,
        requestData,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log('✅ Google registration successful:', response.data);
      const { access_token, user } = response.data;
      await login(user, access_token);
      
      // Reset state
      setShowCountrySelection(false);
      setGoogleAuthData(null);
    } catch (error: any) {
      console.error('❌ Google registration error:', error);
      console.error('📊 Error response:', error.response?.data);
      Alert.alert(t('common.error'), `${t('auth.registrationError')}: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setCountry("UK");
    setCurrency("GBP");
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
  };

  // Render
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>
        {isRegistering ? t('auth.createAccount') : t('auth.login')}
      </Text>

      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('profile.name')}
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
          
          <CountrySelector
            countries={COUNTRIES}
            selectedCountry={country}
            onSelectCountry={handleSelectCountry}
            t={t}
          />
          
          <View style={styles.currencyContainer}>
            <Text style={styles.currencyLabel}>{t('profile.currency')}: {currency}</Text>
          </View>
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={t('auth.password')}
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
          {isRegistering ? t('auth.register') : t('auth.login')}
        </Text>
      </TouchableOpacity>

      {!isRegistering && (
        <>
          <Text style={styles.orText}>{t('common.or') || 'or'}</Text>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={20} color="#4285f4" />
            <Text style={styles.googleButtonText}>{t('auth.loginWithGoogle')}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={toggleMode} style={styles.switch}>
        <Text style={styles.switchText}>
          {isRegistering
            ? t('auth.alreadyHaveAccount')
            : t('auth.dontHaveAccount')}
        </Text>
      </TouchableOpacity>

      <CountrySelectionModal
        visible={showCountrySelection}
        googleAuthData={googleAuthData}
        selectedCountry={country}
        onSelectCountry={handleSelectCountry}
        onConfirm={completeGoogleRegistration}
        onCancel={() => {
          setShowCountrySelection(false);
          setGoogleAuthData(null);
        }}
        t={t}
      />
    </KeyboardAvoidingView>
  );
}

// Styles
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
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingRight: 15,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  countryScroll: {
    flexGrow: 0,
  },
  countryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChip: {
    backgroundColor: "#e3f2fd",
    borderColor: "#4a90e2",
  },
  countryChipText: {
    fontSize: 14,
    color: "#666",
  },
  selectedChipText: {
    color: "#4a90e2",
    fontWeight: "600",
  },
  currencyContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 15,
  },
  currencyLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  countryList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f7f7f7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCountryItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#4a90e2',
  },
  countryItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCountryItemText: {
    fontWeight: '600',
    color: '#4a90e2',
  },
  currencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});