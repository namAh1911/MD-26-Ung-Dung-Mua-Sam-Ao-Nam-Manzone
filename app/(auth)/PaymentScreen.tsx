import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../src/config';
import { useAuth } from '../src/AuthContext'; // Đường dẫn tới AuthContext của bạn

interface Address {
    _id: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
}

export default function PaymentScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const {
        full_name,
        phone_number,
        street,
        ward,
        district,
        province,
        items,
    } = useLocalSearchParams<{
        full_name: string;
        phone_number: string;
        street: string;
        ward: string;
        district: string;
        province: string;
        items: string;
    }>();

    const selectedItems = JSON.parse(items || '[]');
    const [shippingFee, setShippingFee] = useState(12500);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // chỉ có 1 tùy chọn hiện tại
    const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);


    useEffect(() => {
        const fetchDefaultAddress = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/addresses/default`, {
                    headers: { Authorization: `Bearer ${token}` }, // nếu cần
                });
                setDefaultAddress(res.data);
            } catch (err) {
                console.error('Không lấy được địa chỉ mặc định', err);
            }
        };
        if (token) {
            fetchDefaultAddress();
        }
    }, [token]);

    const productTotal = selectedItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
    );
    const total = productTotal + shippingFee;

    const getDeliveryDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 3);

        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();



        return `${day}-${month}-${year}`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/Cart')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Địa chỉ giao hàng */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>

                    {defaultAddress ? (
                        <>
                            <Text style={styles.text}>
                                {defaultAddress.full_name} - {defaultAddress.phone_number}
                            </Text>
                            <Text style={styles.text}>
                                {defaultAddress.street}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.province}, VN
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.text}>
                                {full_name} - {phone_number}
                            </Text>
                            <Text style={styles.text}>
                                {street}, {ward}, {district}, {province}, VN
                            </Text>
                        </>
                    )}

                    <TouchableOpacity onPress={() => {
                        router.push({
                            pathname: '/(auth)/AddressListScreen',
                            params: {
                                items: JSON.stringify(selectedItems),
                            },
                        });
                    }}>
                        <Text style={styles.linkText}>Thêm địa chỉ</Text>
                    </TouchableOpacity>

                </View>

                {/* Danh sách sản phẩm */}
                {selectedItems.map((item: any, index: number) => (
                    <View key={index} style={styles.productCard}>
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.productInfo}>Loại hàng: {item.size}</Text>
                            <Text style={styles.productPrice}>
                                {(item.price * item.quantity).toLocaleString()}₫ x{item.quantity}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Tổng tiền sản phẩm */}
                <Text style={styles.subTotal}>Tổng số tiền: {productTotal.toLocaleString()}₫</Text>

                {/* Vận chuyển */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tùy chọn vận chuyển</Text>
                    <View style={styles.shippingOption}>
                        <Ionicons name="radio-button-on" size={18} color="#f33" />
                        <View style={{ marginLeft: 8 }}>
                            <Text>Giao Hàng Tiết Kiệm</Text>
                            <Text style={{ color: '#888', fontSize: 12 }}>Dự kiến nhận hàng: {getDeliveryDate()}</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <Text>{shippingFee.toLocaleString()}₫</Text>
                    </View>
                </View>

                {/* Phương thức thanh toán */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    <View style={styles.paymentMethod}>
                        <Text>Chọn phương thức thanh toán</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="cash" size={18} />
                            <Text style={{ marginLeft: 6 }}>Tiền mặt</Text>
                        </View>
                    </View>
                </View>

                {/* Tổng kết */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>
                        Tổng tiền hàng: <Text style={styles.bold}>{productTotal.toLocaleString()}₫</Text>
                    </Text>
                    <Text style={styles.summaryText}>
                        Tổng tiền vận chuyển: <Text style={styles.bold}>{shippingFee.toLocaleString()}₫</Text>
                    </Text>
                    <Text style={[styles.summaryText, { color: '#e53935' }]}>
                        Tổng thanh toán: <Text style={styles.bold}>{total.toLocaleString()}₫</Text>
                    </Text>
                </View>
            </ScrollView>

            {/* Thanh dưới */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={{}}>Tổng tiền</Text>
                    <Text style={styles.totalBottom}>{total.toLocaleString()}₫</Text>
                </View>

                <TouchableOpacity style={styles.payButton}>
                    <Text style={styles.payText}>Thanh toán</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
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
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    text: {
        fontSize: 14,
        marginBottom: 4,
    },
    content: { padding: 16 },

    section: {
        marginTop: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
    linkText: { color: '#f33' },

    productCard: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        alignItems: 'center',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    productName: { fontWeight: '600' },
    productInfo: { fontSize: 12, color: '#666', marginTop: 2 },
    productPrice: { marginTop: 4, fontWeight: 'bold', color: '#e53935' },

    subTotal: {
        textAlign: 'right',
        marginTop: 12,
        fontWeight: '500',
        fontSize: 13,
    },

    shippingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },

    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },

    summaryBox: {
        marginTop: 20,
        backgroundColor: '#fafafa',
        borderRadius: 8,
        padding: 12,
    },
    summaryText: { fontSize: 14, marginVertical: 2 },
    bold: { fontWeight: '600' },

    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '8%',
        borderTopWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        paddingBottom: '15%',
    },
    totalBottom: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    payButton: {
        backgroundColor: '#e53935',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    payText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
