import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ref, child, get, set, getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

interface Student {
    id: string;
    name: string;
    grade: number;
    schoolCode: string;
}

interface AttendanceRecord {
    [key: string]: {
        [studentId: string]: boolean;
    };
}

export default function AttendanceTab() {
    const params = useLocalSearchParams();
    const currentGrade = Number(params.grade);

    // Get current date for default values
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: boolean }>({});
    const [saving, setSaving] = useState(false);

    // Generate arrays for dropdowns
    const months = Array.from({ length: 12 }, (_, i) => ({
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
        value: i
    }));

    const days = Array.from(
        { length: new Date(selectedYear, selectedMonth + 1, 0).getDate() },
        (_, i) => i + 1
    );

    const years = Array.from({ length: 2 }, (_, i) => selectedYear - i);

    //Cleanup functions and effect
    const cleanupStates = () => {
        setStudents([]);
        setAttendanceRecords({});
        setSaving(false);
        // Reset date to today when cleaning up
        const today = new Date();
        setSelectedMonth(today.getMonth());
        setSelectedDay(today.getDate());
        setSelectedYear(today.getFullYear());
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupStates();
            setLoading(true); // Only set loading true on unmount
        };
    }, []);

    // Cleanup and fetch new students when grade changes
    useEffect(() => {
        cleanupStates(); // Clean up when grade changes
        fetchStudents(); // Then fetch new students for the current grade
    }, [currentGrade]); // Depend on currentGrade changes

    // Keep date change effect separate
    useEffect(() => {
        fetchAttendanceForDate();
    }, [selectedYear, selectedMonth, selectedDay]);


    //end of cleanup functions --  prevents data remnants when switching tabs


    useEffect(() => {
        fetchStudents();
    }, [currentGrade]);

    useEffect(() => {
        fetchAttendanceForDate();
    }, [selectedYear, selectedMonth, selectedDay]);

    const fetchStudents = async () => {
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) {
                throw new Error('School ID not found');
            }

            const dbRef = ref(getDatabase());
            const studentsSnapshot = await get(child(dbRef, 'students'));

            if (studentsSnapshot.exists()) {
                const studentsData = studentsSnapshot.val();
                const gradeStudents = Object.entries(studentsData)
                    .map(([id, data]: [string, any]) => ({
                        id,
                        ...data
                    }))
                    .filter((student: Student) =>
                        student.schoolCode === schoolId && student.grade === currentGrade
                    )
                    .sort((a, b) => a.name.localeCompare(b.name));

                setStudents(gradeStudents);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceForDate = async () => {
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) return;

            const dateKey = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
            const dbRef = ref(getDatabase());
            const attendanceSnapshot = await get(child(dbRef, `attendance/${schoolId}/${currentGrade}/${dateKey}`));

            if (attendanceSnapshot.exists()) {
                setAttendanceRecords(attendanceSnapshot.val());
            } else {
                setAttendanceRecords({});
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const toggleAttendance = async (studentId: string) => {
        try {
            setSaving(true);
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) return;

            const dateKey = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
            const newAttendance = {
                ...attendanceRecords,
                [studentId]: !attendanceRecords[studentId]
            };

            const dbRef = ref(getDatabase());
            await set(child(dbRef, `attendance/${schoolId}/${currentGrade}/${dateKey}`), newAttendance);
            setAttendanceRecords(newAttendance);
        } catch (error) {
            console.error('Error updating attendance:', error);
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
            <View style={styles.datePickerContainer}>
                {/* Month picker on top */}
                <View style={styles.monthPickerWrapper}>
                    <Picker
                        selectedValue={selectedMonth}
                        dropdownIconColor='white' 
                        onValueChange={(value) => setSelectedMonth(value)}
                        style={styles.picker}>
                        {months.map((month, index) => (
                            <Picker.Item key={index} label={month.label} value={month.value} />
                        ))}
                    </Picker>
                </View>

                {/* Day and Year pickers in a row below */}
                <View style={styles.dayYearContainer}>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedDay}
                            dropdownIconColor='white' 
                            onValueChange={(value) => setSelectedDay(value)}
                            style={styles.picker}>
                            {days.map((day) => (
                                <Picker.Item key={day} label={day.toString()} value={day} />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedYear}
                            dropdownIconColor='white' 
                            onValueChange={(value) => setSelectedYear(value)}
                            style={styles.picker}>
                            {years.map((year) => (
                                <Picker.Item key={year} label={year.toString()} value={year} />
                            ))}
                        </Picker>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.studentList}>
                {students.map((student) => (
                    <View key={student.id} style={styles.studentRow}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <TouchableOpacity
                            style={[
                                styles.checkbox,
                                attendanceRecords[student.id] && styles.checkboxChecked
                            ]}
                            onPress={() => toggleAttendance(student.id)}
                            disabled={saving}>
                            {attendanceRecords[student.id] && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3497A3',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
         backgroundColor: '#3497A3',
        
    },
    datePickerContainer: {
        marginTop: 0,
        padding: 0,
        backgroundColor: '#3497A3',
        borderBottomWidth: 0,
        borderBottomColor: '#3497A3',
    },
    monthPickerWrapper: {
        marginBottom: 0,

        backgroundColor: '#3497A3',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    monthPicker: {
        height: 60,
        backgroundColor: '#3497A3',
        color: '#FFFFFF',
    },
    dayYearContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pickerWrapper: {
        flex: 1,
        marginHorizontal: 0,
        backgroundColor: '#3497A3',
        borderRadius: 0,
        borderBottomWidth: 0.7,
        borderRightWidth: 0.3,
        borderTopWidth: 0.7,
        borderColor: '#E0E0E0',
        overflow: 'hidden',

    },
    picker: {
        height: 60,
        backgroundColor: '#3497A3',
        color: '#FFFFFF',
    },
    studentList: {
        flex: 1,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F0F0F0',
    },
    studentName: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3497A3',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});