import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { useBasket } from "../../context/BasketContext";
import { FontAwesome } from "@expo/vector-icons";

const BAR_MAX_WIDTH = Dimensions.get("window").width - 120;
const COLORS = {
  primary: "#5A31F4",
  background: "#F5F7FA",
  card: "#FFFFFF",
  text: "#333333",
  textLight: "#666666",
  buttonText: "#FFFFFF",
  tesco: "#2ecc71",
  aldi: "#f1c40f",
  lidl: "#e74c3c",
  danger: "#e74c3c",
  border: "#E0E4E8",
  controlBg: "#F0F2F5",
};

type BasketItem = {
  id: number;
  name: string;
  image_url: string;
  quantity: number;
  prices: {
    supermarket: string;
    price: number;
    updated_at: string;
  }[];
};

const BasketScreen = () => {
  const {
    basket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    refreshPrices,
  } = useBasket();

  const getBarWidth = (value: number, max: number) =>
    (value / max) * BAR_MAX_WIDTH;

  const getPriceLevel = (value: number, all: number[]) => {
    const min = Math.min(...all);
    const max = Math.max(...all);
    if (value === min) return "low";
    if (value === max) return "high";
    return "mid";
  };
  
  const getImageUrl = (imagePath: string) => {
    return `https://mastermarket-production.up.railway.app${imagePath}`;
  };

  const PriceWithColor = ({
    price,
    level,
    label,
  }: {
    price: number;
    level: "low" | "mid" | "high";
    label: "Tesco" | "Aldi" | "Lidl";
  }) => {
    const colorMap = { 
      low: COLORS.tesco, 
      mid: COLORS.aldi, 
      high: COLORS.lidl 
    };
    const logoMap = {
      Tesco: require("../../assets/logos/tesco.png"),
      Aldi: require("../../assets/logos/aldi.png"),
      Lidl: require("../../assets/logos/lidl.png"),
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
        if (p.supermarket === "Tesco") acc.tesco += total;
        if (p.supermarket === "Aldi") acc.aldi += total;
        if (p.supermarket === "Lidl") acc.lidl += total;
      });
      return acc;
    },
    { tesco: 0, aldi: 0, lidl: 0 }
  );

  const maxTotal = Math.max(
    basketTotals.tesco,
    basketTotals.aldi,
    basketTotals.lidl
  );

  const confirmClearBasket = () => {
    Alert.alert("Vaciar Canasta", "¿Eliminar todos los productos?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, vaciar",
        style: "destructive",
        onPress: () => clearBasket(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 Your Basket</Text>
        <TouchableOpacity onPress={refreshPrices} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Refresh Prices</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={basket}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="shopping-basket" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Your basket is empty</Text>
            <Text style={styles.emptySubText}>Add products to compare prices</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() =>
          basket.length > 0 ? (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Total by Supermarket</Text>

              {["Tesco", "Aldi", "Lidl"].map((label) => (
                <View key={label} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{label}</Text>
                  <View style={styles.chartLine}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: getBarWidth(
                            basketTotals[
                              label.toLowerCase() as "tesco" | "aldi" | "lidl"
                            ],
                            maxTotal
                          ),
                          backgroundColor:
                            label === "Tesco"
                              ? COLORS.tesco
                              : label === "Aldi"
                              ? COLORS.aldi
                              : COLORS.lidl,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>
                    €
                    {basketTotals[
                      label.toLowerCase() as "tesco" | "aldi" | "lidl"
                    ].toFixed(2)}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                onPress={confirmClearBasket}
                style={styles.clearButton}
              >
                <FontAwesome name="trash" size={16} color={COLORS.buttonText} style={styles.clearButtonIcon} />
                <Text style={styles.clearButtonText}>Delete Basket</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }: { item: BasketItem }) => {
          const prices = item.prices.map((p) => p.price);
          return (
            <View style={styles.card}>
              <View style={styles.productInfoContainer}>
                <Image
                  source={{ uri: getImageUrl(item.image_url) }}
                  style={styles.basketProductImage}
                />
                <View style={styles.productDetails}>
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
                </View>
                <TouchableOpacity
                  onPress={() => removeFromBasket(item.id)}
                  style={styles.removeButton}
                >
                  <FontAwesome name="times" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.priceRow}>
                {["Tesco", "Aldi", "Lidl"].map((label) => {
                  const entry = item.prices.find(
                    (p) => p.supermarket === label
                  );
                  if (!entry) return null;
                  return (
                    <PriceWithColor
                      key={label}
                      label={label as "Tesco" | "Aldi" | "Lidl"}
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
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: COLORS.text 
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  refreshButtonText: {
    color: COLORS.buttonText,
    fontWeight: "bold",
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: COLORS.text,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  removeButton: {
    backgroundColor: COLORS.controlBg,
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  qtyButton: {
    backgroundColor: COLORS.controlBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { 
    fontSize: 18, 
    fontWeight: "bold",
    color: COLORS.text,
  },
  quantityLabel: { 
    fontSize: 16, 
    minWidth: 30, 
    textAlign: "center",
    fontWeight: "500",
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    maxWidth: 110,
  },
  circle: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 6 
  },
  priceText: { 
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  logo: {
    width: 18,
    height: 18,
    marginHorizontal: 4,
    resizeMode: "contain",
  },
  totalsCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  totalsTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 16,
    color: COLORS.text,
  },
  clearButton: {
    marginTop: 20,
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  clearButtonIcon: {
    marginRight: 8,
  },
  clearButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: "bold",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  chartLabel: { 
    width: 50, 
    fontSize: 14, 
    color: COLORS.text,
    fontWeight: "500", 
  },
  chartLine: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.controlBg,
    borderRadius: 6,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  basketProductImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    resizeMode: "cover",
  },
  bar: { 
    height: "100%", 
    borderRadius: 6 
  },
  chartValue: { 
    width: 80, 
    textAlign: "right", 
    fontSize: 15, 
    color: COLORS.text,
    fontWeight: "500",
  },
});

export default BasketScreen;