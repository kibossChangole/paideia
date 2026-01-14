import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ref, child, get, set, getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";

interface Student {
  id: string;
  name: string;
  grade: number;
  schoolCode: string;
}

interface GradeRecord {
  percentage: string;
  grade: string;
}

export default function GradeRecords() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentGrade = Number(params.grade);
  const subject = params.subject as string;
  const subjectName = params.subjectName as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [gradeRecords, setGradeRecords] = useState<{
    [key: string]: GradeRecord;
  }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchGradeRecords();
  }, [currentGrade, subject]);

  const fetchStudents = async () => {
    try {
      const schoolId = await AsyncStorage.getItem("schoolId");
      if (!schoolId) {
        throw new Error("School ID not found");
      }

      const dbRef = ref(getDatabase());
      const studentsSnapshot = await get(child(dbRef, "students"));

      if (studentsSnapshot.exists()) {
        const studentsData = studentsSnapshot.val();
        const gradeStudents = Object.entries(studentsData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter(
            (student: Student) =>
              student.schoolCode === schoolId && student.grade === currentGrade
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        setStudents(gradeStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchGradeRecords = async () => {
    try {
      const schoolId = await AsyncStorage.getItem("schoolId");
      if (!schoolId) return;

      const dbRef = ref(getDatabase());
      const recordsSnapshot = await get(
        child(dbRef, `grades/${schoolId}/${currentGrade}/${subject}`)
      );

      if (recordsSnapshot.exists()) {
        setGradeRecords(recordsSnapshot.val());
      }
    } catch (error) {
      console.error("Error fetching grade records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.push({
      pathname: "/admin/classlist", // Updated route to admin
      params: {
        grade: currentGrade,
        activeTab: "grades", // Send the active tab state
      },
    });
  };

  const updateStudentGrade = async (
    studentId: string,
    field: "percentage" | "grade",
    value: string
  ) => {
    try {
      setSaving(true);
      const schoolId = await AsyncStorage.getItem("schoolId");
      if (!schoolId) return;

      const newRecords = {
        ...gradeRecords,
        [studentId]: {
          ...gradeRecords[studentId],
          [field]: value,
        },
      };

      const dbRef = ref(getDatabase());
      await set(
        child(dbRef, `grades/${schoolId}/${currentGrade}/${subject}`),
        newRecords
      );
      setGradeRecords(newRecords);
    } catch (error) {
      console.error("Error updating grade:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3497A3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress} // Use the new handler
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Grade {currentGrade} - {subjectName}
        </Text>
        <Image
          source={require("../../../assets/images/PaideiaMini.png")}
          style={styles.headerIcon}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.studentList}>
          {students.map((student) => (
            <View key={student.id} style={styles.studentRow}>
              <Text style={styles.studentName}>{student.name}</Text>
              <View style={styles.gradeInputs}>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={gradeRecords[student.id]?.percentage || ""}
                  onChangeText={(value) => {
                    if (
                      value === "" ||
                      (Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      updateStudentGrade(student.id, "percentage", value);
                    }
                  }}
                  placeholder="0"
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gradeRecords[student.id]?.grade || ""}
                    onValueChange={(value) =>
                      updateStudentGrade(student.id, "grade", value)
                    }
                    style={styles.gradePicker}
                  >
                    <Picker.Item label="N/A" value="" />
                    <Picker.Item label="A" value="A" />
                    <Picker.Item label="B" value="B" />
                    <Picker.Item label="C" value="C" />
                    <Picker.Item label="D" value="D" />
                    <Picker.Item label="E" value="E" />
                    <Picker.Item label="F" value="F" />
                  </Picker>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color="#3497A3" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3497A3",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 83,
    backgroundColor: "#3497A3",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    position: "absolute",
    width: 120,
    height: 120,
    bottom: 10,
    right: 0,
  },
  headerTextContainer: {
    marginLeft: 5,
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  scrollView: {
    flex: 1,
  },
  studentList: {
    padding: 16,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  gradeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  percentageInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: "center",
    backgroundColor: "#F8F8F8",
  },
  pickerContainer: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8F8F8",
  },
  gradePicker: {
    height: 50,
    marginTop: -5,

    width: "110%",
  },
  savingOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  savingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});
