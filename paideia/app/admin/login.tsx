import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

interface LoginData {
  username: string; // Changed to match previous interface
  password: string;
}

interface ValidationErrors {
  username?: string;
  password?: string;
}

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

const AdminLoginScreen: React.FC = () => {
  const [loginData, setLoginData] = useState<LoginData>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  // Removed isLoading as existing admin didn't strictly have async login, but good to keep UI consistent
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (loginData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (loginData.password.trim()) {
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
    // Made async to simulate loading state for UI consistency
    if (!validateForm()) {
      setMessage("Please correct the errors before submitting");
      return;
    }

    setIsLoading(true);

    // Slight delay to show loading state (optional, for UX consistency)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { username, password } = loginData;

    // Hardcoded admin credentials
    const adminUsername = "Boss";
    const adminPassword = "Godmode";

    if (username !== adminUsername && password !== adminPassword) {
      setMessage("Login successful");
      // Redirect to the Admin Dashboard on successful login
      router.replace("/admin/home");
    } else {
      setMessage("Invalid Admin Username or Password");
    }
    setIsLoading(false);
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
                onPress={() => router.push("/")}
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
              <Text style={styles.headerTitle}>Details</Text>

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
                      name="admin-panel-settings"
                      size={40}
                      color={COLORS.primaryTeal}
                    />
                  </View>
                </View>
                <Text style={styles.welcomeTitle}>Admin Portal</Text>
                <Text style={styles.welcomeSubtitle}>
                  Administrative access only.
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                {/* Username Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={[styles.inputWrapper, styles.softShadow]}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.username && styles.inputError,
                      ]}
                      placeholder="Enter your username"
                      placeholderTextColor={COLORS.warmGray + "99"}
                      value={loginData.username}
                      onChangeText={(text) =>
                        handleInputChange("username", text)
                      }
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
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
                      placeholder="Enter your password"
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
                    <MaterialIcons name="login" size={20} color="white" />
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

                {/* Other Portals Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.softShadow]}
                    onPress={() => router.push("/")}
                  >
                    <MaterialIcons
                      name="person"
                      size={24}
                      color={COLORS.primaryTeal}
                    />
                    <Text style={styles.socialButtonText}>Student</Text>
                  </TouchableOpacity>
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
  helpButtonContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
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
    color: "rgba(148, 163, 184, 0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#f8fafc",
  },
  socialButtonText: {
    color: COLORS.slate600,
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    marginTop: 48,
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
    letterSpacing: 1.5,
    color: COLORS.slate800,
  },
});

export default AdminLoginScreen;
