import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { useBasket } from '../../context/BasketContext';
import { FontAwesome } from '@expo/vector-icons';

const BAR_MAX_WIDTH = Dimensions.get('window').width - 120;

const BasketScreen = () => {
  const { basket, removeFromBasket, updateQuantity, clearBasket, refreshPrices } = useBasket();

  const getBarWidth = (value: number, max: number) => (value / max) * BAR_MAX_WIDTH;

  const getPriceLevel = (value: number, all: number[]) => {
    const min = Math.min(...all);
    const max = Math.max(...all);
    if (value === min) return 'low';
    if (value === max) return 'high';
    return 'mid';
  };

  const PriceWithColor = ({ price, level, label }: {
    price: number;
    level: 'low' | 'mid' | 'high';
    label: 'Tesco' | 'Aldi' | 'Lidl';
  }) => {
    const colorMap = { low: '#2ecc71', mid: '#f1c40f', high: '#e74c3c' };
    const logoMap = {
      Tesco: require('../../assets/logos/tesco.png'),
      Aldi: require('../../assets/logos/aldi.png'),
      Lidl: require('../../assets/logos/lidl.png'),
    };

    return (
      <View style={[styles.priceContainer, { flex: 1 }]}>
        <View style={[styles.circle, { backgroundColor: colorMap[level] }]} />
        <Image source={logoMap[label]} style={styles.logo} />
        <Text style={styles.priceText}>€{price.toFixed(2)}</Text>
      </View>
    );
  };

  const basketTotals = basket.reduce(
    (acc, item) => {
      item.prices.forEach((p) => {
        const total = p.price * item.quantity;
        if (p.supermarket === 'Tesco') acc.tesco += total;
        if (p.supermarket === 'Aldi') acc.aldi += total;
        if (p.supermarket === 'Lidl') acc.lidl += total;
      });
      return acc;
    },
    { tesco: 0, aldi: 0, lidl: 0 }
  );

  const maxTotal = Math.max(basketTotals.tesco, basketTotals.aldi, basketTotals.lidl);

  const confirmClearBasket = () => {
    Alert.alert('Vaciar Canasta', '¿Eliminar todos los productos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, vaciar', style: 'destructive', onPress: () => clearBasket() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Your Basket</Text>

      <TouchableOpacity onPress={refreshPrices} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Prices</Text>
      </TouchableOpacity>

      <FlatList
        data={basket}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text>No products added yet.</Text>}
        ListFooterComponent={() =>
          basket.length > 0 ? (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Total by Supermarket</Text>

              {(() => {
                  const totalsArray = [
                    { name: 'Tesco', value: basketTotals.tesco },
                    { name: 'Aldi', value: basketTotals.aldi },
                    { name: 'Lidl', value: basketTotals.lidl },
                  ];

                  const sorted = [...totalsArray].sort((a, b) => a.value - b.value);

                  const colorMap: Record<string, string> = {
                    [sorted[0].name]: '#2ecc71', // verde
                    [sorted[1].name]: '#f1c40f', // amarillo
                    [sorted[2].name]: '#e74c3c', // rojo
                  };

                  return totalsArray.map(({ name, value }) => (
                    <View key={name} style={styles.chartRow}>
                      <Text style={styles.chartLabel}>{name}</Text>
                      <View style={styles.chartLine}>
                        <View
                          style={[
                            styles.bar,
                            {
                              width: getBarWidth(value, maxTotal),
                              backgroundColor: colorMap[name],
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartValue}>€{value.toFixed(2)}</Text>
                    </View>
                  ));
                })()}


              <TouchableOpacity onPress={confirmClearBasket} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Delete Basket</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const prices = item.prices.map(p => p.price);
          return (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => removeFromBasket(item.id)} style={styles.removeButton}>
                <FontAwesome name="trash" size={20} color="red" />
              </TouchableOpacity>

              <Text style={styles.productName}>{item.name}</Text>

              <View style={styles.quantityControls}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyButton}>
                  <Text style={styles.qtyText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityLabel}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyButton}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceRow}>
                {['Tesco', 'Aldi', 'Lidl'].map((label) => {
                  const entry = item.prices.find(p => p.supermarket === label);
                  if (!entry) return null;
                  return (
                    <PriceWithColor
                      key={label}
                      label={label as 'Tesco' | 'Aldi' | 'Lidl'}
                      price={entry.price}
                      level={getPriceLevel(entry.price, prices)}
                    />
                  );
                })}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  refreshButton: {
    backgroundColor: '#5A31F4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  productName: { fontSize: 16, fontWeight: 'bold' },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 10,
  },
  qtyButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyText: { fontSize: 20, fontWeight: 'bold' },
  quantityLabel: { fontSize: 16, minWidth: 24, textAlign: 'center' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 110,
  },
  circle: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  priceText: { fontSize: 16 },
  logo: {
    width: 16,
    height: 16,
    marginHorizontal: 4,
    resizeMode: 'contain',
  },
  totalsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  totalsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  clearButton: {
    marginTop: 12,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  chartLabel: { width: 50, fontSize: 14, color: '#333' },
  chartLine: {
    flex: 1,
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  bar: { height: '100%', borderRadius: 5 },
  chartValue: { width: 80, textAlign: 'right', fontSize: 14, color: '#333' },
});

export default BasketScreen;
