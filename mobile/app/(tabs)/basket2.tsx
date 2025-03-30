import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { useBasket } from '../../context/BasketContext';
import { FontAwesome } from '@expo/vector-icons';

const BAR_MAX_WIDTH = Dimensions.get('window').width - 120;

const BasketScreen = () => {
  const { basket, removeFromBasket, updateQuantity, clearBasket } = useBasket();

  const getBarWidth = (value: number, max: number) => {
    const percent = value / max;
    return percent * BAR_MAX_WIDTH;
  };

  const getPriceLevel = (value: number, all: number[]) => {
    const min = Math.min(...all);
    const max = Math.max(...all);
    if (value === min) return 'low';
    if (value === max) return 'high';
    return 'mid';
  };

  const PriceWithColor = ({
    price,
    level,
    label,
  }: {
    price: number;
    level: 'low' | 'mid' | 'high';
    label: 'Tesco' | 'Aldi' | 'Lidl';
  }) => {
    const colorMap = {
      low: '#4CAF50',   // More vibrant green
      mid: '#FFC107',   // Amber for mid-range
      high: '#F44336',  // Vivid red
    };

    const logoMap = {
      Tesco: require('../../assets/logos/tesco.png'),
      Aldi: require('../../assets/logos/aldi.png'),
      Lidl: require('../../assets/logos/lidl.png'),
    };

    return (
      <View style={styles.priceContainer}>
        <View style={[styles.circle, { backgroundColor: colorMap[level] }]} />
        <Image source={logoMap[label]} style={styles.logo} />
        <Text style={styles.priceText}>€{price.toFixed(2)}</Text>
      </View>
    );
  };

  const basketTotals = basket.reduce(
    (acc, item) => {
      acc.tesco += item.tesco * item.quantity;
      acc.aldi += item.aldi * item.quantity;
      acc.lidl += item.lidl * item.quantity;
      return acc;
    },
    { tesco: 0, aldi: 0, lidl: 0 }
  );

  const maxTotal = Math.max(basketTotals.tesco, basketTotals.aldi, basketTotals.lidl);

  const confirmClearBasket = () => {
    Alert.alert(
      'Clear Basket',
      'Are you sure you want to remove all products?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, clear', style: 'destructive', onPress: () => clearBasket() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Your Basket</Text>
      
      <FlatList
        data={basket}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBasket}>
            <Text style={styles.emptyBasketText}>Your basket is empty</Text>
            <Text style={styles.emptyBasketSubtext}>Start adding some products!</Text>
          </View>
        }
        ListFooterComponent={
          basket.length > 0 ? (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Total by Supermarket</Text>

              <View style={styles.totalRow}>
                <PriceWithColor price={basketTotals.tesco} level="low" label="Tesco" />
                <PriceWithColor price={basketTotals.aldi} level="mid" label="Aldi" />
                <PriceWithColor price={basketTotals.lidl} level="high" label="Lidl" />
              </View>

              {['Tesco', 'Aldi', 'Lidl'].map((store, index) => {
                const totalKey = store.toLowerCase() as keyof typeof basketTotals;
                const color = index === 0 ? '#4CAF50' : index === 1 ? '#FFC107' : '#F44336';
                
                return (
                  <View key={store} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{store}</Text>
                    <View style={styles.chartLine}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            width: getBarWidth(basketTotals[totalKey], maxTotal), 
                            backgroundColor: color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.chartValue}>€{basketTotals[totalKey].toFixed(2)}</Text>
                  </View>
                );
              })}

              <TouchableOpacity 
                onPress={confirmClearBasket} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Basket</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const prices = [item.tesco, item.aldi, item.lidl];
          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => removeFromBasket(item.id)}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="trash" size={20} color="#F44336" />
              </TouchableOpacity>

              <Text style={styles.productName}>{item.name}</Text>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, -1)}
                  style={styles.qtyButton}
                >
                  <Text style={styles.qtyText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityLabel}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, 1)}
                  style={styles.qtyButton}
                >
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceRow}>
                <PriceWithColor
                  label="Tesco"
                  price={item.tesco}
                  level={getPriceLevel(item.tesco, prices)}
                />
                <PriceWithColor
                  label="Aldi"
                  price={item.aldi}
                  level={getPriceLevel(item.aldi, prices)}
                />
                <PriceWithColor
                  label="Lidl"
                  price={item.lidl}
                  level={getPriceLevel(item.lidl, prices)}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#F5F5F5' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 16, 
    color: '#333',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  emptyBasket: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    opacity: 0.6
  },
  emptyBasketText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#888'
  },
  emptyBasketSubtext: {
    fontSize: 16,
    color: '#AAA',
    marginTop: 8
  },
  productName: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#333' 
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'center',
    gap: 20,
  },
  qtyButton: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  totalsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 15,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  totalsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 16,
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 20,
    height: 20,
    marginHorizontal: 6,
    resizeMode: 'contain',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  chartLabel: {
    width: 60,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chartLine: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  chartValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default BasketScreen;