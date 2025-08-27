import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../src/AuthContext";
import { BASE_URL } from "../src/config";

export type Product = {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  isFavorite?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
};

const subCategories = [
  { id: 1, title: "Áo thun", image: require("../../assets/images/t-shirt.png") },
  { id: 2, title: "Áo sơ mi", image: require("../../assets/images/shirt.png") },

  {
    id: 3,
    title: "Áo hoodie",
    image: require("../../assets/images/hoodie.png"),
  },
  { id: 4, title: "Áo dạ", image: require("../../assets/images/sweater.png") },
  {
    id: 5,
    title: "Áo khoác",
    image: require("../../assets/images/jacket.png"),
  },
  {
    id: 6,
    title: "Áo vest",
    image: require("../../assets/images/icons8-vest-48.png"),
  },
];

const filters = [
  { key: "sold_desc", label: "Bán nhiều nhất" },
  { key: "price_desc", label: "Giá cao" },
  { key: "price_asc", label: "Giá thấp" },

];

const Stars = ({ value = 0, size = 12 }: { value?: number; size?: number }) => {
  const rounded = Math.round(value);
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={rounded >= i + 1 ? "star" : "star-outline"}
          size={size}
          color={"#f5a623"}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

export default function CategoryList() {
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 40) / 2;
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false); // toggle search
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { token } = useAuth();

  const onPressFilter = (f: { key: string; label: string }) => {
    if (f.key === "sold_desc") {
      router.push("/BestSelling");
    } else if (f.key === "price_desc") {
      router.push("/PriceHigh");
    } else if (f.key === "price_asc") {
      router.push("/PriceLow");
    }
  };

  const handlePress = (id: string) => {
    router.push({ pathname: "/(auth)/ProductDetail", params: { id } });
  };
  const fetchFeaturedProducts = async () => {
    try {
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;
      const url = `${BASE_URL}/api/products?featured=true&withFavorite=true`;
      const res = await axios.get(url, { headers });

      setFeaturedProducts(
        res.data.map((p: Product) => ({ ...p, isFavorite: !!p.isFavorite }))
      );
    } catch (error) {
      console.error("Lỗi khi fetch sản phẩm nổi bật:", error);
    }
  };
  
  useEffect(() => {
    fetchFeaturedProducts();
  }, [token]);

  
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      await fetchFeaturedProducts();
      return;
    }
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await axios.get(`${BASE_URL}/api/products`, {
        params: { name: q },
        headers,
      });
      setFeaturedProducts(res.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFeaturedProducts([]);
      } else {
        console.error("Lỗi khi tìm kiếm sản phẩm:", error);
      }
    }
  };

  async function toggleFavInList(id: string, next: boolean) {
    if (!token) {
      alert("Bạn cần đăng nhập");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    // optimistic UI
    setFeaturedProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, isFavorite: next } : p))
    );

    try {
      if (next) {
        await axios.post(
          `${BASE_URL}/api/wishlists`,
          { productId: id },
          { headers }
        );
      } else {
        await axios.delete(`${BASE_URL}/api/wishlists/${id}`, { headers });
      }
    } catch (e) {
      // revert nếu lỗi
      setFeaturedProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isFavorite: !next } : p))
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconLeft}
        >
          <Ionicons name="arrow-back" color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Danh mục Sản Phẩm</Text>

        <View style={styles.headerIconsRight}>
          <Ionicons
            name="search"
            size={22}
            color="#fff"
            style={{ marginRight: 10 }}
            onPress={() => setShowSearch(!showSearch)}
          />
          <Ionicons
            name="cart-outline"
            color="#fff"
            size={22}
            onPress={() => router.push("/(tabs)/Cart")}
          />

        </View>
      </View>

      {/* Ô tìm kiếm */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#aaa"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Tìm kiếm sản phẩm"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      )}

      {/* Danh mục con */}
      <View>
        <FlatList
          data={subCategories}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subCategoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.subCategoryItem}
              onPress={() =>
                router.push({
                  pathname: "/(auth)/ProductByCategory",
                  params: { category: item.title },
                })
              }
            >
              <View style={styles.categoryCircle}>
                <Image source={item.image} style={styles.circleIcon} />
              </View>
              <Text style={styles.subCategoryText}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={styles.filterBtn}
            onPress={() => onPressFilter(f)}
          >
            <Text style={styles.filterText}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gợi ý sản phẩm */}
      <Text style={styles.sectionTitle}>Gợi Ý Riêng Cho Bạn</Text>
      <FlatList
        data={featuredProducts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.productCard, { width: itemWidth }]}
            onPress={() => handlePress(item._id)}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <Text style={styles.productPrice}>
              {item.price.toLocaleString()} ₫
            </Text>
            <Text numberOfLines={2} style={styles.productName}>
              {item.name}
            </Text>
            <View style={styles.ratingRow}>
              <Stars value={item.ratingAvg ?? item.rating ?? 0} size={12} />
              <Text style={styles.ratingText}>
                {(item.ratingAvg ?? item.rating ?? 0).toFixed(1)}
                {!!item.ratingCount && ` (${item.ratingCount})`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffd6d2" },
  header: {
    backgroundColor: "#ff4d4f",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerIconLeft: { width: 40, alignItems: "flex-start" },
  headerIconsRight: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    justifyContent: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    flex: 1,
    marginLeft: 20

  },
  // Search box
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#000" },
  subCategoryList: { paddingVertical: 10, paddingHorizontal: 12 },
  subCategoryItem: { alignItems: "center", marginRight: 12 },
  categoryCircle: {
    backgroundColor: "#fff",
    borderRadius: 999,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  circleIcon: { width: 35, height: 35, resizeMode: "contain" },
  subCategoryText: { fontSize: 13, color: "#000" },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  filterText: { fontSize: 13, color: "#000" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginVertical: 10,
    color: "#000",
  },
  columnWrapper: { justifyContent: "space-between", paddingHorizontal: 12 },
  productCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
    marginBottom: 16,
  },

  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },

  productPrice: {
    fontWeight: "bold",
    fontSize: 14,
    marginHorizontal: 8,
    marginTop: 8,
    color: "#000",
  },
  productName: {
    fontSize: 13,
    color: "#333",
    marginHorizontal: 8,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  ratingText: { fontSize: 12, color: "#555", marginLeft: 6 },
});
