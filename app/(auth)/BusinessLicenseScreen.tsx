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

export default function BusinessLicenseScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header title="Giấy phép kinh doanh" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Thông tin pháp lý (mẫu tham khảo)">
          Tên đơn vị: Công ty TNHH Manzone Poly Việt Nam{"\n"}
          Mã số doanh nghiệp: 0xx0xxx0x (Cấp lần đầu: 01/01/2024){"\n"}
          Địa chỉ trụ sở: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh{"\n"}
          Đại diện pháp luật: Nguyễn Văn A – Giám đốc{"\n"}
          Lĩnh vực: Bán lẻ quần áo, phụ kiện thời trang.
        </Section>

        <Section title="Trách nhiệm công bố">
          Các thông tin pháp lý được công khai nhằm đảm bảo tính minh bạch khi
          giao dịch. Nếu có thay đổi, chúng tôi sẽ cập nhật ngay trên ứng dụng
          và các kênh truyền thông chính thức.
        </Section>

        <Section title="Hóa đơn & chứng từ">
          ManzonePoly hỗ trợ xuất hóa đơn điện tử theo yêu cầu. Khách hàng vui
          lòng cung cấp thông tin đầy đủ trong vòng 7 ngày kể từ ngày mua để đội
          ngũ kế toán xử lý.
        </Section>

        <Section title="Liên hệ">
          Bộ phận pháp chế/kế toán: legal@manzonepoly.vn · 1900-xxxx (giờ hành
          chính).
        </Section>

        <Text style={styles.note}>
          *Lưu ý: Đây là nội dung mẫu để bạn đưa lên Git/ứng dụng. Thay thế bằng
          thông tin pháp lý chính thức của đơn vị bạn trước khi phát hành.
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
  note: { fontSize: 13, color: "#777", fontStyle: "italic", marginTop: 8 },
});
