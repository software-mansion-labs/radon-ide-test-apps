import { Platform } from "react-native";

let ws: WebSocket | null = null;

export function initWebSocket(
  onMessage?: (msg: string) => void,
  onOpen?: () => void
) {
  if (ws) return ws;

  const host = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  ws = new WebSocket(`ws://${host}:8080`);

  ws.onopen = () => {
    console.log("Connected to server");
    onOpen?.();
  };

  ws.addEventListener("message", (e) => {
    console.log("server message", e.data);
    onMessage?.(e.data);
  });

  return ws;
}

export function getWebSocket() {
  return ws;
}
