import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface SettingItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function Settings() {
  const router = useRouter();

  const sections: SettingSection[] = [
    {
      title: "Account Security",
      items: [
        {
          title: "Profile Settings",
          description: "Edit personal info and bio",
          icon: "person",
          iconBgColor: "#DBEAFE",
          iconColor: "#2563EB",
        },
        {
          title: "Password & Security",
          description: "2FA and login history",
          icon: "lock-closed",
          iconBgColor: "#FFE4E6",
          iconColor: "#E11D48",
        },
      ],
    },
    {
      title: "Notification Preferences",
      items: [
        {
          title: "Push Notifications",
          description: "",
          icon: "notifications",
          iconBgColor: "#FEF3C7",
          iconColor: "#D97706",
        },
        {
          title: "Email Digests",
          description: "",
          icon: "mail",
          iconBgColor: "#E0E7FF",
          iconColor: "#4F46E5",
        },
      ],
    },
    {
      title: "App Appearance",
      items: [
        {
          title: "Display Theme",
          description: "",
          icon: "moon",
          iconBgColor: "#D1FAE5",
          iconColor: "#059669",
        },
        {
          title: "Accessibility",
          description: "",
          icon: "accessibility",
          iconBgColor: "#F1F5F9",
          iconColor: "#64748B",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          title: "Help Center",
          description: "",
          icon: "help-circle",
          iconBgColor: "rgba(51, 153, 136, 0.1)",
          iconColor: "#339988",
        },
        {
          title: "Send Feedback",
          description: "",
          icon: "chatbox-ellipses",
          iconBgColor: "rgba(51, 153, 136, 0.1)",
          iconColor: "#339988",
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#339988" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faculty Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Academic Configuration Section */}
        <View style={styles.academicSection}>
          <View style={styles.academicCard}>
            <Text style={styles.academicTitle}>Academic Configuration</Text>
            <TouchableOpacity
              style={styles.prominentButton}
              onPress={() => router.push("./termschedule")}
            >
              <Ionicons name="calendar" size={24} color="#FFFFFF" />
              <Text style={styles.prominentButtonText}>
                Manage Term Schedule & Classes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.listItem,
                    itemIndex < section.items.length - 1 &&
                      styles.listItemBorder,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.listItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: item.iconBgColor },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={item.iconColor}
                      />
                    </View>
                    <View style={styles.listItemText}>
                      <Text style={styles.listItemTitle}>{item.title}</Text>
                      {item.description ? (
                        <Text style={styles.listItemDescription}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#101817"
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Paideia Faculty Suite • v4.2.0</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#101817",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // Offset for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  academicSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  academicCard: {
    backgroundColor: "rgba(51, 153, 136, 0.05)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(51, 153, 136, 0.1)",
  },
  academicTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#101817",
    marginBottom: 16,
  },
  prominentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#339988",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#339988",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  prominentButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7A828F",
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionCard: {
    backgroundColor: "#f8fafb",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101817",
    marginBottom: 2,
  },
  listItemDescription: {
    fontSize: 12,
    color: "#7A828F",
  },
  chevron: {
    opacity: 0.3,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7A828F",
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#339988",
  },
  footerDivider: {
    fontSize: 12,
    color: "#D1D5DB",
  },
});
