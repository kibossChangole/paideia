import React, { useState } from "react";
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
import { Picker } from "@react-native-picker/picker";

interface ScheduleBlock {
  day: string;
  time: string;
}

interface ClassAssignment {
  id: string;
  name: string;
  grade: number;
  section: string;
  scheduleBlocks: ScheduleBlock[];
  lastEdited: string;
}

export default function TermSchedule() {
  const router = useRouter();
  const [selectedTerm, setSelectedTerm] = useState("fall24");

  const [classes, setClasses] = useState<ClassAssignment[]>([
    {
      id: "1",
      name: "Advanced Algebra I",
      grade: 9,
      section: "B",
      scheduleBlocks: [
        { day: "Mon", time: "09:00 AM" },
        { day: "Wed", time: "09:00 AM" },
        { day: "Fri", time: "09:00 AM" },
      ],
      lastEdited: "2d ago",
    },
    {
      id: "2",
      name: "Geometry & Logic",
      grade: 10,
      section: "A",
      scheduleBlocks: [
        { day: "Tue", time: "10:30 AM" },
        { day: "Thu", time: "10:30 AM" },
      ],
      lastEdited: "New assignment",
    },
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#121716" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Term Schedule Setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressDotInactive} />
          <View style={styles.progressDotInactive} />
        </View>

        {/* Term Selector Card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>ACADEMIC TERM</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedTerm}
                  onValueChange={(value) => setSelectedTerm(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Fall Semester 2024" value="fall24" />
                  <Picker.Item label="Spring Semester 2025" value="spring25" />
                  <Picker.Item label="Summer Intensive 2025" value="summer25" />
                </Picker>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.primaryButton}>
                <Ionicons name="add-circle" size={20} color="#232f2c" />
                <Text style={styles.primaryButtonText}>Add New Class</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="copy-outline" size={18} color="#121716" />
                <Text style={styles.secondaryButtonText}>
                  Copy from Previous Term
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Class Assignments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Class Assignments</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{classes.length} Classes</Text>
            </View>
          </View>

          <View style={styles.classesContainer}>
            {classes.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classCardContent}>
                  <View style={styles.classHeader}>
                    <View style={styles.classHeaderLeft}>
                      <Text style={styles.className}>{classItem.name}</Text>
                      <Text style={styles.classInfo}>
                        Grade {classItem.grade} • Section {classItem.section}
                      </Text>
                    </View>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>

                  <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleLabel}>SCHEDULE BLOCKS</Text>
                    <View style={styles.scheduleBlocks}>
                      {classItem.scheduleBlocks.map((block, index) => (
                        <View key={index} style={styles.scheduleBlock}>
                          <Text style={styles.scheduleBlockText}>
                            {block.day} {block.time}
                          </Text>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.editBlockButton}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.classCardFooter}>
                  <Text style={styles.lastEdited}>
                    Last edited {classItem.lastEdited}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.cardAction}>
                      <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardAction}>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Empty State Helper */}
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="school-outline" size={32} color="#a9d6ca" />
              </View>
              <Text style={styles.emptyStateText}>
                Need to add another grade level?
              </Text>
              <TouchableOpacity>
                <Text style={styles.emptyStateLink}>
                  Explore Course Catalog
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.finalizeButton}>
          <Text style={styles.finalizeButtonText}>Finalize Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Help Button */}
      <TouchableOpacity style={styles.helpButton}>
        <Ionicons name="help-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 12,
    backgroundColor: "rgba(250, 250, 249, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(214, 224, 222, 0.3)",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121716",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },
  progressDotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#a9d6ca",
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d6e0de",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(214, 224, 222, 0.5)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#63837a",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: "#f9fbfa",
    borderWidth: 1,
    borderColor: "#d6e0de",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 56,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a9d6ca",
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232f2c",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ebf0ee",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#121716",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#121716",
  },
  badge: {
    backgroundColor: "rgba(169, 214, 202, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#232f2c",
  },
  classesContainer: {
    gap: 16,
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(214, 224, 222, 0.5)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  classCardContent: {
    padding: 20,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  classHeaderLeft: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121716",
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 14,
    fontWeight: "500",
    color: "#63837a",
  },
  scheduleSection: {
    gap: 8,
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.5,
  },
  scheduleBlocks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scheduleBlock: {
    backgroundColor: "#a9d6ca",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleBlockText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#232f2c",
  },
  editBlockButton: {
    backgroundColor: "#F3F4F6",
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  classCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fbfa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(214, 224, 222, 0.3)",
  },
  lastEdited: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
  },
  cardAction: {
    padding: 4,
  },
  emptyState: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d6e0de",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(169, 214, 202, 0.1)",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptyStateLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a9d6ca",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(250, 250, 249, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(214, 224, 222, 0.3)",
  },
  finalizeButton: {
    backgroundColor: "#a9d6ca",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#a9d6ca",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  finalizeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#232f2c",
  },
  helpButton: {
    position: "absolute",
    bottom: 96,
    right: 24,
    width: 48,
    height: 48,
    backgroundColor: "#121716",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
