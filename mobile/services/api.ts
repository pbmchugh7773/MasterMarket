import axios from 'axios';

// Usar IP local de tu PC donde corre Docker
const API_URL = 'http://192.168.1.25:8000';

export const fetchProducts = async () => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const fetchPricesByProduct = async (productId: number) => {
  const response = await fetch(`http://192.168.1.25:8000/prices/product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  return await response.json();
};

