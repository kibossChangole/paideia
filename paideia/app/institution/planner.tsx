import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Task {
  id: string;
  title: string;
  description: string;
  starred: boolean;
  completed: boolean;
  priority?: "high" | "normal";
}

interface ScheduleItem {
  time: string;
  title: string;
  color: string;
  borderColor: string;
}

interface DayItem {
  day: string;
  date: number;
  isActive: boolean;
}

export default function Planner() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Grade Science Quizzes",
      description: "Today",
      starred: true,
      completed: false,
    },
    {
      id: "2",
      title: "Call Parent (Emma)",
      description: "Discuss lab safety",
      starred: false,
      completed: false,
    },
    {
      id: "3",
      title: "Order Lab Supplies",
      description: "Priority: High",
      starred: true,
      completed: false,
      priority: "high",
    },
  ]);

  const [newTaskText, setNewTaskText] = useState("");

  const weekDays: DayItem[] = [
    { day: "Mon", date: 12, isActive: false },
    { day: "Tue", date: 13, isActive: true },
    { day: "Wed", date: 14, isActive: false },
    { day: "Thu", date: 15, isActive: false },
    { day: "Fri", date: 16, isActive: false },
  ];

  const schedule: ScheduleItem[] = [
    {
      time: "08:30 AM",
      title: "Bio G10",
      color: "rgba(167, 197, 233, 0.3)",
      borderColor: "#5E97D1",
    },
    {
      time: "09:45 AM",
      title: "Prep",
      color: "rgba(255, 236, 192, 0.3)",
      borderColor: "#F3D58E",
    },
    {
      time: "10:30 AM",
      title: "Duty",
      color: "rgba(238, 190, 235, 0.3)",
      borderColor: "#C78BC7",
    },
    {
      time: "11:30 AM",
      title: "Faculty",
      color: "rgba(248, 180, 162, 0.3)",
      borderColor: "#E28670",
    },
  ];

  const toggleTaskStar = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, starred: !task.starred } : task
      )
    );
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskText,
        description: "Today",
        starred: false,
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskText("");
    }
  };

  const incompleteTasks = tasks.filter((task) => !task.completed).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.schoolBadge}>PAIDEIA SCHOOL</Text>
          <Text style={styles.pageTitle}>Planner</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#3A404D" />
          </TouchableOpacity>
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKguaROCJe9uTcK2zVgrlyULuWTfF5HKVnVSJP2tAKYflodp49UPR_T5sC9tV-0hk2lvXqC7Eu8zL3i-6n0_P0qz5FCLNQVuftv5WImGhk_uTfcuY5FMqQqSionJMrwDI6Z2wf5mnUtXDRrWPk_b8MuNi4aZv5Y78G--kX8eu43ZxDsEocAQOZrRN8-s6OPN2ukcR4irLeQjr1S3ACntuilQBj1M264d_w2KozSrRJqj2JOURgkklCob_WZ8XJ4XawCTI1Wl5qKA4",
              }}
              style={styles.profileImage}
            />
          </View>
        </View>
      </View>

      {/* Week Day Selector */}
      <View style={styles.weekContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScroll}
        >
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayCard, day.isActive && styles.dayCardActive]}
            >
              <Text
                style={[styles.dayText, day.isActive && styles.dayTextActive]}
              >
                {day.day.toUpperCase()}
              </Text>
              <Text
                style={[styles.dateText, day.isActive && styles.dateTextActive]}
              >
                {day.date}
              </Text>
              {day.isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content - Changed to vertical scroll for mobile */}
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
      >
        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksHeaderTitle}>TASKS</Text>
            <View style={styles.tasksBadge}>
              <Text style={styles.tasksBadgeText}>{incompleteTasks} LEFT</Text>
            </View>
          </View>

          {/* Add Task Input */}
          <View style={styles.addTaskContainer}>
            <TextInput
              style={styles.addTaskInput}
              placeholder="Add a quick task..."
              placeholderTextColor="#9CA3AF"
              value={newTaskText}
              onChangeText={setNewTaskText}
              onSubmitEditing={addTask}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Task List */}
          <View style={styles.tasksListContainer}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskMain}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleTaskComplete(task.id)}
                  >
                    {task.completed && (
                      <Ionicons name="checkmark" size={14} color="#a9d6ca" />
                    )}
                  </TouchableOpacity>
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <Text
                      style={[
                        styles.taskDescription,
                        task.priority === "high" && styles.taskDescriptionHigh,
                      ]}
                    >
                      {task.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <View style={styles.taskActionsLeft}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleTaskStar(task.id)}
                    >
                      <Ionicons
                        name={task.starred ? "star" : "star-outline"}
                        size={18}
                        color={task.starred ? "#FCD34D" : "#D1D5DB"}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={24} color="#a9d6ca" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="checkmark-done-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f2f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    backgroundColor: "#f4f2f0",
  },
  headerLeft: {
    flex: 1,
  },
  schoolBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a9d6ca",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#121716",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
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
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(169, 214, 202, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(169, 214, 202, 0.4)",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  weekContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  weekScroll: {
    gap: 12,
  },
  dayCard: {
    minWidth: 50,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  dayCardActive: {
    backgroundColor: "#a9d6ca",
    borderColor: "#a9d6ca",
    ...Platform.select({
      ios: {
        shadowColor: "#a9d6ca",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  dayTextActive: {
    color: "#FFFFFF",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A404D",
  },
  dateTextActive: {
    color: "#FFFFFF",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 100,
  },
  scheduleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#121716",
    marginBottom: 12,
  },
  scheduleContent: {
    gap: 12,
  },
  scheduleCard: {
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  scheduleTime: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3A404D",
  },
  tasksSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  tasksHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.5,
  },
  tasksBadge: {
    backgroundColor: "rgba(169, 214, 202, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tasksBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a9d6ca",
  },
  addTaskContainer: {
    marginBottom: 16,
    position: "relative",
  },
  addTaskInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 14,
    color: "#3A404D",
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
  addButton: {
    position: "absolute",
    right: 8,
    top: 6,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#a9d6ca",
    justifyContent: "center",
    alignItems: "center",
  },
  tasksListContainer: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
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
  taskMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(169, 214, 202, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#121716",
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  taskDescription: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  taskDescriptionHigh: {
    color: "#EF4444",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
  },
  taskActionsLeft: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 16 : 4,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  navLabelActive: {
    fontWeight: "700",
    color: "#a9d6ca",
  },
});
