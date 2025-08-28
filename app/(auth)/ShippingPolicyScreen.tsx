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

export default function ShippingPolicyScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header title="Chính sách giao hàng" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="1. Phạm vi & đối tác">
          Giao hàng toàn quốc qua các đơn vị vận chuyển uy tín. Đơn nội thành có
          thể được giao nhanh trong ngày tùy thời điểm đặt và tồn kho.
        </Section>

        <Section title="2. Thời gian dự kiến">
          - Nội/ngoại thành TP.HCM & Hà Nội: 1–2 ngày làm việc.{"\n"}- Tỉnh/
          thành khác: 2–5 ngày làm việc.{"\n"}
          *Thời gian có thể thay đổi theo điều kiện thời tiết, cao điểm lễ Tết.
        </Section>

        <Section title="3. Phí vận chuyển">
          Phí ship hiển thị ở bước thanh toán, phụ thuộc địa chỉ nhận và chương
          trình khuyến mãi hiện hành. Một số đơn hàng đạt ngưỡng sẽ được miễn/
          giảm phí.
        </Section>

        <Section title="4. Giao lại & xử lý thất lạc">
          Shipper liên hệ tối thiểu 2 lần. Nếu không liên lạc được, đơn có thể
          chuyển trạng thái chờ/ hoàn. Trường hợp thất lạc, ManzonePoly phối hợp
          đối tác để bồi hoàn theo quy định.
        </Section>

        <Section title="5. Kiểm hàng & COD">
          Bạn được kiểm tra ngoại quan bưu kiện trước khi nhận. Với COD, vui
          lòng chuẩn bị tiền mặt vừa đủ hoặc hỗ trợ thanh toán không tiền mặt
          nếu đối tác vận chuyển có cung cấp.
        </Section>

        <Section title="6. Theo dõi đơn">
          Mã vận đơn và trạng thái sẽ hiển thị trong mục “Đơn hàng của tôi”. Mọi
          thắc mắc, hãy liên hệ CSKH ngay trên ứng dụng để được hỗ trợ nhanh.
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
