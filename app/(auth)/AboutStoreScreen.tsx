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

export default function AboutStoreScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header title="Giới thiệu cửa hàng" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.p}>
          ManzonePoly là ứng dụng bán hàng thời trang nam hướng tới phong cách
          tối giản, chất liệu bền bỉ và trải nghiệm mua sắm thân thiện. Chúng
          tôi tập trung vào những sản phẩm “đáng mặc mỗi ngày” – vừa vặn, thoải
          mái, và phối được trong nhiều ngữ cảnh: đi học, đi làm, đi chơi.
        </Text>

        <Section title="Tầm nhìn">
          Trở thành nền tảng thời trang nam được yêu thích tại Việt Nam nhờ
          chuỗi giá trị minh bạch: thiết kế thực dụng, quy trình vận hành gọn
          nhẹ, tối ưu chi phí để khách hàng nhận được chất lượng tốt với mức giá
          hợp lý.
        </Section>

        <Section title="Sứ mệnh">
          (1) Chọn lựa chất liệu ổn định, (2) kiểm soát size & form chuẩn số
          đông, (3) dịch vụ sau bán rõ ràng – đặc biệt là đổi trả thuận tiện,
          (4) giao hàng nhanh và đồng nhất toàn quốc.
        </Section>

        <Section title="Giá trị cốt lõi">
          Trung thực sản phẩm · Tối giản tính năng · Tôn trọng thời gian khách
          hàng · Lắng nghe liên tục để cải thiện vòng đời sản phẩm – từ thiết
          kế, thử nghiệm, sản xuất đến chăm sóc.
        </Section>

        <Section title="Cột mốc">
          2023: Ý tưởng và thử nghiệm mẫu.{"\n"}
          2024: Ra mắt bộ sưu tập cơ bản – tee, polo, quần denim.{"\n"}
          2025: Ứng dụng ManzonePoly bản 1.0 – tối ưu trải nghiệm mua hàng trên
          di động.
        </Section>

        <Section title="Cam kết">
          Mỗi đơn hàng đều có hướng dẫn bảo quản, tem kiểm soát và kênh phản hồi
          nhanh qua ứng dụng. Nếu có lỗi do nhà sản xuất, ManzonePoly hỗ trợ đổi
          mới miễn phí theo chính sách đi kèm.
        </Section>

        <Text style={[styles.p, { marginTop: 8 }]}>
          Cảm ơn bạn đã tin tưởng ManzonePoly. Chúng tôi luôn coi mọi góp ý là
          “bản đồ” để cải tiến từng ngày.
        </Text>
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
