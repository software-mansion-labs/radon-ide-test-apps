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
import { sendToServer, subscribeToServer } from "./websocket";

type TrackableButtonProps = {
  id: string;
  title: string;
  onPress?: (id: string) => void;
};

type ButtonPosition = {
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
};

const TrackableButton = ({ id, title, onPress }: TrackableButtonProps) => {
  const ref = useRef<View>(null);
  // Read at call time so the listener below - registered once per id - always
  // invokes the handler from the latest render.
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const press = () => {
    sendToServer({ action: id });
    onPressRef.current?.(id);
  };

  /**
   * Reports the button's position normalized to the full device screen (what
   * Radon streams). On Android `measureInWindow` is relative to the *visible*
   * window frame, which starts below the status bar even when the app draws
   * edge-to-edge - so the status-bar height is always added back. On iOS
   * `StatusBar.currentHeight` is undefined and the term is 0.
   */
  const measure = (cb: (position: ButtonPosition) => void) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      // Read per call so rotation is picked up.
      const screen = Dimensions.get("screen");
      const topInset = StatusBar.currentHeight ?? 0;

      cb({
        id,
        x: x / screen.width,
        y: (y + topInset) / screen.height,
        width: width / screen.width,
        height: height / screen.height,
      });
    });
  };

  // Subscribed for as long as the button is mounted, whether or not the socket
  // exists yet - see `subscribeToServer`. Unsubscribing on unmount keeps a
  // button from a screen that was navigated away from out of the answer.
  useEffect(() => {
    return subscribeToServer((data) => {
      const message = JSON.parse(data);
      if (message.message === `getPosition:${id}`) {
        measure((pos) => {
          sendToServer({ position: pos, id: message.id });
        });
      } else if (message.message === `click:${id}`) {
        press();
      }
    });
  }, [id]);

  return (
    <Pressable style={styles.button} ref={ref} onPress={press}>
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
