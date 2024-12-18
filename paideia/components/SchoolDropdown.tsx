import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { database } from './firebaseConfig';
import { ref, get } from 'firebase/database';

interface School {
    name: string;
    schoolCode: string;
    region: string;
}

interface SchoolDropdownProps {
    onSelect: (schoolCode: string, region: string) => void;
    error?: string;
}

const SchoolDropdown: React.FC<SchoolDropdownProps> = ({ onSelect, error }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [schools, setSchools] = useState<School[]>([]);
    const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const schoolsRef = ref(database, 'schools');
                const snapshot = await get(schoolsRef);

                if (snapshot.exists()) {
                    const schoolsData = Object.values(snapshot.val()).map((school: any) => ({
                        name: school.name,
                        schoolCode: school.schoolCode,
                        region: school.region
                    }));
                    setSchools(schoolsData);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching schools:', error);
                setLoading(false);
            }
        };

        fetchSchools();
    }, []);

    useEffect(() => {
        const filtered = schools.filter(school =>
            school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            school.schoolCode.includes(searchQuery)
        );
        setFilteredSchools(filtered);
    }, [searchQuery, schools]);

    const handleSelectSchool = (school: School) => {
        setSelectedSchool(school);
        setSearchQuery(school.name);
        setIsDropdownVisible(false);
        onSelect(school.schoolCode, school.region);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Search for school..."
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    setIsDropdownVisible(true);
                }}
                onFocus={() => setIsDropdownVisible(true)}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isDropdownVisible && searchQuery.length > 0 && (
                <View style={styles.dropdownContainer}>
                    {loading ? (
                        <Text style={styles.dropdownText}>Loading schools...</Text>
                    ) : filteredSchools.length > 0 ? (
                        <FlatList
                            data={filteredSchools}
                            keyExtractor={(item) => item.schoolCode}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => handleSelectSchool(item)}
                                >
                                    <Text style={styles.schoolName}>{item.name}</Text>
                                    <Text style={styles.schoolCode}>Code: {item.schoolCode}</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.dropdownList}
                            nestedScrollEnabled={true}
                        />
                    ) : (
                        <Text style={styles.dropdownText}>No schools found</Text>
                    )}
                </View>
            )}

            {selectedSchool && !isDropdownVisible && (
                <View style={styles.selectedSchoolContainer}>
                    <Text style={styles.selectedSchoolText}>
                        Selected: {selectedSchool.name} (Code: {selectedSchool.schoolCode})
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fafafa',
    },
    inputError: {
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    dropdownContainer: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#fff',
        marginTop: 5,
    },
    dropdownList: {
        maxHeight: 200,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownText: {
        padding: 10,
        color: '#666',
    },
    schoolName: {
        fontSize: 14,
        fontWeight: '500',
    },
    schoolCode: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    selectedSchoolContainer: {
        marginTop: 5,
        padding: 5,
    },
    selectedSchoolText: {
        fontSize: 12,
        color: '#666',
    },
});

export default SchoolDropdown;