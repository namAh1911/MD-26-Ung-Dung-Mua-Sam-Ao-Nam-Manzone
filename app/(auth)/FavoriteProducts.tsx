import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, Dimensions, FlatList, Image, RefreshControl,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../src/AuthContext';
import { BASE_URL } from '../src/config';

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
};

export default function FavoriteProducts() {
  const { token } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/wishlists/me`, { headers });
      const list: Product[] = (res.data?.products || []);
      setItems(list);
    } catch (e) {
      Alert.alert('Lỗi', 'Không tải được danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const removeItem = async (id: string) => {
    if (!token) return;
    const prev = items;
    setItems(prev.filter(p => p._id !== id)); // optimistic
    try {
      await axios.delete(`${BASE_URL}/api/wishlists/${id}`, { headers });
    } catch {
      setItems(prev); // revert
      Alert.alert('Lỗi', 'Không thể xoá khỏi yêu thích');
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/(auth)/ProductDetail', params: { id: item._id } })}
    >
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <TouchableOpacity onPress={() => removeItem(item._id)} style={styles.heartBtn}>
          <Ionicons name="heart" size={18} color="#e61c58" />
        </TouchableOpacity>
      </View>
      <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price.toLocaleString()} ₫</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER hồng có nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconLeft}>
          <Ionicons name="arrow-back" color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sản Phẩm Yêu Thích</Text>

        {/* Spacer để căn giữa title */}
        <View style={{ width: 40 }} />
      </View>

      {/* NỘI DUNG */}
      {!token ? (
        <View style={styles.center}>
          <Text style={{ color: '#444' }}>Bạn cần đăng nhập để xem yêu thích.</Text>
        </View>
      ) : (!loading && items.length === 0) ? (
        <View style={styles.center}>
          <Text style={{ color: '#444' }}>Chưa có sản phẩm yêu thích.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const itemWidth = (Dimensions.get('window').width - 40) / 2;

const styles = StyleSheet.create({
  // NỀN hồng
  container: {
    flex: 1,
    backgroundColor: '#ffd6d2',
  },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: '6%',
    backgroundColor: '#f66060ff',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  headerIconLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // LIST
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: itemWidth,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  heartBtn: {
    position: 'absolute', right: 8, top: 8,
    padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999,
  },
  name: { fontSize: 13, color: '#333', marginHorizontal: 8, marginTop: 8 },
  price: { fontWeight: 'bold', fontSize: 14, marginHorizontal: 8, marginVertical: 8, color: '#000' },
});
