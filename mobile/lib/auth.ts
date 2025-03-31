import AsyncStorage from '@react-native-async-storage/async-storage';

export const isLoggedIn = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};
