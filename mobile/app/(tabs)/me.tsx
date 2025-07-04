import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { API_URL } from '@/config';

export default function MeScreen() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
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
        Alert.alert(t('errors.unauthorized'));
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
        Alert.alert(t('common.error'), t('profile.profileError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
    Alert.alert(t('auth.logout'));
  };

  // Show loading screen while checking auth
  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>{t('common.loading')}</Text>
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
        <Text>{t('profile.profileError')}</Text>
        <Button title={t('auth.login')} onPress={handleLogout} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('messages.welcomeUser', { name: userData.full_name || 'Usuario' })}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.myProfile')}</Text>
          <Text style={styles.infoText}>{t('auth.email')}: {userData.email}</Text>
          <Text style={styles.infoText}>{t('profile.country')}: {userData.country || 'N/A'}</Text>
          <Text style={styles.infoText}>{t('profile.currency')}: {userData.currency || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.settings')}</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.language')}</Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[styles.languageButton, language === 'en' && styles.selectedLanguage]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.languageText, language === 'en' && styles.selectedLanguageText]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageButton, language === 'es' && styles.selectedLanguage]}
                onPress={() => setLanguage('es')}
              >
                <Text style={[styles.languageText, language === 'es' && styles.selectedLanguageText]}>Español</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  selectedLanguage: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  languageText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLanguageText: {
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
