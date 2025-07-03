import axios from 'axios';
import { API_URL } from "../config";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔑 Token from storage:', token ? 'Found' : 'Not found');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set');
      } else {
        console.log('❌ No token found in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error getting token:', error);
    }
    console.log('📤 Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - Token may be invalid or expired');
      console.log('Response:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Existing endpoints
export const fetchProducts = async () => {
  const response = await axios.get(`${API_URL}/products/all-simple`);
  return response.data;
};

export const fetchPricesByProduct = async (productId: number) => {
  const response = await fetch(`${API_URL}/prices/product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  return await response.json();
};

export const fetchPricesByProductGeneric = async (productId: number) => {
  const response = await fetch(`${API_URL}/products/${productId}/summary`); 
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  const data = await response.json();
  console.log("Response from fetchPricesByProductGeneric:\n", JSON.stringify(data, null, 2));
  return data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return await response.json();
};

export const registerUser = async (userData: {
  email: string;
  password: string;
  full_name?: string;
  location?: string;
  country?: string;
  currency?: string;
}) => {
  const url = `${API_URL}/auth/register`;
  console.log('🔄 Attempting registration at:', url);
  console.log('📝 User data:', JSON.stringify(userData, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Registration failed');
      } catch (e) {
        throw new Error(`Registration failed: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Registration successful:', result);
    return result;
    
  } catch (error) {
    console.log('🔥 Registration error:', error);
    throw error;
  }
};

// Community Pricing endpoints
export const submitCommunityPrice = async (priceData: {
  product_id: number;
  store_name: string;
  store_location: string;
  price: number;
  price_photo_url?: string | null;
  currency?: string;
}) => {
  console.log('🔄 Submitting community price:', JSON.stringify(priceData, null, 2));
  const response = await apiClient.post('/api/community-prices/submit', priceData);
  return response.data;
};

export const extractPriceFromPhoto = async (formData: FormData) => {
  const response = await apiClient.post('/api/community-prices/extract-price', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const searchProductByBarcode = async (barcode: string) => {
  const response = await apiClient.get(`/api/community-prices/search-barcode/${barcode}`);
  return response.data;
};

export const getProductCommunityPrices = async (productId: number, location?: string) => {
  const params = location ? { location } : {};
  const response = await apiClient.get(`/api/community-prices/product/${productId}/prices`, { params });
  return response.data;
};

export const voteCommunityPrice = async (priceId: number, voteType: 'upvote' | 'downvote') => {
  const response = await apiClient.post('/api/community-prices/vote', {
    price_id: priceId,
    vote_type: voteType,
  });
  return response.data;
};

export const removePriceVote = async (priceId: number) => {
  const response = await apiClient.delete(`/api/community-prices/vote/${priceId}`);
  return response.data;
};

export const getTrendingPrices = async (location?: string) => {
  const params = location ? { location } : {};
  const response = await apiClient.get('/api/community-prices/trending', { params });
  return response.data;
};

export const getProductRecentPrices = async (productId: number, limit: number = 3) => {
  const response = await apiClient.get(`/api/community-prices/product/${productId}/recent-prices`, {
    params: { limit }
  });
  return response.data;
};

// Debug function to check token
export const debugCheckToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    console.log('🔍 DEBUG - Token check:');
    console.log('Token exists:', token ? 'Yes' : 'No');
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('User exists:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User data:', JSON.parse(user));
    }
    return { token, user: user ? JSON.parse(user) : null };
  } catch (error) {
    console.error('Error checking token:', error);
    return null;
  }
};

// Store endpoints
export const getNearbyStores = async (latitude?: number, longitude?: number, radiusKm: number = 10) => {
  const params: any = { radius_km: radiusKm };
  if (latitude && longitude) {
    params.latitude = latitude;
    params.longitude = longitude;
  }
  const response = await apiClient.get('/api/community-prices/nearby-stores', { params });
  return response.data;
};

export const getPopularStores = async (limit: number = 10) => {
  const response = await apiClient.get('/api/community-prices/popular-stores', { 
    params: { limit }
  });
  return response.data;
};

