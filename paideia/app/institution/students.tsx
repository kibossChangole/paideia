import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, child, get, getDatabase } from "firebase/database";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

// Design Tokens - matching the HTML reference exactly
const COLORS = {
  primary: "#135bec",
  backgroundLight: "#f6f6f8",
  surfaceLight: "#ffffff",
  borderLight: "#e7ebf3",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  white: "#ffffff",
  green500: "#22c55e",
  teal50: "#f0fdfa",
  teal400: "#2dd4bf",
  teal600: "#0d9488",
  indigo50: "#eef2ff",
  indigo400: "#818cf8",
  indigo600: "#4f46e5",
  amber50: "#fffbeb",
  amber400: "#fbbf24",
  amber600: "#d97706",
};

interface Student {
  id: string;
  name: string;
  dob: string;
  documentation: string;
  feeStructure: number;
  grade: number;
  guardianContact: string;
  guardianName: string;
  password: string;
  region: string;
  schoolCode: string;
  submittedAt: string;
}

interface SchoolData {
  name: string;
  region: string;
}

interface GradeGroup {
  grade: number;
  students: Student[];
  studentCount: number;
  progress: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
  label: string;
}

const StudentDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Icon and color mappings for different subjects/grades
  const subjectMappings = [
    {
      icon: "calculator" as keyof typeof MaterialCommunityIcons.glyphMap,
      label: "Mathematics",
      color: COLORS.primary,
      bgColor: "rgba(19, 91, 236, 0.1)",
    },
    {
      icon: "atom" as keyof typeof MaterialCommunityIcons.glyphMap,
      label: "Physics",
      color: COLORS.teal600,
      bgColor: COLORS.teal50,
    },
    {
      icon: "school" as keyof typeof MaterialCommunityIcons.glyphMap,
      label: "Homeroom",
      color: COLORS.indigo600,
      bgColor: COLORS.indigo50,
    },
    {
      icon: "book-open-variant" as keyof typeof MaterialCommunityIcons.glyphMap,
      label: "Literature",
      color: COLORS.amber600,
      bgColor: COLORS.amber50,
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const schoolId = await AsyncStorage.getItem("schoolId");
      if (!schoolId) throw new Error("School ID not found");

      const dbRef = ref(getDatabase());

      // Fetch school data
      const schoolSnapshot = await get(child(dbRef, `schools`));
      if (schoolSnapshot.exists()) {
        const schoolsData = schoolSnapshot.val();
        const currentSchool = Object.values(schoolsData).find(
          (school: any) => school.schoolCode === schoolId
        ) as any;

        if (currentSchool) {
          setSchoolData({
            name: currentSchool.name,
            region: currentSchool.region,
          });
        }
      }

      // Fetch students
      const studentsSnapshot = await get(child(dbRef, "students"));
      if (studentsSnapshot.exists()) {
        const studentsData = studentsSnapshot.val();
        const studentsArray = Object.entries(studentsData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter((student: Student) => student.schoolCode === schoolId);

        setStudents(studentsArray);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const gradeGroups = useMemo(() => {
    const groups: Record<number, Student[]> = {};
    students.forEach((student) => {
      const g = student.grade || 0;
      if (!groups[g]) groups[g] = [];
      groups[g].push(student);
    });

    return Object.entries(groups).map(([grade, students], index) => {
      const mapping = subjectMappings[index % subjectMappings.length];
      return {
        grade: parseInt(grade),
        students,
        studentCount: students.length,
        progress: Math.floor(Math.random() * 40) + 40,
        icon: mapping.icon,
        color: mapping.color,
        bgColor: mapping.bgColor,
        label: mapping.label,
      } as GradeGroup;
    });
  }, [students]);

  const filteredGradeGroups = useMemo(() => {
    let result = gradeGroups;
    if (activeFilter !== "All") {
      result = result.filter((g) => g.label === activeFilter);
    }
    if (searchQuery) {
      result = result.filter(
        (g) =>
          g.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `Grade ${g.grade}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [gradeGroups, searchQuery, activeFilter]);

  const filters = ["All", "Mathematics", "Science", "Homeroom", "History"];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.backgroundLight}
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.userProfile}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOygwl0tgigpG7XveaTCiWgEQSwVwZIuAxeOnTABt7tfDd_Li_FZFQEU_sDYQbCs-OxyC2nfuhr-1KXxZr1Zau7V5vqHeUb_xx7sey_l0aOMUIGk1zMczN8EgQKEVUE_2XSni8p4PZ6bViHEx6Dv6WTiDw_7Czqo7cAesHmc6HOFxK2ZqXLJlkrVXbFTO7b4iQ2sfFSYz7-f-dDmaE8aqJp9sCoQLJXvZUV5FOT0PUrc6JnmIOJ1QLVdg25lG44bMNl70zmfV233U",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.userName}>
                    {schoolData?.name || "Mr. Anderson"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <MaterialIcons name="add" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mainTitle}>Class {"\n"}Management</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchWrapper}>
              <MaterialIcons
                name="search"
                size={24}
                color={COLORS.slate400}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a class..."
                placeholderTextColor={COLORS.slate400}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active Courses Section */}
          <View style={styles.gridSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Courses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {filteredGradeGroups.length === 0 ? (
                <Text style={styles.noDataText}>No classes found</Text>
              ) : (
                filteredGradeGroups.map((group) => (
                  <TouchableOpacity
                    key={group.grade}
                    style={styles.card}
                    activeOpacity={0.95}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardInfo}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: group.bgColor },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={group.icon}
                            size={28}
                            color={group.color}
                          />
                        </View>
                        <View>
                          <Text style={styles.cardTitle}>{group.label}</Text>
                          <Text style={styles.cardSubtitle}>
                            Grade {group.grade}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="more-vert"
                          size={24}
                          color={COLORS.slate300}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardMetrics}>
                      <MaterialIcons
                        name="group"
                        size={18}
                        color={COLORS.slate500}
                      />
                      <Text style={styles.studentCount}>
                        {group.studentCount} Students
                      </Text>
                    </View>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                          SYLLABUS PROGRESS
                        </Text>
                        <Text
                          style={[styles.progressValue, { color: group.color }]}
                        >
                          {group.progress}%
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${group.progress}%`,
                              backgroundColor: group.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 24 : 24,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.slate200,
    borderWidth: 2,
    borderColor: COLORS.white,
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
  welcomeText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate500,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  mainTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.slate900,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 16,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.slate900,
    padding: 0,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: COLORS.white,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate600,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  gridSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate900,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
    marginTop: 2,
  },
  cardMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  studentCount: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.slate400,
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.slate100,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: "center",
    paddingVertical: 40,
  },
});

export default StudentDashboard;
