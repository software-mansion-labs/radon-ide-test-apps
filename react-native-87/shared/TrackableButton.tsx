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
  const ws = getWebSocket();

  /**
   * Reports the button's position normalized to the full device screen (what
   * Radon streams).
   *
   * `measureInWindow` is relative to the app window, and on Android where that
   * window starts depends on the edge-to-edge regime React Native has decided
   * on (`isEdgeToEdgeFeatureFlagOn` in `RootViewUtil`/`DeviceInfoModule`):
   *  - legacy (API < 35, or an app that opted out): the window is the content
   *    area below the status bar, so the status-bar height has to be added back;
   *  - edge-to-edge (enforced from API 35 / targetSdk 35, and on every API 36+
   *    device): the window is the whole screen and `y` is already screen-relative,
   *    so adding the status bar would push every button down by one bar height.
   *
   * React Native gates `Dimensions.get("window")` on the same flag: in the
   * legacy regime the window height excludes the system bars, in edge-to-edge
   * it equals the screen height. That difference is therefore the signal for
   * which of the two `measureInWindow` origins is in effect. On iOS
   * `StatusBar.currentHeight` is undefined and the term is 0 either way.
   */
  const measure = (cb: (position: ButtonPosition) => void) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      // Read per call so rotation is picked up.
      const screen = Dimensions.get("screen");
      const window = Dimensions.get("window");
      const statusBarHeight = StatusBar.currentHeight ?? 0;

      // The window is shorter than the screen by (at least) the status bar only
      // when it starts below it. One pixel of slack for dp rounding.
      const windowExcludesStatusBar =
        screen.height - window.height >= statusBarHeight - 1;
      const topInset =
        statusBarHeight > 0 && windowExcludesStatusBar ? statusBarHeight : 0;

      cb({
        id,
        x: x / screen.width,
        y: (y + topInset) / screen.height,
        width: width / screen.width,
        height: height / screen.height,
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
