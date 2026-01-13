import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { database } from "./firebaseConfig";
import { ref, get, set } from "firebase/database";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const COLORS = {
  primaryTeal: "#14b8a6",
  accentYellow: "#fde047",
  softBg: "#fcfcfd",
  warmGray: "#94a3b8",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate600: "#475569",
  slate100: "#f1f5f9",
  white: "#ffffff",
  error: "#ef4444",
};

interface School {
  name: string;
  schoolCode: string;
  region: string;
}

type FormData = {
  name: string;
  dob: string;
  guardianName: string;
  guardianContact: string;
  region: string;
  schoolCode: string;
  documentation: string | null;
  feeStructure: number;
  password: string;
};

type ValidationErrors = Partial<Record<keyof FormData, string>>;

const SchoolDropdown: React.FC<{
  onSelect: (schoolCode: string, region: string) => void;
  error?: string;
}> = ({ onSelect, error }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsRef = ref(database, "schools");
        const snapshot = await get(schoolsRef);

        if (snapshot.exists()) {
          const schoolsData = Object.values(snapshot.val()).map(
            (school: any) => ({
              name: school.name,
              schoolCode: school.schoolCode,
              region: school.region,
            })
          );
          setSchools(schoolsData);
          setFilteredSchools(schoolsData);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  React.useEffect(() => {
    if (searchQuery) {
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.schoolCode.includes(searchQuery)
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
  }, [searchQuery, schools]);

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setSearchQuery(school.name);
    setIsDropdownVisible(false);
    onSelect(school.schoolCode, school.region);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>School</Text>
      <View style={[styles.dropdownContainer, { zIndex: 1000 }]}>
        <View
          style={[
            styles.inputWrapper,
            styles.softShadow,
            error && styles.inputError,
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Search for school..."
            placeholderTextColor={COLORS.warmGray + "99"}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsDropdownVisible(true);
            }}
            onFocus={() => setIsDropdownVisible(true)}
          />
          <MaterialIcons
            name="search"
            size={24}
            color={COLORS.warmGray}
            style={{ marginRight: 16 }}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {isDropdownVisible && (
          <View style={[styles.dropdownListContainer, styles.softShadow]}>
            {loading ? (
              <Text style={styles.dropdownText}>Loading schools...</Text>
            ) : filteredSchools.length > 0 ? (
              <ScrollView
                style={styles.dropdownList}
                nestedScrollEnabled={true}
              >
                {filteredSchools.map((item) => (
                  <TouchableOpacity
                    key={item.schoolCode}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectSchool(item)}
                  >
                    <Text style={styles.schoolName}>{item.name}</Text>
                    <Text style={styles.schoolCode}>
                      Code: {item.schoolCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.dropdownText}>No schools found</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const RegistrationScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    dob: "",
    guardianName: "",
    guardianContact: "",
    region: "",
    schoolCode: "",
    documentation: null,
    feeStructure: 0,
    password: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.guardianName.trim())
      newErrors.guardianName = "Guardian name is required";

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dob)) {
      newErrors.dob = "Invalid date format (YYYY-MM-DD)";
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.guardianContact)) {
      newErrors.guardianContact = "Invalid phone number";
    }

    if (!formData.schoolCode) {
      newErrors.schoolCode = "Please select a school";
    }

    if (!formData.region) {
      newErrors.region = "Region is required";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateStudentID = (): string => {
    const currentYear = new Date().getFullYear();
    const sequentialNumber = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${formData.region}${formData.schoolCode}${currentYear}${sequentialNumber}`;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSchoolSelect = (schoolCode: string, region: string) => {
    setFormData((prev) => ({
      ...prev,
      schoolCode: schoolCode,
      region: region,
    }));
    if (errors.schoolCode || errors.region) {
      setErrors((prev) => ({
        ...prev,
        schoolCode: undefined,
        region: undefined,
      }));
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFormData((prev) => ({
          ...prev,
          documentation: result.assets[0].uri,
        }));
        setMessage("Document uploaded successfully");
      }
    } catch (error) {
      setMessage("Error uploading document");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage("Please correct the errors before submitting");
      return;
    }

    if (!formData.documentation) {
      setMessage("Please upload required documentation");
      return;
    }

    setIsLoading(true);

    const studentID = generateStudentID();

    // Check if ID already exists
    const existingRef = ref(database, `students/${studentID}`);
    const snapshot = await get(existingRef);

    if (snapshot.exists()) {
      setMessage("Error: Generated ID already exists. Please try again.");
      setIsLoading(false);
      return;
    }

    const initialFeeStructure = 5000;

    const registrationData = {
      ...formData,
      id: studentID,
      feeStructure: initialFeeStructure,
      submittedAt: new Date().toISOString(),
    };

    try {
      const studentRef = ref(database, `students/${studentID}`);
      await set(studentRef, registrationData);
      setMessage(`Registration successful! Student ID: ${studentID}`);

      // Reset form after successful submission
      setFormData({
        name: "",
        dob: "",
        guardianName: "",
        guardianContact: "",
        region: "",
        schoolCode: "",
        documentation: null,
        feeStructure: 0,
        password: "",
      });
      setTimeout(() => {
        router.push("/"); // Navigate to login
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage("Error registering student. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.softBg} />

      {/* Background Blobs */}
      <View style={styles.blobContainer}>
        <View style={styles.sunnyBlob} />
        <View style={styles.tealBlob} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={20}
                  color={COLORS.primaryTeal}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Registration</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.mainContent}>
              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <View style={styles.iconContainerOuter}>
                  <View style={styles.iconContainerInner}>
                    <MaterialIcons
                      name="person-add"
                      size={40}
                      color={COLORS.primaryTeal}
                    />
                  </View>
                </View>
                <Text style={styles.welcomeTitle}>Create Account</Text>
                <Text style={styles.welcomeSubtitle}>Join Paideia today!</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Student Name</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder="Full Name"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={formData.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                    />
                  </View>
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* DOB Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[styles.input, errors.dob && styles.inputError]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={formData.dob}
                      onChangeText={(text) => handleInputChange("dob", text)}
                    />
                  </View>
                  {errors.dob && (
                    <Text style={styles.errorText}>{errors.dob}</Text>
                  )}
                </View>

                {/* Guardian Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Guardian Name</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.guardianName && styles.inputError,
                      ]}
                      placeholder="Guardian's Full Name"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={formData.guardianName}
                      onChangeText={(text) =>
                        handleInputChange("guardianName", text)
                      }
                    />
                  </View>
                  {errors.guardianName && (
                    <Text style={styles.errorText}>{errors.guardianName}</Text>
                  )}
                </View>

                {/* Guardian Contact */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Guardian Contact</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.guardianContact && styles.inputError,
                      ]}
                      placeholder="+1 234 567 8900"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={formData.guardianContact}
                      onChangeText={(text) =>
                        handleInputChange("guardianContact", text)
                      }
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.guardianContact && (
                    <Text style={styles.errorText}>
                      {errors.guardianContact}
                    </Text>
                  )}
                </View>

                {/* School Dropdown */}
                <SchoolDropdown
                  onSelect={handleSchoolSelect}
                  error={errors.schoolCode}
                />

                {/* Region Input (Read Only) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Region</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.softShadow,
                      { backgroundColor: COLORS.slate100 },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: COLORS.slate600 }]}
                      placeholder="Region"
                      value={formData.region}
                      editable={false}
                    />
                  </View>
                  {errors.region && (
                    <Text style={styles.errorText}>{errors.region}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Create Password</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={formData.password}
                      onChangeText={(text) =>
                        handleInputChange("password", text)
                      }
                      secureTextEntry={true}
                    />
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Upload Button */}
                <View style={{ paddingTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.softShadow]}
                    onPress={handleUpload}
                  >
                    <MaterialIcons
                      name="cloud-upload"
                      size={24}
                      color={COLORS.primaryTeal}
                    />
                    <Text style={styles.secondaryButtonText}>
                      {formData.documentation
                        ? "Document Uploaded"
                        : "Upload Documentation"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <View style={{ paddingTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.signInButton, isLoading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.signInButtonText}>
                      {isLoading ? "Registering..." : "Complete Registration"}
                    </Text>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                {message ? (
                  <View
                    style={[
                      styles.messageContainer,
                      message.includes("successful")
                        ? styles.successMessage
                        : styles.errorMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.includes("successful")
                          ? { color: "#155724" }
                          : { color: "#721c24" },
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                ) : null}

                {/* Bottom Spacer for Tab Bar */}
                <View style={{ height: 100 }} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.softBg,
    position: "relative",
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: "hidden",
  },
  sunnyBlob: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 256,
    height: 256,
    borderRadius: 999,
    backgroundColor: "rgba(253, 224, 71, 0.2)",
  },
  tealBlob: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: 256,
    height: 256,
    borderRadius: 999,
    backgroundColor: "rgba(20, 184, 166, 0.05)",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primaryTeal,
    letterSpacing: -0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  welcomeSection: {
    marginBottom: 40,
    alignItems: "center",
  },
  iconContainerOuter: {
    width: 96,
    height: 96,
    backgroundColor: "rgba(253, 224, 71, 0.3)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "3deg" }],
  },
  iconContainerInner: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-3deg" }],
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeTitle: {
    color: COLORS.slate800,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    color: COLORS.warmGray,
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    width: "100%",
  },
  inputLabel: {
    color: COLORS.slate600,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  softShadow: {
    shadowColor: "rgba(20, 184, 166, 0.1)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.slate900,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signInButton: {
    width: "100%",
    backgroundColor: COLORS.primaryTeal,
    height: 60,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLORS.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#f8fafc",
  },
  secondaryButtonText: {
    color: COLORS.primaryTeal,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdownListContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: 200,
    zIndex: 2000, // Higher than other elements
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  schoolName: {
    color: COLORS.slate800,
    fontWeight: "600",
    fontSize: 14,
  },
  schoolCode: {
    color: COLORS.warmGray,
    fontSize: 12,
    marginTop: 2,
  },
  dropdownText: {
    padding: 16,
    color: COLORS.warmGray,
    textAlign: "center",
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  messageText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  successMessage: {
    backgroundColor: "#d4edda",
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
  },
});

export default RegistrationScreen;
