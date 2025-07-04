import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchProducts, submitCommunityPrice, searchProductByBarcode, getProductCommunityPrices, voteCommunityPrice, extractPriceFromPhoto, getTrendingPrices, getProductRecentPrices, debugCheckToken, getPopularStores, getNearbyStores } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBasket } from '../../context/BasketContext';
import { useLanguage } from '../../context/LanguageContext';

import { router } from 'expo-router';

// Import camera modules conditionally to avoid Expo Go issues
let Camera: any = null;
let BarCodeScanner: any = null;
let ImagePicker: any = null;
let Location: any = null;

try {
  Camera = require('expo-camera').Camera;
  BarCodeScanner = require('expo-camera').BarCodeScanner;
  ImagePicker = require('expo-image-picker');
  Location = require('expo-location');
} catch (error) {
  console.warn('Camera/Location modules not available in Expo Go. Some features will be disabled.');
}

type Product = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  image_url: string;
  category: string;
  barcode?: string;
};

type CommunityPrice = {
  id: number;
  product_id: number;
  store_name: string;
  store_location: string;
  price: number;
  price_photo_url?: string;
  currency: string;
  upvotes: number;
  downvotes: number;
  verification_status: string;
  created_at: string;
  user_vote?: 'upvote' | 'downvote' | null;
  submitted_by?: {
    full_name?: string;
    email: string;
  };
};

type CommunityPriceWithChange = CommunityPrice & {
  price_change_percentage?: number;
  previous_price?: number;
};

type TrendingPriceWithProduct = CommunityPrice & {
  product_name: string;
  product_image_url?: string;
};

