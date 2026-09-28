import { Platform } from "react-native";

let ws: WebSocket | null = null;

type MessageListener = (data: string) => void;

// Everything in the app that answers the test server registers here, not on
// the socket itself. The socket is created from `MainScreen`'s effect, but a
// screen can be rendered before that: expo-router's native tabs (expo-56+)
// render every tab at startup, so the buttons on `/explore` mount before the
// socket exists. On top of that, the React Compiler caches a `getWebSocket()`
// call made during render for the lifetime of the component - a button that
// first rendered with `null` kept `null` for good and never subscribed, which
// is why `getPosition:expo-second-view-button` went unanswered in the
// expo-56/57 nightlies. A registry that does not care whether the socket is
// there yet, subscribed to from an effect keyed on the button id, sidesteps
// both.
const listeners = new Set<MessageListener>();

// How long after the first listener attaches the frames that arrived before it
// are still replayed to newly attached listeners. Long enough to cover the
// mount that follows `onopen`, short enough that a component mounting later in
// the run - a button on a screen navigated to minutes in - is not handed a
// request nobody is waiting for any more.
const EARLY_FRAME_REPLAY_MS = 5000;

// The server starts asking as soon as its side of the handshake completes -
// the harness has been seen sending a request 8ms after connecting - while
// `AutomatedTests` only mounts once `onopen` has flipped `MainScreen`'s state.
// A frame from that window would reach nobody and, since neither side asks
// again, never be answered. So hold onto frames that arrive while nothing is
// listening and hand them to the listeners as they attach.
const earlyFrames: string[] = [];
let replayable = true;
let replayTimer: ReturnType<typeof setTimeout> | null = null;

function dispatch(data: string) {
  if (listeners.size === 0) {
    if (replayable) {
      earlyFrames.push(data);
    }
    return;
  }
  listeners.forEach((listener) => listener(data));
}

/**
 * Registers a listener for every frame the test server sends. Works before the
 * socket exists, and returns the function that removes the listener again.
 */
export function subscribeToServer(listener: MessageListener): () => void {
  listeners.add(listener);

  if (replayable) {
    // Someone is listening now, so later frames reach them on their own.
    if (replayTimer === null) {
      replayTimer = setTimeout(() => {
        replayable = false;
        earlyFrames.length = 0;
      }, EARLY_FRAME_REPLAY_MS);
    }
    // Every listener from this mount gets the whole backlog - which of them
    // answers which request is their business, and a frame is either in here
    // because nobody was listening, or was delivered live. Never both.
    earlyFrames.forEach((data) => listener(data));
  }

  return () => {
    listeners.delete(listener);
  };
}

/** Sends to the test server. A no-op until the socket exists. */
export function sendToServer(payload: object | string) {
  ws?.send(typeof payload === "string" ? payload : JSON.stringify(payload));
}

export function initWebSocket(
  onMessage?: (msg: string) => void,
  onOpen?: () => void
) {
  if (ws) return ws;

  const host = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const socket = new WebSocket(`ws://${host}:8080`);
  ws = socket;

  socket.onopen = () => {
    console.log("Connected to server");
    onOpen?.();
  };

  socket.addEventListener("message", (e) => {
    console.log("server message", e.data);
    onMessage?.(e.data);
    dispatch(e.data);
  });

  return ws;
}

export function getWebSocket() {
  return ws;
}
