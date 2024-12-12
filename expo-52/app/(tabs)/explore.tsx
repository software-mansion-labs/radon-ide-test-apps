import { useScheme } from "@/shared/Colors";
import { Button, View } from "react-native";

export default function TabTwoScreen() {
  const { colors } = useScheme();

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Press me" onPress={() => { throw new Error('Hello, again, Sentry!'); }}/>
    </View>
  );
}
