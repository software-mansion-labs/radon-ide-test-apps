import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*
          Full-screen rather than a sheet: the automated tests locate buttons
          with `measureInWindow`, which Fabric answers from the shadow tree. A
          sheet is offset from the top of the screen natively by UIKit, and
          react-native-screens does not feed that offset back into the shadow
          tree for a native modal, so inside a sheet every reported position is
          too high by the sheet's inset and the harness taps above the button.
          The other Expo apps present it full-screen too.
        */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "fullScreenModal", title: "Modal" }}
        />
      </Stack>
      <AnimatedSplashOverlay />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
