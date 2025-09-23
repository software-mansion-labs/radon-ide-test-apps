import { StyleSheet, View } from "react-native";
import TrackableButton from "@/shared/TrackableButton";
import { useRouter } from "expo-router";

export default function ModalScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TrackableButton
        id="modal-button"
        title="Modal Button"
        onPress={() => {
          console.log("modal-button");
        }}
      />
      <TrackableButton
        id="modal-return-to-home"
        title="Return to Home"
        onPress={() => {
          router.back();
          console.log("modal-return-to-home");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
