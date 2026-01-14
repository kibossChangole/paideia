import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const subjects = [
  { id: "eng", name: "English", color: "#3497A3" },
  { id: "math", name: "Maths", color: "#3497A3" },
  { id: "kis", name: "Kiswahili", color: "#3497A3" },
  { id: "sci", name: "Science", color: "#3497A3" },
  { id: "sst", name: "Social Studies", color: "#3497A3" },
  { id: "rel", name: "Religion", color: "#3497A3" },
];

export default function GradesTab() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentGrade = Number(params.grade);

  const handleSubjectPress = (subjectId: string, subjectName: string) => {
    router.push({
      pathname: "./components/graderecords",
      params: {
        grade: currentGrade,
        subject: subjectId,
        subjectName: subjectName,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Grade {currentGrade} Subjects</Text>
      <View style={styles.grid}>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={[styles.subjectCard, { backgroundColor: subject.color }]}
            onPress={() => handleSubjectPress(subject.id, subject.name)}
          >
            <Text style={styles.subjectText}>{subject.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3497A3",
    padding: 0,
  },
  header: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 0,
    color: "#3497A3",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
  subjectCard: {
    width: "50%",
    aspectRatio: 1,
    borderRadius: 0,
    borderRightWidth: 0.3,
    borderBottomWidth: 0.7,
    borderColor: "#FFFFFF",
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    /*
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            
        }),
        */
  },
  subjectText: {
    fontSize: 18,
    width: "80%",
    borderWidth: 0,
    borderRadius: 0,
    borderColor: "#FFFFFF",
    fontWeight: "900",
    padding: 10,
    marginBottom: "25%",
    color: "#F8F8FF",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
});
