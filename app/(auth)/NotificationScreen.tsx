import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotifications } from "../src/NotificationContext"; 

export default function NotificationScreen() {
  const { notifications, fetchNotifications, markAllAsRead } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await fetchNotifications();
      await markAllAsRead();
    })();
  }, []);

  if (!notifications.length) {
    return (
      <View style={styles.center}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title1}>Thông báo</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text>Chưa có thông báo nào.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title1}>Thông báo</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(auth)/OrderDetailScreen",
                params: { orderId: item.order_id },
              })
            }
          >
            <View
              style={[
                styles.card,
                item.read ? {} : { backgroundColor: "#ffecec" },
              ]}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.product}>{item.productName}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  title1: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  product: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#444",
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },
});
