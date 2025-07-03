import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from 'expo-router';

export default function AdminScreen() {
  const { user, loading: authLoading } = useAuth();

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔒 No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [authLoading, user]);

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#5A31F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user is null after loading, it will redirect in useEffect
  if (!user) {
    return null;
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.accessDeniedText}>🚫 Access Denied</Text>
        <Text style={styles.subText}>You need admin privileges to access this section</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContent}>
      <Text style={styles.title}>👨‍💼 Panel de Administración</Text>
      <Text style={styles.subText}>Welcome, {user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
});
