import { useRef, useEffect } from "react";
import {
  View,
  Button,
  Dimensions,
  Pressable,
  Text,
  StyleSheet,
  StatusBar,
} from "react-native";
import { getWebSocket } from "./websocket";

const { width: phoneWidth, height: phoneHeight } = Dimensions.get("window");

type TrackableButtonProps = {
  id: string;
  title: string;
  onPress?: (id: string) => void;
};

const TrackableButton = ({ id, title, onPress }: TrackableButtonProps) => {
  const ref = useRef<View>(null);
  const ws = getWebSocket();

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
      } else if (message.message === `click:${id}`) {
        onPress?.(id);
        ws?.send(`{"action":"${id}"}`);
      }
    });
  }, [ws]);

  return (
    <Pressable
      style={styles.button}
      ref={ref}
      onPress={() => {
        ws?.send(`{"action":"${id}"}`);
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
