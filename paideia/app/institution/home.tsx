import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

// Color Palette
const COLORS = {
  primary: "#59c9c6",
  backgroundLight: "#f6f8f8",
  backgroundDark: "#141e1e",
  accentPeach: "#FFECD9",
  accentMint: "#D9FFF4",
  accentLavender: "#E3D9FF",
  accentAmber: "#F7D058",
  white: "#FFFFFF",
  gray900: "#111827",
  gray800: "#1F2937",
  gray700: "#374151",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray100: "#F3F4F6",
  orange400: "#FB923C",
  purple400: "#C084FC",
  green500: "#22C55E",
  emerald600: "#059669",
  orange500: "#F97316",
  purple600: "#9333EA",
};

// Types
interface ScheduleItemProps {
  time: string;
  title: string;
  location: string;
  status: "finished" | "active" | "upcoming";
  durationLeft?: string;
  type?: string;
}

interface PulseCardProps {
  title: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
  type: "attendance" | "tasks" | "unread";
}

interface ActionButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  iconColor: string;
  bgColor: string;
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const size = 56;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          stroke={COLORS.gray100}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={COLORS.primary}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.circularProgressInner}>
        <Text style={styles.circularProgressText}>{percentage}%</Text>
      </View>
    </View>
  );
};

const PulseCard: React.FC<PulseCardProps> = ({
  title,
  value,
  color,
  bgColor,
  borderColor,
  type,
}) => {
  return (
    <View
      style={[
        styles.pulseCard,
        { backgroundColor: bgColor, borderColor: borderColor },
      ]}
    >
      <View style={styles.pulseIconContainer}>
        {type === "attendance" ? (
          <CircularProgress
            percentage={typeof value === "number" ? value : 0}
          />
        ) : (
          <View style={[styles.pulseCircle, { backgroundColor: COLORS.white }]}>
            <Text style={[styles.pulseValue, { color: color }]}>{value}</Text>
          </View>
        )}
      </View>
      <Text style={styles.pulseLabel}>{title}</Text>
    </View>
  );
};

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  time,
  title,
  location,
  status,
  durationLeft,
  type,
}) => {
  const isFinished = status === "finished";
  const isActive = status === "active";

  return (
    <View style={styles.scheduleRow}>
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, isActive && { color: COLORS.primary }]}>
          {time}
        </Text>
        <View
          style={[
            styles.timelineLine,
            isActive
              ? { backgroundColor: "rgba(89, 201, 198, 0.2)" }
              : { backgroundColor: COLORS.gray100 },
          ]}
        />
      </View>

      {type === "lunch" ? (
        <View style={styles.lunchCard}>
          <View style={styles.lunchContent}>
            <MaterialIcons name="restaurant" size={20} color={COLORS.gray400} />
            <Text style={styles.lunchText}>{title}</Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.classCard,
            isFinished && styles.finishedCard,
            isActive && styles.activeCard,
          ]}
        >
          <View style={styles.classHeader}>
            <View>
              {isActive && (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>IN PROGRESS</Text>
                </View>
              )}
              <Text style={styles.classTitle}>{title}</Text>
              <Text style={styles.classLocation}>
                {location} {durationLeft && `• ${durationLeft}`}
              </Text>
            </View>
            {isActive && (
              <MaterialIcons name="star" size={24} color={COLORS.accentAmber} />
            )}
          </View>

          {isActive && (
            <TouchableOpacity style={styles.joinButton}>
              <MaterialIcons name="play-arrow" size={20} color={COLORS.white} />
              <Text style={styles.joinButtonText}>Join / Start Session</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const QuickActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  iconColor,
  bgColor,
}) => (
  <TouchableOpacity style={styles.actionButton}>
    <View style={[styles.actionIconCircle, { backgroundColor: bgColor }]}>
      <MaterialIcons name={icon} size={24} color={iconColor} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function InstitutionHome() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpJxra7MsunllvcgOiedoelI1f4G-0Un4WDNsm8xMUCuMxJDgw2CBXxcyKF2ByJqHF-lWaOCv9V72ncZ5iQVzOKkft9aHgdr_A8fyqnVBgBW-FG2eI73C-iAyA0VFpGpeVtU_hdgvB6Ry9B4pIFItcXm_4zB8FFLeub80i3jd2Q9AXRc4CBaCDzaziH-sDc16DCJlaSDORghslA1OuoefFj--0AEztwhFSZAGX6Hpb3_D1dTPgQXT9Uy8I0WiaCM-4zvOBEcJPPQA",
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.greetingTitle}>Welcome back, Sarah!</Text>
              <Text style={styles.dateText}>Tuesday, Oct 24th</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons
              name="notifications"
              size={22}
              color={COLORS.gray700}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Today's Pulse */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Pulse</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pulseContainer}
            >
              <PulseCard
                title="ATTENDANCE"
                value={85}
                type="attendance"
                color={COLORS.gray800}
                bgColor="rgba(217, 255, 244, 0.3)"
                borderColor="rgba(89, 201, 198, 0.1)"
              />
              <PulseCard
                title="TASKS"
                value="4"
                type="tasks"
                color={COLORS.orange400}
                bgColor="rgba(255, 236, 217, 0.4)"
                borderColor="rgba(255, 236, 217, 0.2)"
              />
              <PulseCard
                title="UNREAD"
                value="12"
                type="unread"
                color={COLORS.purple400}
                bgColor="rgba(227, 217, 255, 0.4)"
                borderColor="rgba(227, 217, 255, 0.2)"
              />
            </ScrollView>
          </View>

          {/* Smart Schedule */}
          <View style={[styles.section, { flex: 1 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Schedule</Text>
              <Text style={styles.viewWeekly}>View Weekly</Text>
            </View>
            <View style={styles.scheduleList}>
              <ScheduleItem
                time="09:00"
                title="Algebra I"
                location="Room 302 • Finished"
                status="finished"
              />
              <ScheduleItem
                time="10:30"
                title="Geometry Honors"
                location="Lab 12"
                durationLeft="45m left"
                status="active"
              />
              <ScheduleItem
                time="12:00"
                title="Lunch Break"
                location=""
                status="upcoming"
                type="lunch"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <QuickActionButton
                icon="campaign"
                label="Post News"
                bgColor="rgba(247, 208, 88, 0.2)"
                iconColor={COLORS.orange500}
              />
              <QuickActionButton
                icon="how-to-reg"
                label="Mark Present"
                bgColor="rgba(217, 255, 244, 0.4)"
                iconColor={COLORS.emerald600}
              />
              <QuickActionButton
                icon="auto-stories"
                label="Enter Grades"
                bgColor="rgba(227, 217, 255, 0.4)"
                iconColor={COLORS.purple600}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(89, 201, 198, 0.2)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green500,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray900,
    lineHeight: 24,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.gray500,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100, // gray-50 equivalentish
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray900,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewWeekly: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Pulse Cards
  pulseContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  pulseCard: {
    minWidth: 130,
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  pulseIconContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  pulseLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  circularProgressInner: {
    position: "absolute",
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  circularProgressText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray800,
    marginLeft: 2,
  },

  // Schedule
  scheduleList: {
    gap: 16,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 16,
  },
  timeColumn: {
    width: 48,
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray400,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    borderRadius: 1,
  },
  classCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100, // default border
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderColor: "rgba(0,0,0,0)", // Hide common border if active logic differs
    // Re-applying shadow or elevation if needed
  },
  finishedCard: {
    opacity: 0.6,
    backgroundColor: COLORS.white,
  },
  lunchCard: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB", // gray-300
    borderStyle: "dashed",
  },
  lunchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lunchText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray500,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  classTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray900,
  },
  classLocation: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray700,
    textAlign: "center",
    lineHeight: 12,
  },
});
