import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SelectPaymentMethodScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'vnpay'>('cash');

  const {
    returnTo,
    full_name,
    phone_number,
    street,
    ward,
    district,
    province,
    items,
  } = useLocalSearchParams<{
    returnTo?: string;
    full_name?: string;
    phone_number?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
    items?: string;
  }>();

  const handleConfirm = () => {
    router.push({
      pathname: (returnTo || '/(auth)/PaymentScreen') as any,
      params: {
        paymentMethod: selectedMethod,
        full_name,
        phone_number,
        street,
        ward,
        district,
        province,
        items,
      },
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Phương thức thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: '5%' }}>
        {/* Chọn phương thức */}
        <Text style={styles.subtitle}>Chọn phương thức thanh toán</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => setSelectedMethod('cash')}
        >
          <Ionicons
            name={selectedMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#f33"
          />
          <Ionicons name="wallet" size={20} color="#555" style={styles.icon} />
          <Text style={styles.optionText}>Tiền mặt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => setSelectedMethod('vnpay')}
        >
          <Ionicons
            name={selectedMethod === 'vnpay' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#f33"
          />
          <Image
            source={{
              uri: 'https://play-lh.googleusercontent.com/B1Zi8JrNjFjZKOQ2b5O8M-Or2uY3pSWZa-6-XnDMJ8YTFesdJRsIFhd1KxpqV0f2kg=w480-h960-rw',
            }}
            style={{ width: 24, height: 24, marginRight: 12, marginLeft: 12 }}
            resizeMode="contain"
          />
          <Text style={styles.optionText}>VNPay</Text>
        </TouchableOpacity>
      </View>
      {/* Nút xác nhận */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Đồng ý</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', },
  header: {
    backgroundColor: '#ff4d4f',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  icon: { marginHorizontal: 12 },
  optionText: { fontSize: 16 },
  confirmButton: {
    position: 'absolute',
    bottom: '7%',
    left: 16,
    right: 16,
    backgroundColor: '#d62828',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
