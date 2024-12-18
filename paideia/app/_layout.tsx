import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';



import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
    
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false,
            // Prevent going back to auth screens
            gestureEnabled: false
          }}
        />

        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
            // Prevent going back to auth screens
            gestureEnabled: false
          }}
        />


        <Stack.Screen
          name="institution"
          options={{
            headerShown: false,
            // Prevent going back to auth screens
            gestureEnabled: false
          }}
        />

    



      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