const categories = [
  { name: 'All', icon: '🛒' },
  { name: 'Fresh Food', icon: '🥬' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Treats & Snacks', icon: '🍿' },
  { name: 'Food Cupboard', icon: '🥫' },
  { name: 'Frozen Food', icon: '🧊' },
  { name: 'Drinks', icon: '🥤' },
  { name: 'Baby', icon: '🍼' },
  { name: 'Health & Beauty', icon: '💄' },
  { name: 'Pets', icon: '🐕' },
  { name: 'Household', icon: '🧹' },
  { name: 'Home & Living', icon: '🏠' },
];

const PRODUCTS_PER_PAGE = 10;

export default function HomeScreen() {
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showProductPrices, setShowProductPrices] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');
  const [debouncedProductSearchText, setDebouncedProductSearchText] = useState('');
  const productSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [communityPrices, setCommunityPrices] = useState<CommunityPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recentPrices, setRecentPrices] = useState<TrendingPriceWithProduct[]>([]);
  const [loadingRecentPrices, setLoadingRecentPrices] = useState(false);
  const [productPrices, setProductPrices] = useState<{[key: number]: CommunityPriceWithChange[]}>({});
  const [popularStores, setPopularStores] = useState<{store_name: string, store_location: string, submission_count: number}[]>([]);
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [showStoreSelection, setShowStoreSelection] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const { addToBasket: addToGlobalBasket } = useBasket();

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔒 No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [authLoading, user]);

  // Get camera permissions
  useEffect(() => {
    (async () => {
      if (Camera) {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.warn('Camera permissions not available:', error);
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  // Fetch products and recent prices
  useEffect(() => {
    fetchProductsData();
    fetchRecentPrices();
  }, []);

  const fetchProductsData = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
      // Load recent prices for each product
      fetchProductPrices(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch recent prices for products
  const fetchProductPrices = async (productsData: Product[]) => {
    try {
      console.log('🔄 Fetching prices for', productsData.length, 'products');
      const pricesPromises = productsData.slice(0, 20).map(async (product) => { // Limit to first 20 products for performance
        try {
          console.log(`📊 Fetching prices for product: ${product.name} (ID: ${product.id})`);
          const prices = await getProductRecentPrices(product.id, 3);
          console.log(`✅ Found ${prices.length} prices for ${product.name}`);
          return { productId: product.id, prices };
        } catch (error) {
          console.error(`❌ Error fetching prices for product ${product.id} (${product.name}):`, error);
          return { productId: product.id, prices: [] };
        }
      });
      
      const results = await Promise.all(pricesPromises);
      const pricesMap: {[key: number]: CommunityPriceWithChange[]} = {};
      
      results.forEach(({ productId, prices }) => {
        const product = productsData.find(p => p.id === productId);
        const productName = product ? product.name : `Unknown (${productId})`;
        
        if (prices.length > 0) {
          pricesMap[productId] = prices;
          console.log(`📦 Added ${prices.length} prices for product ${productId} (${productName})`);
        } else {
          console.log(`📦 No prices found for product ${productId} (${productName})`);
        }
      });
      
      console.log('🎯 Final prices map:', Object.keys(pricesMap).length, 'products with prices');
      setProductPrices(prevPrices => ({
        ...prevPrices,
        ...pricesMap
      }));
    } catch (error) {
      console.error('Error fetching product prices:', error);
    }
  };

  // Fetch recent prices for display on home screen
  const fetchRecentPrices = async () => {
    setLoadingRecentPrices(true);
    try {
      const data = await getTrendingPrices();
      setRecentPrices(data.slice(0, 6)); // Show only top 6 recent prices
    } catch (error) {
      console.error('Failed to fetch recent prices:', error);
    }
    setLoadingRecentPrices(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductsData();
    await fetchRecentPrices();
    setRefreshing(false);
  }, []);

  // Debounced search state
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search text
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  // Optimized filter products with memoization
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(
        (product) => product.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }

    if (debouncedSearchText.trim() !== '') {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter((product) => {
        return product.name.toLowerCase().includes(searchLower) ||
               product.description.toLowerCase().includes(searchLower) ||
               (product.barcode && product.barcode.includes(debouncedSearchText));
      });
    }

    return filtered;
  }, [products, selectedCategory, debouncedSearchText]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  // Memoized displayed products
  const displayedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const products = filteredProducts.slice(startIndex, endIndex);
    console.log(`📄 Page ${currentPage}: Displaying ${products.length} products`, products.map(p => `${p.name} (ID: ${p.id})`));
    
    // Load prices for currently displayed products if not already loaded
    products.forEach(product => {
      if (!productPrices[product.id]) {
        console.log(`⚠️ No prices loaded for ${product.name} (ID: ${product.id})`);
      } else {
        console.log(`✅ Prices available for ${product.name}: ${productPrices[product.id].length} prices`);
      }
    });
    
    return products;
  }, [filteredProducts, currentPage, productPrices]);

  // Load prices for currently displayed products when page changes
  useEffect(() => {
    const loadPricesForCurrentPage = async () => {
      const productsNeedingPrices = displayedProducts.filter(product => !productPrices[product.id]);
      
      if (productsNeedingPrices.length > 0) {
        console.log(`🔄 Loading prices for ${productsNeedingPrices.length} products on current page:`, 
          productsNeedingPrices.map(p => `${p.name} (${p.id})`));
        await fetchProductPrices(productsNeedingPrices);
      } else {
        console.log('✅ All products on current page already have prices loaded');
      }
    };
    
    if (displayedProducts.length > 0) {
      loadPricesForCurrentPage();
    }
  }, [displayedProducts.map(p => p.id).join(','), Object.keys(productPrices).join(',')]);

  // Handle barcode scan
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setShowScanner(false);
    setLoading(true);
    
    try {
      const result = await searchProductByBarcode(data);
      if (result.found && result.product) {
        setSelectedProduct(result.product);
        Alert.alert('Product Found', `${result.product.name}`);
      } else {
        Alert.alert('Not Found', 'Product not in database. You can add it manually.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search product');
    }
    
    setLoading(false);
  };

  // Handle barcode scanner button press
  const handleBarcodeScanner = () => {
    if (!BarCodeScanner) {
      Alert.alert(
        'Camera Not Available',
        'Barcode scanning is not available in Expo Go. Please use a development build or manual search.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowScanner(true);
  };

  // Debounce product search text
  useEffect(() => {
    if (productSearchTimeoutRef.current) {
      clearTimeout(productSearchTimeoutRef.current);
    }
    
    productSearchTimeoutRef.current = setTimeout(() => {
      setDebouncedProductSearchText(productSearchText);
    }, 300);

    return () => {
      if (productSearchTimeoutRef.current) {
        clearTimeout(productSearchTimeoutRef.current);
      }
    };
  }, [productSearchText]);

  // Memoized filtered search products
  const filteredSearchProducts = useMemo(() => {
    if (debouncedProductSearchText.trim() === '') {
      return products;
    }
    
    const searchLower = debouncedProductSearchText.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      (product.barcode && product.barcode.includes(debouncedProductSearchText))
    );
  }, [products, debouncedProductSearchText]);

  // Handle manual product search
  const handleManualSearch = () => {
    setProductSearchText('');
    setShowProductSearch(true);
  };

  // Select product from search
  const selectProductFromSearch = (product: Product) => {
    setSelectedProduct(product);
    setShowProductSearch(false);
    setProductSearchText('');
    Alert.alert('Product Selected', `Selected: ${product.name}`);
  };

  // Get user location and nearby stores
  const loadNearbyStores = async () => {
    if (!Location) {
      console.log('Location services not available');
      return;
    }
    
    setLoadingStores(true);
    try {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }
      
      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      // Get nearby stores
      const stores = await getNearbyStores(
        location.coords.latitude,
        location.coords.longitude,
        5000 // 5km radius
      );
      setNearbyStores(stores);
    } catch (error) {
      console.error('Failed to get location/stores:', error);
    }
    setLoadingStores(false);
  };

  // Quick update price - pre-select product and open modal
  const quickUpdatePrice = async (product: Product) => {
    setSelectedProduct(product);
    setNewPrice('');
    setStoreName('');
    setStoreLocation('');
    setShowPriceUpdate(true);
    
    // Load stores
    setLoadingStores(true);
    try {
      // Load popular stores
      const popularStoresData = await getPopularStores();
      setPopularStores(popularStoresData);
      
      // Try to load nearby stores
      await loadNearbyStores();
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
    setLoadingStores(false);
  };


  // Handle price photo capture
  const handlePricePhoto = async () => {
    if (!ImagePicker) {
      Alert.alert(
        'Camera Not Available',
        'Photo capture is not available in Expo Go. Please enter price manually.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        try {
          // Create form data for upload
          const formData = new FormData();
          const photo = result.assets[0];
          
          // @ts-ignore
          formData.append('file', {
            uri: photo.uri,
            type: 'image/jpeg',
            name: 'price_photo.jpg',
          });

          const extractResult = await extractPriceFromPhoto(formData);
          
          if (extractResult.success) {
            if (extractResult.extracted_price) {
              setNewPrice(extractResult.extracted_price.toString());
              Alert.alert('Success', extractResult.message);
            } else {
              Alert.alert('Info', 'Could not extract price. Please enter manually.');
            }
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to upload photo');
        }
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Camera not available');
    }
  };

  // Submit price
  const submitPrice = async () => {
    if (!selectedProduct || !newPrice || !storeName || !storeLocation) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to submit prices');
      return;
    }

    setLoading(true);
    try {
      await submitCommunityPrice({
        product_id: selectedProduct.id,
        store_name: storeName,
        store_location: storeLocation,
        price: parseFloat(newPrice),
        currency: 'GBP',
      });

      Alert.alert('Success', 'Price submitted successfully!');
      resetPriceForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit price');
    }
    setLoading(false);
  };

  const resetPriceForm = () => {
    setShowPriceUpdate(false);
    setSelectedProduct(null);
    setNewPrice('');
    setStoreName('');
    setStoreLocation('');
  };

  // View product prices
  const viewProductPrices = async (product: Product) => {
    setSelectedProduct(product);
    setLoading(true);
    
    try {
      const prices = await getProductCommunityPrices(product.id, user?.location);
      setCommunityPrices(prices);
      setShowProductPrices(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prices');
    }
    
    setLoading(false);
  };

  // Vote on price
  const handleVote = async (priceId: number, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      Alert.alert('Error', 'Please login to vote');
      return;
    }

    try {
      console.log(`🗳️ Voting ${voteType} on price ${priceId}`);
      const result = await voteCommunityPrice(priceId, voteType);
      console.log(`✅ Vote result:`, result);
      
      // Update communityPrices state (for modal)
      setCommunityPrices(prices => 
        prices.map(p => 
          p.id === priceId 
            ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: voteType }
            : p
        )
      );
      
      // Update productPrices state (for main screen)
      setProductPrices(prevProductPrices => {
        const updatedProductPrices = { ...prevProductPrices };
        
        // Find and update the price in the productPrices map
        Object.keys(updatedProductPrices).forEach(productId => {
          updatedProductPrices[parseInt(productId)] = updatedProductPrices[parseInt(productId)].map(p => 
            p.id === priceId 
              ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: voteType }
              : p
          );
        });
        
        console.log(`🔄 Updated productPrices for price ${priceId}`);
        return updatedProductPrices;
      });
      
      // Update recentPrices state (for Recent Prices section)
      setRecentPrices(prices => 
        prices.map(p => 
          p.id === priceId 
            ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: voteType }
            : p
        )
      );
      
    } catch (error) {
      console.error('❌ Vote failed:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const getPriceTrend = (price: CommunityPrice) => {
    const totalVotes = price.upvotes + price.downvotes;
    const approvalRate = totalVotes > 0 ? (price.upvotes / totalVotes) * 100 : 0;
    
    return {
      approvalRate: approvalRate.toFixed(0),
      isVerified: price.verification_status === 'verified',
      isDisputed: price.verification_status === 'disputed',
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#5A31F4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user is null after loading, it will redirect in useEffect
  if (!user) {
    return null;
  }

  // Country and Currency configuration
  const getCountryData = () => {
    const countryMap = {
      'UK': { flag: '🇬🇧', currency: 'GBP', symbol: '£' },
      'US': { flag: '🇺🇸', currency: 'USD', symbol: '$' },
      'IE': { flag: '🇮🇪', currency: 'EUR', symbol: '€' },
      'ES': { flag: '🇪🇸', currency: 'EUR', symbol: '€' },
      'FR': { flag: '🇫🇷', currency: 'EUR', symbol: '€' },
      'DE': { flag: '🇩🇪', currency: 'EUR', symbol: '€' },
      'IT': { flag: '🇮🇹', currency: 'EUR', symbol: '€' },
      'CA': { flag: '🇨🇦', currency: 'CAD', symbol: '$' },
      'AU': { flag: '🇦🇺', currency: 'AUD', symbol: '$' },
    };
    
    return countryMap[user?.country] || { flag: '🌍', currency: 'GBP', symbol: '£' };
  };

  const countryData = getCountryData();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>MasterMarket</Text>
          <Text style={styles.subtitle}>{t('prices.prices')}</Text>
        </View>
        
        {/* Country and Currency Indicator */}
        <View style={styles.countryIndicator}>
          <Text style={styles.countryFlag}>{countryData.flag}</Text>
          <Text style={styles.currencySymbol}>{countryData.symbol}</Text>
        </View>
      </View>

      {/* Debug Button - Temporary */}
      <TouchableOpacity 
        style={[styles.updatePriceButton, { backgroundColor: '#FF6B6B', marginBottom: 10 }]}
        onPress={async () => {
          const tokenInfo = await debugCheckToken();
          Alert.alert('Token Debug Info', `Token: ${tokenInfo?.token ? 'Exists' : 'Missing'}\nUser: ${tokenInfo?.user ? tokenInfo.user.email : 'No user'}`);
        }}
      >
        <Text style={styles.updatePriceButtonText}>Debug: Check Token</Text>
      </TouchableOpacity>

      {/* Update Price Button */}
      <TouchableOpacity 
        style={styles.updatePriceButton}
        onPress={async () => {
          setShowPriceUpdate(true);
          setLoadingStores(true);
          try {
            // Load popular stores
            const popularStoresData = await getPopularStores();
            setPopularStores(popularStoresData);
            
            // Try to load nearby stores
            await loadNearbyStores();
          } catch (error) {
            console.error('Failed to load stores:', error);
          }
          setLoadingStores(false);
        }}
      >
        <MaterialCommunityIcons name="tag" size={20} color="white" />
        <Text style={styles.updatePriceButtonText}>Update Price</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.searchInput}
        placeholder={t('products.searchProducts')}
        value={searchText}
        onChangeText={setSearchText}
      />

      <Text style={styles.sectionTitle}>Browse by Category</Text>
      
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
            onPress={() => setSelectedCategory(category.name)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>{t('products.products')}</Text>
        
        {displayedProducts.map((product) => (
          <TouchableOpacity 
            key={product.id} 
            onPress={() => viewProductPrices(product)}
          >
            <View style={styles.productCard}>
              <View style={styles.productHeader}>
                <Image 
                  source={{ uri: product.image_url }} 
                  style={styles.productHeaderImage} 
                />
                <View style={styles.productHeaderInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>Category: {product.category}</Text>
                </View>
              </View>
              
              {/* Recent Prices for this product */}
              {(() => {
                const hasPrices = productPrices[product.id];
                console.log(`🔍 Checking prices for ${product.name} (ID: ${product.id}): ${hasPrices ? 'HAS PRICES' : 'NO PRICES'}`);
                if (hasPrices) {
                  console.log(`📊 Prices for ${product.name}:`, productPrices[product.id]);
                }
                return hasPrices;
              })() && (
                <View style={styles.productPricesSection}>
                  {productPrices[product.id].map((priceData, index) => {
                    console.log(`🎯 Rendering price ${index + 1} for ${product.name}:`, priceData);
                    return (
                    <View key={priceData.id} style={styles.priceCard}>
                      {/* Price and Store Row */}
                      <View style={styles.priceTopRow}>
                        <Text style={styles.priceAmount}>{countryData.symbol}{priceData.price.toFixed(2)}</Text>
                        {priceData.price_change_percentage !== null && (
                          <View style={styles.priceChangeContainer}>
                            <Ionicons 
                              name={priceData.price_change_percentage > 0 ? "arrow-up" : priceData.price_change_percentage < 0 ? "arrow-down" : "remove"}
                              size={12} 
                              color={priceData.price_change_percentage > 0 ? "#FF0000" : priceData.price_change_percentage < 0 ? "#00FF00" : "#808080"} 
                            />
                            <Text style={styles.priceChangeText}>
                              {priceData.price_change_percentage > 0 ? "🔴" : priceData.price_change_percentage < 0 ? "🟢" : "⚪"}
                              {Math.abs(priceData.price_change_percentage).toFixed(1)}%
                            </Text>
                          </View>
                        )}
                        {/* Thumbs Up/Down */}
                        <View style={styles.thumbsContainer}>
                          <TouchableOpacity 
                            style={[styles.thumbButton, priceData.user_vote === 'upvote' && styles.activeUpvote]}
                            onPress={() => handleVote(priceData.id, 'upvote')}
                          >
                            <Ionicons 
                              name="thumbs-up" 
                              size={12} 
                              color={priceData.user_vote === 'upvote' ? '#00FF00' : '#808080'} 
                            />
                            <Text style={styles.thumbCount}>🟢{priceData.upvotes}</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.thumbButton, priceData.user_vote === 'downvote' && styles.activeDownvote]}
                            onPress={() => handleVote(priceData.id, 'downvote')}
                          >
                            <Ionicons 
                              name="thumbs-down" 
                              size={12} 
                              color={priceData.user_vote === 'downvote' ? '#FF0000' : '#808080'} 
                            />
                            <Text style={styles.thumbCount}>🔴{priceData.downvotes}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Store and Date Row */}
                      <View style={styles.priceBottomRow}>
                        <Text style={styles.storeInfo}>{priceData.store_name} • {priceData.store_location}</Text>
                        <Text style={styles.priceDate}>{formatDate(priceData.created_at)}</Text>
                      </View>
                    </View>
                  );
                  })}
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.viewPricesButton, styles.buttonHalf]}
                  onPress={() => viewProductPrices(product)}
                >
                  <Text style={styles.viewPricesText}>{t('prices.prices')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.updatePriceButton, styles.buttonHalf]}
                  onPress={() => quickUpdatePrice(product)}
                >
                  <Text style={styles.updatePriceText}>{t('prices.updatePrice')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[styles.paginationButton, !hasPrevPage && styles.disabledButton]}
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity 
              style={[styles.paginationButton, !hasNextPage && styles.disabledButton]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Prices Section */}
      <View style={styles.recentPricesSection}>
        <Text style={styles.sectionTitle}>{t('prices.priceHistory')}</Text>
        
        {loadingRecentPrices ? (
          <ActivityIndicator size="small" color="#5A31F4" />
        ) : recentPrices.length === 0 ? (
          <Text style={styles.noPricesText}>{t('prices.noPrices')}</Text>
        ) : (
          recentPrices.map((price) => {
            const approvalRate = price.upvotes + price.downvotes > 0 
              ? Math.round((price.upvotes / (price.upvotes + price.downvotes)) * 100)
              : 0;
            const isVerified = price.verification_status === 'verified' || approvalRate >= 75;
            
            return (
              <View key={price.id} style={styles.compactRecentPriceCard}>
                <View style={styles.compactPriceRow}>
                  {/* Product Image */}
                  <Image 
                    source={{ uri: price.product_image_url }} 
                    style={styles.compactProductImage}
                  />
                  
                  {/* Product Info */}
                  <View style={styles.compactProductInfo}>
                    <Text style={styles.compactProductName} numberOfLines={1}>
                      {price.product_name}
                    </Text>
                    <Text style={styles.compactStoreInfo}>
                      {price.store_name} • {price.store_location}
                    </Text>
                  </View>
                  
                  {/* Price and Actions */}
                  <View style={styles.compactPriceActions}>
                    <View style={styles.compactPriceRow}>
                      <Text style={styles.compactPriceAmount}>{countryData.symbol}{price.price.toFixed(2)}</Text>
                      {/* Verified Badge inline with price */}
                      {isVerified && (
                        <View style={styles.compactVerifiedBadge}>
                          <Text style={styles.compactVerifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.compactActionsRow}>
                      <Text style={styles.compactDate}>{formatDate(price.created_at)}</Text>
                      
                      {/* Compact Vote Buttons */}
                      <View style={styles.compactVoteContainer}>
                        <TouchableOpacity 
                          style={styles.compactVoteButton}
                          onPress={() => handleVote(price.id, 'upvote')}
                        >
                          <Ionicons 
                            name="thumbs-up" 
                            size={12} 
                            color={price.user_vote === 'upvote' ? '#00FF00' : '#808080'} 
                          />
                          <Text style={styles.compactVoteCount}>
                            🟢{price.upvotes}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.compactVoteButton}
                          onPress={() => handleVote(price.id, 'downvote')}
                        >
                          <Ionicons 
                            name="thumbs-down" 
                            size={12} 
                            color={price.user_vote === 'downvote' ? '#FF0000' : '#808080'} 
                          />
                          <Text style={styles.compactVoteCount}>
                            🔴{price.downvotes}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Price Update Modal */}
      <Modal
        visible={showPriceUpdate}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('prices.updatePrice')}</Text>
              <TouchableOpacity onPress={resetPriceForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Product Selection */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>1. Select Product</Text>
              <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, { width: '50%' }]}
                onPress={handleBarcodeScanner}
              >
                <Ionicons name="barcode-outline" size={20} color="#5A31F4" />
                <Text style={styles.actionButtonText}>Scan Barcode</Text>
              </TouchableOpacity>
              </View>
              {selectedProduct && (
                <View style={styles.selectedProductCard}>
                  <Text style={styles.selectedProductText}>
                    Selected: {selectedProduct.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Step 2: Price Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>2. Enter Price</Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handlePricePhoto}
                >
                  <Ionicons name="camera" size={20} color="#5A31F4" />
                  <Text style={styles.actionButtonText}>Photo Price</Text>
                </TouchableOpacity>
                
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>{countryData.symbol}</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Step 3: Store Information - Compact */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>3. Store Information</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder={t('prices.store')}
                value={storeName}
                onChangeText={setStoreName}
              />
              
              <TextInput
                style={styles.textInput}
                placeholder={t('profile.country')}
                value={storeLocation}
                onChangeText={setStoreLocation}
              />
              
              {/* Compact Store Suggestions */}
              {(popularStores.length > 0 || nearbyStores.length > 0) && (
                <View style={styles.compactStoresContainer}>
                  <Text style={styles.compactStoresTitle}>Quick select:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {nearbyStores.slice(0, 3).map((store, index) => (
                      <TouchableOpacity
                        key={`nearby-${index}`}
                        style={[styles.compactStoreChip, styles.nearbyStoreChip]}
                        onPress={() => {
                          setStoreName(store.name);
                          setStoreLocation(store.address);
                        }}
                      >
                        <Text style={styles.compactStoreText}>
                          {store.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {popularStores.slice(0, 3).map((store, index) => (
                      <TouchableOpacity
                        key={`popular-${index}`}
                        style={styles.compactStoreChip}
                        onPress={() => {
                          setStoreName(store.store_name);
                          setStoreLocation(store.store_location);
                        }}
                      >
                        <Text style={styles.compactStoreText}>
                          {store.store_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!selectedProduct || !newPrice || !storeName || !storeLocation) && styles.disabledButton
              ]}
              onPress={submitPrice}
              disabled={!selectedProduct || !newPrice || !storeName || !storeLocation || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Price Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      {BarCodeScanner && (
        <Modal
          visible={showScanner}
          animationType="slide"
        >
          <View style={styles.scannerContainer}>
            {hasPermission === false ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>No camera permission</Text>
                <TouchableOpacity 
                  style={styles.scannerCloseButton}
                  onPress={() => setShowScanner(false)}
                >
                  <Text style={styles.scannerCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Camera
                  style={StyleSheet.absoluteFillObject}
                  onBarCodeScanned={handleBarCodeScanned}
                  barCodeScannerSettings={{
                    barCodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'qr']
                  }}
                />
                <View style={styles.scannerOverlay}>
                  <Text style={styles.scannerText}>Scan product barcode</Text>
                  <View style={styles.scannerFrame} />
                  
                  <TouchableOpacity 
                    style={styles.scannerCloseButton}
                    onPress={() => setShowScanner(false)}
                  >
                    <Text style={styles.scannerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Modal>
      )}

      {/* Product Search Modal */}
      <Modal
        visible={showProductSearch}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Products</Text>
              <TouchableOpacity onPress={() => setShowProductSearch(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchModalInput}
              placeholder={t('products.searchProducts')}
              value={productSearchText}
              onChangeText={setProductSearchText}
              autoFocus
            />

            {/* Search Results */}
            <ScrollView style={styles.searchResultsContainer}>
              {filteredSearchProducts.length === 0 ? (
                <Text style={styles.noResultsText}>
                  {productSearchText.trim() === '' ? 'Enter text to search products' : 'No products found'}
                </Text>
              ) : (
                filteredSearchProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.searchResultItem}
                    onPress={() => selectProductFromSearch(product)}
                  >
                    <Image 
                      source={{ uri: product.image_url }} 
                      style={styles.searchResultImage} 
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{product.name}</Text>
                      <Text style={styles.searchResultCategory}>{product.category}</Text>
                      {product.barcode && (
                        <Text style={styles.searchResultBarcode}>Barcode: {product.barcode}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Prices Modal */}
      <Modal
        visible={showProductPrices}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduct?.name} - Community Prices
              </Text>
              <TouchableOpacity onPress={() => setShowProductPrices(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pricesScrollView}>
              {communityPrices.length === 0 ? (
                <Text style={styles.noPricesText}>No prices submitted yet</Text>
              ) : (
                communityPrices.map((price) => {
                  const trend = getPriceTrend(price);
                  return (
                    <View key={price.id} style={styles.priceCard}>
                      <View style={styles.priceHeader}>
                        <Text style={styles.priceAmount}>£{price.price.toFixed(2)}</Text>
                        {trend.isVerified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}
                        {trend.isDisputed && (
                          <View style={styles.disputedBadge}>
                            <Text style={styles.disputedText}>Disputed</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.storeInfo}>{price.store_name}</Text>
                      <Text style={styles.locationInfo}>
                        {price.store_location} • {new Date(price.created_at).toLocaleDateString()}
                      </Text>
                      
                      <View style={styles.voteContainer}>
                        <TouchableOpacity 
                          style={[
                            styles.voteButton,
                            price.user_vote === 'upvote' && styles.activeUpvote
                          ]}
                          onPress={() => handleVote(price.id, 'upvote')}
                        >
                          <Ionicons 
                            name="thumbs-up" 
                            size={16} 
                            color={price.user_vote === 'upvote' ? '#4CAF50' : '#666'} 
                          />
                          <Text style={styles.voteCount}>{price.upvotes}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.voteButton,
                            price.user_vote === 'downvote' && styles.activeDownvote
                          ]}
                          onPress={() => handleVote(price.id, 'downvote')}
                        >
                          <Ionicons 
                            name="thumbs-down" 
                            size={16} 
                            color={price.user_vote === 'downvote' ? '#F44336' : '#666'} 
                          />
                          <Text style={styles.voteCount}>{price.downvotes}</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.approvalRate}>
                          {trend.approvalRate}% approval
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5A31F4" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F9F9F9' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    textAlign: 'center', 
    color: '#5A31F4',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  countryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  countryFlag: {
    fontSize: 14,
    marginRight: 6,
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A31F4',
  },
  updatePriceButton: {
    backgroundColor: '#5A31F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  updatePriceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 8, 
    marginTop: 12,
    marginHorizontal: 16,
  },
  categoriesContainer: {
    paddingBottom: 12,
    paddingTop: 5,
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
  },
  categoryItem: { 
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 12,
    minWidth: 70,
  },
  selectedCategory: {
    backgroundColor: 'rgba(90, 49, 244, 0.1)',
    borderWidth: 1,
    borderColor: '#5A31F4'
  },
  categoryIcon: { 
    fontSize: 24,
    marginBottom: 4 
  },
  categoryText: { 
    fontSize: 12, 
    textAlign: 'center' 
  },
  productsSection: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  productCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 8 
  },
  productInfo: {
    flex: 1,
  },
  productName: { 
    fontWeight: 'bold', 
    fontSize: 16,
    marginBottom: 4,
  },
  productCategory: { 
    fontSize: 12, 
    color: '#888', 
    marginBottom: 8,
  },
  viewPricesButton: {
    backgroundColor: '#E8E0FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewPricesText: {
    color: '#5A31F4',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  updatePriceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  paginationButton: {
    backgroundColor: '#5A31F4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  compactStoresContainer: {
    marginTop: 8,
  },
  compactStoresTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  compactStoreChip: {
    backgroundColor: '#E8E0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#5A31F4',
  },
  compactStoreText: {
    color: '#5A31F4',
    fontSize: 10,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSection: {
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  selectedProductCard: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedProductText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#5A31F4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  scannerCloseButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  scannerCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pricesScrollView: {
    maxHeight: 400,
  },
  noPricesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  priceCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  verifiedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  disputedBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  disputedText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  storeInfo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  activeUpvote: {
    backgroundColor: '#E8F5E9',
  },
  activeDownvote: {
    backgroundColor: '#FFEBEE',
  },
  voteCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  approvalRate: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  searchModalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  searchResultsContainer: {
    maxHeight: 400,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultBarcode: {
    fontSize: 12,
    color: '#999',
  },
  // Recent Prices Section Styles
  recentPricesSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentPriceCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5A31F4',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recentPriceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recentStoreInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recentLocationInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  recentVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  recentVoteCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Product Header Styles
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  productHeaderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  productHeaderInfo: {
    flex: 1,
  },
  // Product Prices Section Styles
  productPricesSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  priceCard: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    marginVertical: 2,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#5A31F4',
  },
  priceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  thumbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeUpvote: {
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
  },
  activeDownvote: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  thumbCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priceDate: {
    fontSize: 10,
    color: '#999',
  },
  // Recent Prices with Product Info
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  recentProductImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  recentProductInfo: {
    flex: 1,
  },
  recentProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 18,
  },
  // Compact Recent Prices Styles
  compactRecentPriceCard: {
    backgroundColor: '#FAFAFA',
    marginVertical: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#5A31F4',
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  compactProductImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    resizeMode: 'cover',
    marginRight: 10,
  },
  compactProductInfo: {
    flex: 1,
    marginRight: 8,
  },
  compactProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  compactStoreInfo: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  compactPriceActions: {
    alignItems: 'flex-end',
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  compactPriceAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  compactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDate: {
    fontSize: 9,
    color: '#999',
    fontWeight: '500',
  },
  compactVoteContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  compactVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  compactVoteCount: {
    fontSize: 9,
    fontWeight: '600',
  },
  compactVerifiedBadge: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactVerifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Color styles for price changes and votes
  priceIncrease: {
    color: 'red',
  },
  priceDecrease: {
    color: 'green',
  },
  priceNeutral: {
    color: 'gray',
  },
  thumbUpCount: {
    color: 'green',
  },
  thumbDownCount: {
    color: 'red',
  },
  // Popular stores styles
  popularStoresContainer: {
    marginBottom: 8,
  },
  popularStoresTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  popularStoreChip: {
    backgroundColor: '#E8E0FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#5A31F4',
  },
  popularStoreText: {
    color: '#5A31F4',
    fontSize: 10,
    fontWeight: '600',
  },
  popularStoreCount: {
    color: '#8B7AB8',
    fontSize: 8,
    marginTop: 1,
  },
  nearbyStoreChip: {
    backgroundColor: '#E8F5FF',
    borderColor: '#2196F3',
  },
  nearbyStoreDistance: {
    color: '#1976D2',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});

// Export as default
export default HomeScreen;