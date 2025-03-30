import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPricesByProduct } from '../services/api'; // Ajustá el path si es necesario

type PriceEntry = {
  supermarket: 'Tesco' | 'Aldi' | 'Lidl';
  price: number;
  updated_at: string;
};

type Product = {
  id: number;
  name: string;
  quantity: number;
  prices: PriceEntry[];
};

type BasketContextType = {
  basket: Product[];
  addToBasket: (product: Product) => void;
  removeFromBasket: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearBasket: () => void;
  refreshPrices: () => Promise<void>;
};

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const BasketProvider = ({ children }: { children: React.ReactNode }) => {
  const [basket, setBasket] = useState<Product[]>([]);

  // Cargar basket desde AsyncStorage al iniciar
  useEffect(() => {
    const loadBasket = async () => {
      try {
        const storedBasket = await AsyncStorage.getItem('basket');
        if (storedBasket) {
          setBasket(JSON.parse(storedBasket));
        }
      } catch (error) {
        console.error('Error loading basket from storage:', error);
      }
    };
    loadBasket();
  }, []);

  // Guardar automáticamente cada vez que cambia el basket
  useEffect(() => {
    const saveBasket = async () => {
      try {
        await AsyncStorage.setItem('basket', JSON.stringify(basket));
      } catch (error) {
        console.error('Error saving basket to storage:', error);
      }
    };
    saveBasket();
  }, [basket]);

  const addToBasket = (product: Product) => {
    setBasket(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + product.quantity }
            : p
        );
      } else {
        return [...prev, product];
      }
    });
  };

  const removeFromBasket = (id: number) => {
    setBasket(prev => prev.filter(p => p.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setBasket(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, quantity: Math.max(p.quantity + delta, 1) }
          : p
      )
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const refreshPrices = async () => {
    try {
      const updatedBasket = await Promise.all(
        basket.map(async (item) => {
          const prices = await fetchPricesByProduct(item.id);
          return {
            ...item,
            prices: prices.map((p: any) => ({
              supermarket: p.supermarket,
              price: p.price,
              updated_at: p.updated_at,
            })),
          };
        })
      );
      setBasket(updatedBasket);
    } catch (error) {
      console.error('Error refreshing prices:', error);
    }
  };

  return (
    <BasketContext.Provider
      value={{
        basket,
        addToBasket,
        removeFromBasket,
        updateQuantity,
        clearBasket,
        refreshPrices,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) throw new Error('useBasket must be used within BasketProvider');
  return context;
};
