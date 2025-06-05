import axios from 'axios';

// Usar IP local de tu PC donde corre Docker
const API_URL = 'http://192.168.1.25:8000';

export const fetchProducts = async () => {
  const response = await axios.get(`${API_URL}/products/all-simple`);
  return response.data;
};

export const fetchPricesByProduct = async (productId: number) => {
  const response = await fetch(`http://192.168.1.25:8000/prices/product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  return await response.json();
};
export const fetchPricesByProductGeneric = async (productId: number) => {
  const response = await fetch(`http://192.168.1.25:8000/products/${productId}/summary`); 
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  const data = await response.json();
  // Imprime el JSON formateado con 2 espacios de indentación
  console.log("Response from fetchPricesByProductGeneric:\n", JSON.stringify(data, null, 2));
  return data;

};

// services/api.ts
export const loginUser = async (email: string, password: string) => {
  const response = await fetch('http://192.168.1.25:8000/auth/login', {
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
