import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BASE_URL } from '../src/config';

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  sold?: number;
  ratingAvg?: number;
  ratingCount?: number;
};

const Stars = ({ value = 0, size = 12 }: { value?: number; size?: number }) => {
  const rounded = Math.round(value);
  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={rounded >= i + 1 ? 'star' : 'star-outline'}
          size={size}
          color={'#f5a623'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

const SORT_KEY = 'price_desc' as const;
const TITLE = 'Giá cao';

export default function PriceHigh() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / 2;

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/products`, {
          params: { sort: SORT_KEY, limit: 100 },
        });
        let items: Product[] = Array.isArray(res.data) ? res.data : [];
        items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); // fallback
        if (!cancelled) setList(items);
      } catch (e) {
        console.error('Fetch filtered products error:', e);
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const onPressItem = (id: string) => {
    router.push({ pathname: '/(auth)/ProductDetail', params: { id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconLeft}>
          <Ionicons name="arrow-back" color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TITLE}</Text>
        <View style={styles.headerIconsRight} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { width: itemWidth }]}
              onPress={() => onPressItem(item._id)}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.price}>{item.price?.toLocaleString()} ₫</Text>
              <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
              <View style={styles.ratingRow}>
                <Stars value={(item.ratingAvg ?? 0)} size={12} />
                <Text style={styles.ratingText}>
                  {(item.ratingAvg ?? 0).toFixed(1)}
                  {!!item.ratingCount && ` (${item.ratingCount})`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 24, color: '#000' }}>
              Không có sản phẩm
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffd6d2' },
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
  headerIconLeft: { width: 40, alignItems: 'flex-start' },
  headerIconsRight: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: { width: '100%', height: 200 },
  price: { fontWeight: 'bold', fontSize: 14, marginHorizontal: 8, marginTop: 8, color: '#000' },
  name: { fontSize: 13, color: '#333', marginHorizontal: 8, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 8, marginTop: 4 },
  ratingText: { fontSize: 12, color: '#555', marginLeft: 6 },
});
