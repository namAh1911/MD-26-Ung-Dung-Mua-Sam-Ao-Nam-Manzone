import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import Carousel from 'react-native-reanimated-carousel';


export default function HomeScreen() {
  const categories = [
    {
      id: 1,
      title: 'Áo thun (T-Shirts)',
      image: require('../../assets/images/tshirt.png'),
    },
    {
      id: 2,
      title: 'Áo khoác (Jackets)',
      image: require('../../assets/images/jacket.png'),
    },
    {
      id: 3,
      title: 'Áo sơ mi (Shirt)',
      image: require('../../assets/images/shirt.png'),
    },
    {
      id: 4,
      title: 'Áo hoodie',
      image: require('../../assets/images/hoodie.png'),
    },
  ];
  const banners = [
    { id: '1', image: require('../../assets/images/banner1.jpg'), },
    { id: '2', image: require('../../assets/images/banner2.jpg') },
    { id: '3', image: require('../../assets/images/banner3.jpg') },
  ];

  const screenWidth = Dimensions.get('window').width;
  const featuredProducts = [
    {
      id: '1',
      name: 'Áo Thun In Hình Đẹp',
      price: 80000,
      oldPrice: 90000,
      rating: 4.2,
      image: require('../../assets/images/product1.png'),
    },
    {
      id: '2',
      name: 'Áo Thun In Hình Đẹp',
      price: 80000,
      oldPrice: 90000,
      rating: 4.2,
      image: require('../../assets/images/product1.png'),
    },
    {
      id: '2',
      name: 'Áo Thun In Hình Đẹp',
      price: 80000,
      oldPrice: 90000,
      rating: 4.2,
      image: require('../../assets/images/product1.png'),
    },
    {
      id: '2',
      name: 'Áo Thun In Hình Đẹp',
      price: 80000,
      oldPrice: 90000,
      rating: 4.2,
      image: require('../../assets/images/product1.png'),
    },
    // thêm nhiều sản phẩm 
  ];

  const renderProduct = ({ item }) => (
    <View style={styles.productItem}>
      <Image source={item.image} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price.toLocaleString()}đ</Text>
      <Text style={styles.oldPrice}>{item.oldPrice.toLocaleString()}đ</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color="#fff" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    </View>
  );



  return (


    <View style={styles.featuredWrapper}>
      <TopBar />

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>
          Xin chào, <Text style={{ fontWeight: 'bold' }}>Nam!</Text>
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
        <View style={{ padding: 0,}}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.categoryBox}>
              <View style={styles.imageWrapper}>
                <Image source={item.image} style={styles.categoryImage2} />
              </View>
              <Text style={styles.categoryText}>{item.title}</Text>
            </View>
          )}
        />
        </View>

        <View style={{ paddingHorizontal: 10, marginTop:10, marginBottom:10 }}>
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
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            style={{ height:365, backgroundColor: '#ffd6d2',padding:10,

             }} // Bạn có thể thay đổi chiều cao phù hợp
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
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  categoryImage: {
    width: 40,
    height: 40,
  },
  categoryContainer: {
    backgroundColor: '#eee',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 0,
    marginTop: 1,

  },

  categoryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    marginLeft: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // bóng cho Android
    width: 80,
  },

  imageWrapper: {
    width: 40,
    height: 40,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryImage2: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },

  categoryText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },

  productItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
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
    height: 120,
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
    paddingTop: 1,
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
    paddingHorizontal: 100,
    borderRadius: 10,
    marginBottom:10

  },

});
