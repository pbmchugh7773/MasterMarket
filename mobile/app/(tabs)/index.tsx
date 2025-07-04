import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { fetchProducts } from '../../services/api';

import { fetchPricesByProduct } from '../../services/api';
import { fetchPricesByProductGeneric } from '../../services/api';
import { useBasket } from '../../context/BasketContext';
import { API_URL } from "../../config";

type Product = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  image_url: string;
  category: string;
};

const categories = [
  { name: 'All', icon: require('../../assets/icons/all.png') },
  { name: 'Fresh Food', icon: require('../../assets/icons/fresh_food.png') },
  { name: 'Bakery', icon: require('../../assets/icons/bakery.png') },
  { name: 'Treats & Snacks', icon: require('../../assets/icons/snacks.png') },
  { name: 'Food Cupboard', icon: require('../../assets/icons/food_cupboard.png') },
  { name: 'Frozen Food', icon: require('../../assets/icons/frozen_food.png') },
  { name: 'Drinks', icon: require('../../assets/icons/drinks.png') },
  { name: 'Baby', icon: require('../../assets/icons/baby.png') },
  { name: 'Health & Beauty', icon: require('../../assets/icons/health_beauty.png') },
  { name: 'Pets', icon: require('../../assets/icons/pets.png') },
  { name: 'Household', icon: require('../../assets/icons/household.png') },
  { name: 'Home & Living', icon: require('../../assets/icons/home_living.png') },
  { name: 'Inspiration & Events', icon: require('../../assets/icons/events.png') },
];

const PRODUCTS_PER_PAGE = 10;

const getImageUrl = (imagePath: string) => {
  return `${imagePath}`;
};


