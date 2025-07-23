import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import Carousel from 'react-native-reanimated-carousel';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../src/config';

export type Product = {
  _id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/products?featured=true`);
        setFeaturedProducts(res.data);
      } catch (error) {
        console.error("Lỗi khi fetch sản phẩm nổi bật:", error);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const categories = [
    {
      id: 1,
      title: 'Danh mục',
      image: require('../../assets/images/tshirt.png'),
    },
    {
      id: 2,
      title: 'Yêu thích',
      image: require('../../assets/images/icon_heat.png'),
    },
    {
      id: 3,
      title: 'Mới nhất',
      image: require('../../assets/images/icon_new.png'),
    },
    {
      id: 4,
      title: 'Ưu đãi',
      image: require('../../assets/images/icon_sale.png'),
    },
  ];

  const banners = [
    { id: '1', image: require('../../assets/images/banner1.jpg') },
    { id: '2', image: require('../../assets/images/banner2.jpg') },
    { id: '3', image: require('../../assets/images/banner3.jpg') },
  ];

  const handleCategoryPress = (id: number) => {
    switch (id) {
      case 1:
        router.push('/(auth)/CategoryList');
        break;
      case 2:
        router.push('/(auth)/FavoriteProducts');
        break;
      case 3:
        router.push('/(auth)/NewestProducts');
        break;
      case 4:
        router.push('/(auth)/DiscountProducts');
        break;
      default:
        break;
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() =>
        router.push({ pathname: '/(auth)/ProductDetail', params: { id: item._id } })
      }
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price.toLocaleString()}đ</Text>
      <Text style={styles.oldPrice}>
        {(item.oldPrice || item.price * 1.2).toLocaleString()}đ
      </Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color="#fff" />
        <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.featuredWrapper}>
      <TopBar />

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>
          Xin chào <Text style={{ fontWeight: 'bold' }}>!</Text>
        </Text>
        <Text style={styles.subGreeting}>
          Welcome to ManzonePoly – Where Men’s Fashion Begins
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput placeholder="Tìm kiếm sản phẩm" style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <View style={styles.catefory2}>


          <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.id)}
            >
              <View style={styles.categoryCircle}>
                <Image source={item.image} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryLabel}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
        </View>
        <View style={{ paddingHorizontal: 10, marginTop: 0, marginBottom: 10 }}>
          <Carousel
            width={screenWidth - 20}
            height={150}
            data={banners}
            autoPlay
            scrollAnimationDuration={1000}
            autoPlayInterval={3000}
            renderItem={({ item }) => (
              <View style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
                <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            )}
          />
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Sản phẩm nổi bật</Text>

          <FlatList
            data={featuredProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            style={{
              height: 400,
              backgroundColor: '#ffd6d2',
              padding: 10,
              marginBottom:40,
              paddingBottom: 10,

              

            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f66',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  greeting: {
    fontSize: 20,
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  imageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  categoryContainer: {
    backgroundColor: '#FFD6D2',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 1,

  },
  catefory2: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 0,

    padding: 20,

  },


  imageWrapper: {
    width: 40,
    height: 40,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },





  productItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },

  productImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  productName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    color: '#000',
  },

  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f66',
  },

  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },

  ratingContainer: {
    flexDirection: 'row',
    backgroundColor: '#2856f9',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  ratingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  featuredWrapper: {
    backgroundColor: '#f66',
    flex: 1,
    marginTop: 0, // Để chồng lên phần trước nếu muốn liền mạch
  },

  featuredSection: {

    backgroundColor: '#FFD6D2',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,



  },

  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'center',
    backgroundColor: '#3366FF',
    paddingVertical: 6,
    paddingHorizontal: 137,
    borderRadius: 15,
    marginBottom: 0,


  },


  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 22,
  },
  categoryCircle: {
    backgroundColor: '#ffffffff',
    borderRadius: 999,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    maxWidth: 80,
    fontWeight: 'bold',

  },


});
