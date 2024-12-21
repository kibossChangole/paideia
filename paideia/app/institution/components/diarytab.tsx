import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert
} from 'react-native';
import { ref, child, get, set, push, getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

interface Student {
    id: string;
    name: string;
    grade: number;
    schoolCode: string;
    guardianName: string;
    guardianContact: string;
    dob: string;
    documentation: string;
    feeStructure: number;
    password: string;
    region: string;
    submittedAt: string;
}

interface DiaryEntry {
    id: string;
    content: string;
    date: string;
    author: string;
    title: string;
    submittedAt: string;
    studentName?: string;
}

export default function DiaryTab() {
    const params = useLocalSearchParams();
    const currentGrade = Number(params.grade);


    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const months = Array.from({ length: 12 }, (_, i) => ({
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
        value: i
    }));

    const days = Array.from(
        { length: new Date(selectedYear, selectedMonth + 1, 0).getDate() },
        (_, i) => i + 1
    );

    const years = Array.from({ length: 2 }, (_, i) => selectedYear - i);

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newEntry, setNewEntry] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false); // Add this line
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');

    //Cleanup functions and effect

    const cleanupStates = () => {
        setStudents([]);
        setSelectedStudent(null);
        setDiaryEntries([]);
        setModalVisible(false);
        setNewEntry('');
        setNewTitle('');
        setSelectedStudentName('');
        setSaving(false);
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

    // Remove grade from this useEffect since it's handled above
    useEffect(() => {
        if (selectedStudent) {
            fetchDiaryEntries();
            if (selectedStudent === 'all') {
                setSelectedStudentName('All Students');
            } else {
                const student = students.find(s => s.id === selectedStudent);
                if (student) {
                    setSelectedStudentName(student.name);
                }
            }
        }
    }, [selectedStudent]);




    //end of cleanup functions --  prevents data remnants when switching tabs

    useEffect(() => {
        fetchStudents();
    }, [currentGrade]);

    useEffect(() => {
        if (selectedStudent) {
            fetchDiaryEntries();
            if (selectedStudent === 'all') {
                setSelectedStudentName('All Students');
            } else {
                const student = students.find(s => s.id === selectedStudent);
                if (student) {
                    setSelectedStudentName(student.name);
                }
            }
        }
    }, [selectedStudent]);

    useEffect(() => {
        if (selectedStudent) {
            fetchDiaryEntries();
        }
    }, [selectedStudent, selectedYear, selectedMonth, selectedDay]);

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
                        student.schoolCode === schoolId &&
                        student.grade === currentGrade &&
                        student.id.includes(schoolId) // Additional check based on your ID pattern
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

    const fetchDiaryEntries = async () => {
        try {
            if (!selectedStudent) return;

            const schoolCode = await AsyncStorage.getItem('schoolId');
            if (!schoolCode) {
                console.error('Missing school code');
                Alert.alert('Error', 'Authentication failed - please login again');
                return;
            }

            const db = getDatabase();
            const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
            const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString();
            const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1).toISOString();

            if (selectedStudent === 'all') {
                const allEntries: DiaryEntry[] = [];
                for (const student of students) {
                    const studentDiaryRef = ref(db, `diary/${schoolCode}/${currentGrade}/${student.id}`);
                    const entriesSnapshot = await get(studentDiaryRef);

                    if (entriesSnapshot.exists()) {
                        const entriesData = entriesSnapshot.val();
                        const studentEntries = Object.entries(entriesData)
                            .map(([id, data]: [string, any]) => ({
                                id,
                                ...data,
                                studentName: student.name
                            }))
                            .filter(entry => {
                                const entryDate = new Date(entry.date);
                                const entryDateString = entryDate.toISOString();
                                return entryDateString >= startOfDay && entryDateString < endOfDay;
                            });
                        allEntries.push(...studentEntries);
                    }
                }
                setDiaryEntries(allEntries.sort((a, b) =>
                    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                ));
            } else {
                const selectedStudentRef = ref(db, `diary/${schoolCode}/${currentGrade}/${selectedStudent}`);
                const entriesSnapshot = await get(selectedStudentRef);

                if (entriesSnapshot.exists()) {
                    const entriesData = entriesSnapshot.val();
                    const entriesArray = Object.entries(entriesData)
                        .map(([id, data]: [string, any]) => ({
                            id,
                            ...data
                        }))
                        .filter(entry => {
                            const entryDate = new Date(entry.date);
                            const entryDateString = entryDate.toISOString();
                            return entryDateString >= startOfDay && entryDateString < endOfDay;
                        })
                        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                    setDiaryEntries(entriesArray);
                } else {
                    setDiaryEntries([]);
                }
            }
        } catch (error) {
            console.error('Error fetching diary entries:', error);
            Alert.alert('Error', 'Failed to fetch diary entries');
        }
    };

    const addDiaryEntry = async () => {
        try {
            if (!selectedStudent || !newEntry.trim() || !newTitle.trim()) {
                Alert.alert('Error', 'Please fill in both title and content');
                return;
            }

            const schoolCode = await AsyncStorage.getItem('schoolId');
            if (!schoolCode) {
                Alert.alert('Error', 'Authentication failed - please login again');
                return;
            }

            setSaving(true);
            const db = getDatabase();
            const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);

            const newEntryData = {
                content: newEntry.trim(),
                title: newTitle.trim(),
                date: selectedDate.toISOString(),
                author: "Teacher",
                submittedAt: new Date().toISOString()
            };

            if (selectedStudent === 'all') {
                // Handle batch updates for all students
                for (const student of students) {
                    try {
                        const studentDiaryRef = ref(db, `diary/${schoolCode}/${currentGrade}/${student.id}`);
                        // Push directly to each student's diary
                        await push(studentDiaryRef, newEntryData);
                    } catch (error) {
                        console.error(`Error adding entry for student ${student.id}:`, error);
                    }
                }
                Alert.alert('Success', 'Entry added to all students');
            } else {
                // Single student update
                const selectedStudentRef = ref(db, `diary/${schoolCode}/${currentGrade}/${selectedStudent}`);
                const selectedStudentSnapshot = await get(selectedStudentRef);

                if (!selectedStudentSnapshot.exists()) {
                    await set(selectedStudentRef, {});
                }

                const newEntryKey = push(selectedStudentRef).key;
                if (newEntryKey) {
                    await set(
                        ref(db, `diary/${schoolCode}/${currentGrade}/${selectedStudent}/${newEntryKey}`),
                        newEntryData
                    );
                }
                Alert.alert('Success', 'Entry added successfully');
            }

            setNewEntry('');
            setNewTitle('');
            setModalVisible(false);
            await fetchDiaryEntries(); // Refresh the entries list
        } catch (error) {
            console.error('Error adding diary entry:', error);
            Alert.alert('Error', 'Failed to add diary entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderDatePicker = () => (
        <View style={styles.datePickerContainer}>
            {/* Month picker on top */}
            <View style={styles.monthPickerWrapper}>
                <Picker
                    selectedValue={selectedMonth}
                    dropdownIconColor='white' 
                    onValueChange={(value) => setSelectedMonth(value)}
                    style={styles.monthPicker}>
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
    );


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3497A3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderDatePicker()}
            <View style={styles.splitContainer}>
                <ScrollView style={styles.studentList}>
                    <TouchableOpacity
                        style={[
                            styles.studentRow,
                            selectedStudent === 'all' && styles.selectedStudent,
                            styles.allStudentsRow
                        ]}
                        onPress={() => setSelectedStudent('all')}
                    >
                        <Text style={styles.studentName}>All Students</Text>
                    </TouchableOpacity>
                    {students.map((student) => (
                        <TouchableOpacity
                            key={student.id}
                            style={[
                                styles.studentRow,
                                selectedStudent === student.id && styles.selectedStudent
                            ]}
                            onPress={() => setSelectedStudent(student.id)}
                        >
                            <Text style={styles.studentName}>{student.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.diaryContainer}>
                    {selectedStudent ? (
                        <>
                            <View style={styles.diaryHeader}>
                                <Text style={styles.diaryHeaderText}>
                                    {selectedStudentName}'s Diary
                                </Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Text style={styles.addButtonText}>+ New Entry</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.entriesList}>
                                {diaryEntries.map((entry) => (
                                    <View key={entry.id} style={styles.entryCard}>
                                        {selectedStudent === 'all' && (
                                            <Text style={styles.entryStudent}>{entry.studentName}</Text>
                                        )}
                                        <Text style={styles.entryTitle}>{entry.title}</Text>
                                        <Text style={styles.entryDate}>
                                            {new Date(entry.date).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.entryContent}>{entry.content}</Text>
                                    </View>
                                ))}
                                {diaryEntries.length === 0 && (
                                    <Text style={styles.noEntriesText}>No diary entries yet</Text>
                                )}
                            </ScrollView>
                        </>
                    ) : (
                        <Text style={styles.selectStudentText}>Select a student to view their diary</Text>
                    )}
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Diary Entry</Text>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Entry Title"
                            placeholderTextColor="#666"
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Write your entry..."
                            placeholderTextColor="#666"
                            value={newEntry}
                            onChangeText={setNewEntry}
                            multiline
                            textAlignVertical="top"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewEntry('');
                                    setNewTitle('');
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={addDiaryEntry}
                            >
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3497A3'
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
        borderBottomWidth: 1,
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
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    noEntriesText: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 20,
    },
    selectStudentText: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 20,
    },
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3497A3',
},
    splitContainer: {
    flex: 1,
    flexDirection: 'row',
},
    studentList: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
},
    diaryContainer: {
    flex: 2,
    backgroundColor: '#3497A3',
},
    studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
},
    allStudentsRow: {
    backgroundColor: '#2a7a84',
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
},
    selectedStudent: {
    backgroundColor: '#2a7a84',
},
    studentName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
},
    diaryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
},
    diaryHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 10,
},
    addButton: {
    backgroundColor: '#2a7a84',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
},
    addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
},
    entriesList: {
    flex: 1,
    padding: 16,
},
    entryCard: {
    backgroundColor: '#2a7a84',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
},
    entryStudent: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 4,
},
    entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
},
    entryDate: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 8,
},
    entryContent: {
    color: '#FFFFFF',
    lineHeight: 20,
},
    modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
    modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
},
    modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
},
    titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    color: '#333',
},
    contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    minHeight: 120,
    color: '#333',
},
    modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
},
    modalButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
},
    cancelButton: {
    backgroundColor: '#999',
},
    saveButton: {
    backgroundColor: '#3497A3'
    },
    
});