export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const { addToBasket: addToGlobalBasket } = useBasket();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  
  // Obtener productos al inicio
  useEffect(() => {
    console.log("Fetching products...");
    fetchProducts()
      .then((data) => {
        console.log("Products loaded:", data.length);
        setProducts(data);
      })
      .catch((err) => console.error('Error fetching products:', err));
  }, []);

  // Esta función maneja la lógica de filtrado
  const updateFilteredProducts = () => {
    console.log("Filtering products. Search:", searchText, "Category:", selectedCategory);
    console.log("Total products:", products.length);
  
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }
  
    let filtered = [...products];
  
    // ✅ Mostrar todo si está seleccionada "All"
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(
        (product) => 
          (product.category).trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }
  
    // Filtrar por texto de búsqueda si hay texto
    if (searchText.trim() !== '') {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
  
    setFilteredProducts(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  };
  

  // Actualizar productos mostrados basado en la paginación
  const updateDisplayedProducts = () => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    setDisplayedProducts(productsToShow);
  };

  // Actualizamos el filtrado cada vez que cambian las dependencias
  useEffect(() => {
    updateFilteredProducts();
  }, [searchText, selectedCategory, products]);

  // Actualizamos los productos mostrados cuando cambian los filtros o la página
  useEffect(() => {
    updateDisplayedProducts();
  }, [filteredProducts, currentPage]);

  const handleSearch = (text: string) => {
    console.log("Search text changed:", text);
    setSearchText(text);
  };

  const handleCategorySelect = (category: string) => {
    console.log("Category selected:", category);
    // Si la categoría ya está seleccionada, la deseleccionamos
    if (selectedCategory === category) {
      setSelectedCategory("All");
    } else {
      setSelectedCategory(category);
    }
  };

  const addToBasket = async (product: Product) => {
    try {
      const summary = await fetchPricesByProductGeneric(product.id);

      const basketItem = {
        id: summary.id,
        name: summary.name,
        image_url: summary.image_url,
        quantity: 1,
        // Ajuste aquí:
        prices: summary.products.map((p: any) => ({
          supermarket: p.supermarket,
          price: p.last_price,
          updated_at: p.updated_at, // Solo si el backend lo envía; si no, puedes quitarlo
        })),
      };
      console.log("Contenido de basketItem:", JSON.stringify(basketItem, null, 2));

      addToGlobalBasket(basketItem); // usamos el del contexto
      Alert.alert('Added to basket', `${summary.name} has been added.`);
    } catch (error) {
      console.error('Error fetching prices:', error);
      Alert.alert('Error', 'Could not fetch prices for this product.');
    }
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 10 }}
    >
      
      <Text style={styles.title}>MasterMarket</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search product: e.g. milk, bread..."
        value={searchText}
        onChangeText={handleSearch}
      />

      <Text style={styles.sectionTitle}>Browse by Category</Text>
      
      {/* Categorías en una fila horizontal con scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryItem,
              selectedCategory === category.name && styles.selectedCategory
            ]}
            onPress={() => handleCategorySelect(category.name)}
          >
            <Image source={category.icon} style={styles.categoryIcon} />
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Products</Text>
        {selectedCategory && (
          <Text style={styles.categoryIndicator}>
            Category: {selectedCategory} 
            <Text style={styles.clearCategoryText} onPress={() => setSelectedCategory("All")}>
              {" "}(Clear)
            </Text>
          </Text>
        )}

        {/* Información de paginación */}
        {filteredProducts.length > 0 && (
          <Text style={styles.paginationInfo}>
            Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
          </Text>
        )}

        {filteredProducts.length === 0 && (
          <Text style={styles.noProductsText}>
            {searchText.trim() === '' && selectedCategory === "All"
              ? 'Select a category or search for products.' 
              : 'No products found.'}
          </Text>
        )}
        
        {/* Productos mostrados en la página actual */}
        {displayedProducts.map((product) => (
          <TouchableOpacity key={product.id} onPress={() => addToBasket(product)}>
            <View style={styles.productCard}>
              <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.productImage} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                
                <Text style={styles.productCategory}>Category: {product.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[styles.paginationButton, !hasPrevPage && styles.disabledButton]}
              onPress={goToPrevPage}
              disabled={!hasPrevPage}
            >
              <Text style={[styles.paginationButtonText, !hasPrevPage && styles.disabledButtonText]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.pageNumbersContainer}>
              {getPageNumbers().map((pageNum) => (
                <TouchableOpacity
                  key={pageNum}
                  style={[
                    styles.pageNumberButton,
                    currentPage === pageNum && styles.activePageButton
                  ]}
                  onPress={() => goToPage(pageNum)}
                >
                  <Text style={[
                    styles.pageNumberText,
                    currentPage === pageNum && styles.activePageText
                  ]}>
                    {pageNum}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.paginationButton, !hasNextPage && styles.disabledButton]}
              onPress={goToNextPage}
              disabled={!hasNextPage}
            >
              <Text style={[styles.paginationButtonText, !hasNextPage && styles.disabledButtonText]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: '#F9F9F9' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    textAlign: 'center', 
    color: '#5A31F4' 
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
    marginTop: 12 
  },
  categoriesContainer: {
    paddingBottom: 12,
    paddingTop: 5,
    gap: 12,
    flexDirection: 'row',
  },
  categoryItem: { 
    width: 80, 
    alignItems: 'center',
    padding: 5,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedCategory: {
    backgroundColor: 'rgba(90, 49, 244, 0.1)',
    borderWidth: 1,
    borderColor: '#5A31F4'
  },
  categoryIcon: { 
    width: 50, 
    height: 50, 
    marginBottom: 4 
  },
  categoryText: { 
    fontSize: 12, 
    textAlign: 'center' 
  },
  productsSection: {
    marginVertical: 10,
  },
  categoryIndicator: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  clearCategoryText: {
    color: '#5A31F4',
    fontWeight: '500',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noProductsText: { 
    color: 'gray',
    textAlign: 'center',
    marginVertical: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 5 
  },
  productName: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  productDescription: { 
    fontSize: 12, 
    color: '#555' 
  },
  productCategory: { 
    fontSize: 10, 
    color: '#888', 
    marginTop: 4 
  },
  // Estilos de paginación
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  paginationButton: {
    backgroundColor: '#5A31F4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButtonText: {
    color: '#888',
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    
  },
  pageNumberButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 35,
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: '#5A31F4',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activePageText: {
    color: '#FFFFFF',
  },
});