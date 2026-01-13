import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const COLORS = {
  primary: "#14B8A6",
  background: "#F8FAFC",
  slate900: "#0f172a",
  slate500: "#64748b",
  white: "#ffffff",
};

export default function StudiesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Default to a menu view if no specific type is provided
  const viewType = params.type || "menu";

  const renderContent = () => {
    switch (viewType) {
      case "attendance":
        return <PlaceholderView title="Attendance" icon="check-circle" />;
      case "diary":
        return <PlaceholderView title="School Diary" icon="book" />;
      case "report-cards":
        return <PlaceholderView title="Report Cards" icon="menu-book" />;
      case "exams":
        return <PlaceholderView title="Exam Schedule" icon="event" />;
      case "biodata":
        // Preserving the old biodata context if needed, or just a placeholder
        return <PlaceholderView title="Student Biodata" icon="person" />;
      case "menu":
      default:
        return <MenuView router={router} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {viewType !== "menu" && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={COLORS.slate900}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {viewType === "menu"
            ? "Studies"
            : (viewType as string).charAt(0).toUpperCase() +
              (viewType as string).slice(1).replace("-", " ")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

const MenuView = ({ router }: { router: any }) => (
  <View style={styles.grid}>
    <MenuCard
      title="Attendance"
      icon="check-circle"
      color="#10B981"
      onPress={() =>
        router.push({
          pathname: "/dashboard/studies",
          params: { type: "attendance" },
        })
      }
    />
    <MenuCard
      title="Diary"
      icon="book"
      color="#F59E0B"
      onPress={() =>
        router.push({
          pathname: "/dashboard/studies",
          params: { type: "diary" },
        })
      }
    />
    <MenuCard
      title="Report Cards"
      icon="menu-book"
      color="#3B82F6"
      onPress={() =>
        router.push({
          pathname: "/dashboard/studies",
          params: { type: "report-cards" },
        })
      }
    />
    <MenuCard
      title="Exam Schedule"
      icon="event"
      color="#8B5CF6"
      onPress={() =>
        router.push({
          pathname: "/dashboard/studies",
          params: { type: "exams" },
        })
      }
    />
    <MenuCard
      title="Biodata"
      icon="person"
      color={COLORS.primary}
      onPress={() =>
        router.push({
          pathname: "/dashboard/studies",
          params: { type: "biodata" },
        })
      }
    />
  </View>
);

const MenuCard = ({ title, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
      <MaterialIcons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
  </TouchableOpacity>
);

const PlaceholderView = ({ title, icon }: { title: string; icon: any }) => (
  <View style={styles.placeholderContainer}>
    <MaterialIcons name={icon} size={64} color={COLORS.slate500} />
    <Text style={styles.placeholderText}>{title}</Text>
    <Text style={styles.placeholderSubText}>Feature coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate900,
    textTransform: "capitalize",
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    width: "47%",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate900,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    gap: 16,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  placeholderSubText: {
    fontSize: 16,
    color: COLORS.slate500,
  },
});
