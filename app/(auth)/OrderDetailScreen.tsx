// app/(auth)/OrderDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/AuthContext';
import { BASE_URL } from '../src/config';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OrderDetailScreen() {
    const { orderId } = useLocalSearchParams() as { orderId?: string };
    const router = useRouter();
    const { token } = useAuth();

    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);


    useEffect(() => {
        if (orderId && token) {
            fetchOrder();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, token]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            console.log('Fetching order detail, orderId:', orderId);
            const res = await axios.get(`${BASE_URL}/api/orders/${String(orderId)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Order detail:', res.data);
            setOrder(res.data);
        } catch (err: any) {
            console.error(
                'Fetch order error:',
                err?.response?.status,
                err?.response?.data || err?.message
            );
            Alert.alert('Lỗi', 'Không tải được thông tin đơn hàng.');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async () => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn huỷ đơn hàng này?', [
            { text: 'Không', style: 'cancel' },
            {
                text: 'Huỷ đơn',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setCancelLoading(true);
                        await axios.put(
                            `${BASE_URL}/api/orders/${String(orderId)}/cancel`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        Alert.alert('Thành công', 'Đơn hàng đã được huỷ.', [
                            {
                                text: 'OK',
                                onPress: () => {
                                    router.push({
                                        pathname: '/(auth)/MyOrdersScreen',
                                        params: { initialTab: 'cancelled' }
                                    });

                                }
                            }
                        ]);
                        fetchOrder();
                    } catch (err) {
                        console.error('Cancel order error:', err);
                        Alert.alert('Lỗi', 'Huỷ đơn không thành công.');
                    } finally {
                        setCancelLoading(false);
                    }
                },
            },
        ]);
    };

    const getStatusLabel = (status?: string) => {
        switch (String(status)) {
            case 'pending':
                return 'Đơn hàng đang chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'processing':
                return 'Đơn hàng đang xử lý';
            case 'shipping':
                return 'Đang giao hàng';
            case 'completed':
            case 'delivered':
                return 'Đã giao hàng';
            case 'cancelled':
                return 'Đơn đã huỷ';
            default:
                return String(status ?? '');
        }
    };

    const getStatusColor = (status?: string) => {
        switch (String(status)) {
            case 'pending':
                return '#e2e90c';
            case 'processing':
                return '#3b82f6';
            case 'shipping':
                return '#3b82f6';
            case 'confirmed': return '#e90c9f';
            case 'delivered':
                return '#10b981';
            case 'cancelled':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    const formatCurrency = (value?: number | string | null) => {
        if (value === null || value === undefined) return '0 đ';
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (!isFinite(num)) return '0 đ';
        return num.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';
    };

    const formatDateTime = (iso?: string) =>
        iso ? new Date(iso).toLocaleString('vi-VN') : '';

    // --- SAFETY: nếu vẫn loading hoặc không có order thì render thông báo ---
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 8 }}>Đang tải thông tin đơn hàng...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy đơn hàng.</Text>
            </View>
        );
    }

    // build safe address strings
    const addr = order.address ?? {};
    const addressName = String((addr.full_name ?? '')).trim();
    const addressPhone = String((addr.phone_number ?? '')).trim();
    const addressParts = [
        addr.street,
        addr.ward,
        addr.district,
        addr.province,
    ]
        .filter(Boolean)
        .map((p: any) => String(p).trim());
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') + ', VN' : '';

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#ffffffff" />
                </TouchableOpacity>
                <Text style={styles.title}>Chi tiết đơn hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Status banner */}
                <View
                    style={[
                        styles.statusBanner,
                        { borderColor: getStatusColor(order.status) },
                    ]}
                >
                    <View style={styles.statusInner}>
                        <View
                            style={[
                                styles.statusIcon,
                                {
                                    backgroundColor: getStatusColor(order.status),
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }
                            ]}
                        >
                            <Ionicons name="checkmark-done" size={24} color="#000" />
                        </View>

                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.statusTitle}>
                                {String(getStatusLabel(order.status))}
                            </Text>
                            <Text style={styles.statusSub}>Cảm ơn bạn.</Text>
                        </View>
                    </View>
                </View>

                {/* Shipping address */}
                <View style={styles.card}>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardHeading}>Địa chỉ người nhận</Text>
                    </View>

                    <Text style={styles.text}>
                        {addressName ? `${addressName} - ${addressPhone}` : '-'}
                    </Text>
                    <Text style={styles.text}>{addressLine || '-'}</Text>
                </View>

                {/* Products */}
                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Sản phẩm</Text>

                    {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((it: any, idx: number) => {
                            const img = it?.product_id?.image || it?.image || 'https://via.placeholder.com/80';
                            const prodName = String(it?.product_id?.name ?? 'Sản phẩm');
                            const variant = `Phân loại: ${String(it?.color ?? '-')} · ${String(it?.size ?? '-')}`;
                            const priceText = formatCurrency(it?.price ?? it?.unit_price ?? 0);
                            const qtyText = `x${Number(it?.quantity ?? 0)}`;

                            return (
                                <View key={`${idx}-${String(it?.product_id?._id ?? idx)}`} style={styles.productRow}>
                                    <Image source={{ uri: img }} style={styles.productImage} resizeMode="cover" />
                                    <View style={{ flex: 1, paddingLeft: 10 }}>
                                        <Text numberOfLines={2} style={styles.productName}>
                                            {prodName}
                                        </Text>
                                        <Text style={styles.productVariant}>{variant}</Text>
                                        <View style={styles.productBottomRow}>
                                            <Text style={styles.productPrice}>{priceText}</Text>
                                            <Text style={styles.productQty}>{qtyText}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.text}>Không có sản phẩm</Text>
                    )}

                </View>

                {/* Payment info */}
                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Thông tin thanh toán</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phương thức thanh toán</Text>
                        <Text style={styles.infoValue}>
                            {order.payment_method === 'cash'
                                ? 'Thanh toán khi nhận hàng'
                                : order.payment_method === 'vnpay'
                                    ? 'Thanh toán qua VNPay'
                                    : String(order.payment_method ?? '')}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Thành tiền</Text>
                        <Text style={[styles.infoValue, { color: '#E91E63', fontWeight: '700' }]}>
                            {formatCurrency(order.total_amount ?? order.total_price ?? order.total ?? 0)}
                        </Text>
                    </View>
                </View>

                {/* Order meta */}
                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Đơn hàng</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã đơn hàng</Text>
                        <Text style={styles.infoValue}>{String(order.order_code ?? order._id ?? '')}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Thời gian đặt hàng</Text>
                        <Text style={styles.infoValue}>{formatDateTime(order.createdAt)}</Text>
                    </View>
                </View>

                {/* Cancel button */}
                {String(order.status) === 'pending' && (
                    <View style={{ paddingHorizontal: 16, marginTop: '10%', }}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, cancelLoading && { opacity: 0.6 }]}
                            onPress={cancelOrder}
                            disabled={cancelLoading}
                        >
                            <Text style={styles.cancelText}>{cancelLoading ? 'Đang huỷ...' : 'Huỷ đơn'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f5f5f7' },
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
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backText: { fontSize: 28, color: '#222' },
    headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    statusBanner: {
        margin: 12,
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    statusInner: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { width: 36, height: 36, borderRadius: 8 },
    statusTitle: { fontWeight: '700', fontSize: 16 },
    statusSub: { color: '#9e9e9e', marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardHeading: { fontWeight: '700', fontSize: 15 },

    text: { marginTop: 8, color: '#333' },

    productRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
    productImage: { width: 80, height: 80, borderRadius: 6, backgroundColor: '#eee' },
    productName: { fontWeight: '600' },
    productVariant: { marginTop: 6, color: '#777', fontSize: 13 },
    productBottomRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { fontWeight: '700' },
    productQty: { color: '#777' },

    infoRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { color: '#777' },
    infoValue: { fontWeight: '600' },

    cancelBtn: {
        backgroundColor: '#111',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
