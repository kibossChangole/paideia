import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { database } from "./firebaseConfig";
import { ref, get } from "firebase/database";
import { useRouter, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

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

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

type LoginData = {
  studentID: string;
  password: string;
};

type ValidationErrors = Partial<Record<keyof LoginData, string>>;

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({
    studentID: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Hide the native splash screen when the component mounts
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    };
    hideSplash();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!loginData.studentID.trim()) {
      newErrors.studentID = "Student ID is required";
    }

    if (!loginData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage("Please correct the errors before submitting");
      return;
    }

    setIsLoading(true);
    const { studentID, password } = loginData;

    try {
      const studentsRef = ref(database, "students");
      const snapshot = await get(studentsRef);

      if (snapshot.exists()) {
        const studentsData = snapshot.val();
        const student = Object.values(studentsData).find(
          (student: any) => student.id === studentID
        );

        if (student) {
          // Verify password (in a real app, use hashing!)
          // For now assuming direct match or successful find implies auth if password logic was here
          // The original code didn't check password field against DB, assuming it's done here implicitly or just ID check?
          // Adding basic check if field exists in student data, otherwise trusting flow.
          // Re-reading original code: it found student by ID but didn't check password?
          // I will implement a check if password matches student.password if available,
          // otherwise if original code was just ID lookup, I'll stick to that but it's insecure.
          // Looking at original snippet: `const student = Object.values(studentsData).find((s) => s.id === studentID);`
          // It seems it only checked for existence of student ID. I will PROCEED with this for now as per "preserve logic" request,
          // but I seriously recommend adding password check.

          await AsyncStorage.setItem("studentId", studentID);
          await AsyncStorage.setItem("studentData", JSON.stringify(student));
          setMessage("Login successful");
          router.push("/dashboard/home");
        } else {
          setMessage("Invalid Student ID or Password");
        }
      } else {
        setMessage("No student data found");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Error during login. Please try again later.");
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
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>Paideia</Text>
              <View style={styles.helpButtonContainer}>
                <TouchableOpacity>
                  <MaterialIcons
                    name="help-outline"
                    size={24}
                    color={COLORS.warmGray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mainContent}>
              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <View style={styles.iconContainerOuter}>
                  <View style={styles.iconContainerInner}>
                    <MaterialIcons
                      name="face"
                      size={40}
                      color={COLORS.primaryTeal}
                    />
                  </View>
                </View>
                <Text style={styles.welcomeTitle}>Hello there!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Ready for another great day of learning?
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.studentID && styles.inputError,
                      ]}
                      placeholder="name@school.edu"
                      placeholderTextColor={COLORS.warmGray + "99"} // 60% opacity roughly
                      value={loginData.studentID}
                      onChangeText={(text) =>
                        handleInputChange("studentID", text)
                      }
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.studentID && (
                    <Text style={styles.errorText}>{errors.studentID}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity>
                      <Text style={styles.forgotText}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.softShadow,
                      styles.passwordWrapperGroup,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        },
                      ]}
                      placeholder="Your password"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      secureTextEntry={!showPassword}
                      value={loginData.password}
                      onChangeText={(text) =>
                        handleInputChange("password", text)
                      }
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconContainer}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility" : "visibility"}
                        size={20}
                        color={COLORS.warmGray}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Submit Button */}
                <View style={{ paddingTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.signInButton, isLoading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.signInButtonText}>Sign In</Text>
                    <MaterialIcons name="favorite" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {message ? (
                  <Text
                    style={[
                      styles.messageText,
                      message.includes("successful")
                        ? { color: "#10b981" }
                        : { color: COLORS.error },
                    ]}
                  >
                    {message}
                  </Text>
                ) : null}

                {/* Quick Access */}
                <View style={styles.separatorContainer}>
                  <View style={styles.separator} />
                  <Text style={styles.separatorText}>QUICK ACCESS</Text>
                  <View style={styles.separator} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.softShadow]}
                    onPress={() => router.push("/school")}
                  >
                    <MaterialIcons
                      name="school"
                      size={24}
                      color={COLORS.primaryTeal}
                    />
                    <Text style={styles.socialButtonText}>Institution</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.softShadow]}
                    onPress={() => router.push("/admin")}
                  >
                    <MaterialIcons
                      name="admin-panel-settings"
                      size={24}
                      color={COLORS.slate800}
                    />
                    <Text style={styles.socialButtonText}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Need a hand?{" "}
                  <Text style={styles.footerLink}>Ask for help</Text>
                </Text>
                <View style={styles.securityBadge}>
                  <MaterialIcons
                    name="shield"
                    size={12}
                    color={COLORS.slate800}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={styles.securityText}>
                    YOUR DATA IS SAFE WITH US
                  </Text>
                </View>
              </View>

              {/* Bottom Spacer */}
              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
    backgroundColor: "rgba(253, 224, 71, 0.2)", // accent-yellow 0.2
    // Radial gradient workaround by just using solid with opacity for now, or could use an image
  },
  tealBlob: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: 256,
    height: 256,
    borderRadius: 999,
    backgroundColor: "rgba(20, 184, 166, 0.05)", // primary-teal 0.05
  },
  fullScreenAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#3497A3",
  },
  splashContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: {
    width: "100%",
    height: "100%",
  },
  splashtext: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    textAlign: "center",
    fontSize: 22,
    color: COLORS.white,
    ...Platform.select({
      ios: { fontWeight: "300" },
      android: { fontFamily: "sans-serif-light" },
    }),
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
  helpButtonContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
    maxWidth: 480, // max-w-md
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
    backgroundColor: "rgba(253, 224, 71, 0.3)", // bg-accent-yellow/30
    borderRadius: 40, // rounded-[2.5rem]
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "3deg" }],
  },
  iconContainerInner: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.white,
    borderRadius: 24, // rounded-3xl
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
    fontSize: 30, // text-3xl
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
    gap: 20, // space-y-5
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
    borderRadius: 16, // rounded-2xl
    height: 56, // h-14
  },
  softShadow: {
    shadowColor: "rgba(20, 184, 166, 0.1)", // shadow-color from CSS
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 3, // Approximation for Android
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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  forgotText: {
    color: COLORS.primaryTeal,
    fontSize: 14,
    fontWeight: "500",
  },
  passwordWrapperGroup: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  eyeIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  signInButton: {
    width: "100%",
    backgroundColor: COLORS.primaryTeal,
    height: 64, // py-4 approx matches h-16/14? CSS says py-4 -> 1rem top/bottom + text. h-14 is 56px usually. CSS button doesn't have fixed height but padded. Let's use 56px-60px fixed
    borderRadius: 16, // rounded-2xl
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLORS.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // shadow-lg shadow-teal-500/20
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  messageText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.slate100,
  },
  separatorText: {
    color: "rgba(148, 163, 184, 0.6)", // warm-gray/60
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2, // tracking-[0.2em]
    textTransform: "uppercase",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56, // h-14
    borderRadius: 16, // rounded-2xl
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#f8fafc", // border-slate-50
  },
  socialButtonText: {
    color: COLORS.slate600,
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    marginTop: 48, // mt-auto pt-12 (approximating spacing)
    alignItems: "center",
  },
  footerText: {
    color: COLORS.warmGray,
    fontSize: 14,
    textAlign: "center",
  },
  footerLink: {
    color: COLORS.primaryTeal,
    fontWeight: "700",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    opacity: 0.3,
  },
  securityText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5, // tracking-widest
    color: COLORS.slate800,
  },
});
