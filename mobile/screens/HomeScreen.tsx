import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const categories = [
  { name: 'Supermarket', icon: require('../assets/icons/supermarket.png') },
  { name: 'Tobacco', icon: require('../assets/icons/tobacco.png') },
  { name: 'Fruit', icon: require('../assets/icons/fruit.png') },
  { name: 'Meat', icon: require('../assets/icons/meat.png') },
  { name: 'Dairy', icon: require('../assets/icons/dairy.png') },
  { name: 'Bakery', icon: require('../assets/icons/bakery.png') },
  { name: 'Desserts', icon: require('../assets/icons/desserts.png') },
  { name: 'Drinks', icon: require('../assets/icons/drinks.png') },
];

const sampleBasket = [
  { id: 1, name: 'Leche Entera (1L)', quantity: '1 unidad' },
  { id: 2, name: 'Pan de Molde', quantity: '1 unidad' },
  { id: 3, name: 'Huevos (12 unidades)', quantity: '1 paquete' },
];

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MasterMarket</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder={t('products.searchProducts')}
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Categories */}
      <Text style={styles.sectionTitle}>{t('products.categories.food')}</Text>
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity key={category.name} style={styles.categoryItem}>
            <Image source={category.icon} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Basket */}
      <Text style={styles.sectionTitle}>{t('basket.myBasket')}</Text>
      <View style={styles.basketContainer}>
        {sampleBasket.map((item) => (
          <View key={item.id} style={styles.basketItem}>
            <Text style={styles.basketText}>{item.name}</Text>
            <Text style={styles.basketQuantity}>{item.quantity}</Text>
            <TouchableOpacity>
              <Text style={styles.removeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.compareButton}>
          <Text style={styles.buttonText}>{t('prices.prices')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.matchButton}>
          <Text style={styles.buttonText}>{t('products.products')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#5A31F4',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  basketContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  basketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  basketText: {
    flex: 1,
    fontSize: 14,
  },
  basketQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  removeButton: {
    fontSize: 18,
    color: 'red',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  compareButton: {
    backgroundColor: '#00B894',
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  matchButton: {
    backgroundColor: '#A29BFE',
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
