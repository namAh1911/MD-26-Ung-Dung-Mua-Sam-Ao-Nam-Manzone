import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ReturnPolicyScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header title="Chính sách đổi trả" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="1. Thời hạn">
          Bạn có thể yêu cầu đổi/ trả trong vòng 7 ngày kể từ khi nhận hàng đối
          với lỗi sản xuất hoặc chưa phù hợp về size (hàng phải còn nguyên tem,
          chưa giặt/ tẩy/ biến dạng).
        </Section>

        <Section title="2. Điều kiện">
          - Sản phẩm còn mới, đầy đủ tag/ phụ kiện đi kèm.{"\n"}- Không áp dụng
          cho hàng đã sử dụng, dơ bẩn, có mùi lạ, hư hại do bảo quản không đúng.
          {"\n"}- Hàng khuyến mãi/clearance có thể có điều kiện riêng.
        </Section>

        <Section title="3. Quy trình">
          Bước 1: Liên hệ CSKH qua ứng dụng để mở yêu cầu.{"\n"}
          Bước 2: Gửi kèm ảnh/ video mô tả vấn đề.{"\n"}
          Bước 3: Nhận hướng dẫn đổi/ trả hoặc đến cửa hàng gần nhất.{"\n"}
          Bước 4: Kiểm tra – xử lý trong 2–5 ngày làm việc.
        </Section>

        <Section title="4. Phí vận chuyển">
          - Lỗi từ nhà sản xuất: ManzonePoly chịu phí hai chiều.{"\n"}- Đổi
          size/ màu do nhu cầu cá nhân: Khách hàng chịu phí ship theo biểu phí
          hiện hành.
        </Section>

        <Section title="5. Hoàn tiền">
          Hoàn theo phương thức thanh toán ban đầu (ví điện tử/ thẻ/ chuyển
          khoản/ COD) trong 3–7 ngày làm việc sau khi xác nhận đạt điều kiện trả
          hàng.
        </Section>

        <Section title="6. Lưu ý">
          Để đảm bảo vệ sinh và quyền lợi chung, nhóm sản phẩm “mặc trong” có
          thể áp dụng điều kiện đổi/ trả khắt khe hơn (vui lòng xem mô tả chi
          tiết trên từng sản phẩm).
        </Section>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.h2}>{title}</Text>
      <Text style={styles.p}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#ff4d4f",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  content: { padding: 16, paddingBottom: 32 },
  h2: { fontSize: 15, fontWeight: "bold", color: "#0039e6", marginBottom: 8 },
  p: { fontSize: 14, color: "#333", lineHeight: 20 },
});
