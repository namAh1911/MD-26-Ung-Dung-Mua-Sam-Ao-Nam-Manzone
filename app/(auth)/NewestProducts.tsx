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
  createdAt: string;
  category?: string;
  brand?: string;
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

const TITLE = 'Sản phẩm mới nhất';

export default function NewestProducts() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / 2;

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await axios.get(`${BASE_URL}/api/products/newest`, {
        params: { limit: 5 },
      });
      
      let items: Product[] = Array.isArray(res.data) ? res.data : [];
      items = [...items].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setList(items);
    } catch (e) {
      console.error('Fetch newest products error:', e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      fetchProducts();
    }
    return () => { cancelled = true; };
  }, []);

  const onRefresh = () => {
    fetchProducts(true);
  };

  const onPressItem = (id: string) => {
    router.push({ pathname: '/(auth)/ProductDetail', params: { id } });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hôm nay';
    if (diffDays === 2) return 'Hôm qua';
    if (diffDays <= 7) return `${diffDays - 1} ngày trước`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productItem, { width: itemWidth }]}
      onPress={() => onPressItem(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>MỚI</Text>
        </View>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <View style={styles.ratingContainer}>
          <Stars value={item.ratingAvg || 0} size={12} />
          <Text style={styles.ratingText}>
            {item.ratingAvg ? item.ratingAvg.toFixed(1) : '0.0'} 
            {item.ratingCount ? ` (${item.ratingCount})` : ''}
          </Text>
        </View>
        
        <Text style={styles.productPrice}>
          {formatPrice(item.price)}
        </Text>
        
        <View style={styles.metaInfo}>
          <Text style={styles.dateText}>
            📅 {formatDate(item.createdAt)}
          </Text>
          {item.category && (
            <Text style={styles.categoryText}>
              🏷️ {item.category}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconLeft}>
          <Ionicons name="arrow-back" color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TITLE}</Text>
        <View style={styles.headerIconsRight} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải sản phẩm mới nhất...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có sản phẩm mới</Text>
              <Text style={styles.emptySubtext}>
                Hãy quay lại sau để xem các sản phẩm mới nhất
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ff4d4f',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerIconLeft: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerIconsRight: {
    width: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  metaInfo: {
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#888',
  },
  categoryText: {
    fontSize: 11,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
