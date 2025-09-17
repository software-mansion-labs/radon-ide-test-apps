import { useRef, useEffect } from "react";
import {
  View,
  Button,
  Dimensions,
  Pressable,
  Text,
  StyleSheet,
} from "react-native";
import { StatusBar } from "react-native";
import { Platform } from "react-native";

const { width: phoneWidth, height: phoneHeight } = Dimensions.get("window");

type TrackableButtonProps = {
  id: string;
  title: string;
  onPress?: (id: string) => void;
  ws: any;
};

const TrackableButton = ({ id, title, onPress, ws }: TrackableButtonProps) => {
  const ref = useRef<View>(null);

  const measure = (cb: (data: any) => void) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      cb({
        id,
        x: x / phoneWidth,
        y: (y + (StatusBar.currentHeight ?? 0)) / phoneHeight,
        width: width / phoneWidth,
        height: height / phoneHeight,
      });
    });
  };

  useEffect(() => {
    if (!ws) return;
    ws.addEventListener("message", (e: any) => {
      const message = JSON.parse(e.data);
      if (message.message === `getPosition:${id}`) {
        measure((pos) => {
          ws.send(JSON.stringify({ position: pos, id: message.id }));
        });
      }
    });
  }, [ws]);

  return (
    <Pressable
      style={styles.button}
      ref={ref}
      onPress={() => {
        ws.send(`{"action":"${id}"}`);
        onPress?.(id);
      }}
    >
      <Text>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: "#5bf",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TrackableButton;
