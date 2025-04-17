import axios from 'axios';

// Usar IP local de tu PC donde corre Docker
const API_URL = 'https://mastermarket-production.up.railway.app';

export const fetchProducts = async () => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const fetchPricesByProduct = async (productId: number) => {
  const response = await fetch(`https://mastermarket-production.up.railway.app/prices/product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  return await response.json();
};

// services/api.ts
export const loginUser = async (email: string, password: string) => {
  const response = await fetch('https://mastermarket-production.up.railway.app/auth/login', {
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

  return await response.json(); // Debe contener el access_token
};
