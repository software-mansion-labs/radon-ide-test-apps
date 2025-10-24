import { StyleSheet, View } from "react-native";

import TrackableButton from "@/shared/TrackableButton";
import { useScheme } from "@/shared/Colors";
import { useRouter } from "expo-router";

export default function SecondView() {
  const styles = useStyle();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TrackableButton
        id="expo-second-view-button"
        title="Expo second view button"
        onPress={() => {
          console.log("expo-second-view-button");
        }}
      />
      <TrackableButton
        id="not-found-button"
        title="Not Existing Route"
        onPress={() => {
          console.log("not-found-button");
          router.push("/notExisting");
        }}
      />
      <TrackableButton
        id="show-modal-button"
        title="Show Modal"
        onPress={() => {
          console.log("show-modal-button");
          router.push("/modal");
        }}
      />
      <TrackableButton
        id="return-to-home-button"
        title="Return to Home"
        onPress={() => {
          console.log("return-to-home-button");
          router.push("/");
        }}
      />
    </View>
  );
}

function useStyle() {
  const { gap, colors } = useScheme();
  return StyleSheet.create({
    container: {
      display: "flex",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 20,
      backgroundColor: colors.background,
    },
  });
}
