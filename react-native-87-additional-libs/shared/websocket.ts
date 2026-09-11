import { Platform } from "react-native";

let ws: WebSocket | null = null;

// How long after the connection opens a newly attached "message" listener is
// still given the frames that arrived before it existed. Long enough to cover
// the mount that follows `onopen`, short enough that a component mounting later
// in the run - a button on a screen navigated to minutes in - is not handed a
// request nobody is waiting for any more.
const EARLY_FRAME_REPLAY_MS = 5000;

export function initWebSocket(
  onMessage?: (msg: string) => void,
  onOpen?: () => void
) {
  if (ws) return ws;

  const host = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const socket = new WebSocket(`ws://${host}:8080`);
  ws = socket;

  // Nothing here answers the test server's requests: `AutomatedTests` and each
  // `TrackableButton` do, and they attach their listeners from effects, which
  // run only once `onopen` has flipped `MainScreen`'s state and React has
  // re-rendered. The server, meanwhile, starts asking as soon as its side of
  // the handshake completes - the harness has been seen sending a request 8ms
  // after connecting. A frame arriving in that window reached only the logging
  // listener below and was answered by nobody, and since neither side asks
  // again, its reply never came at all.
  //
  // So hold onto those frames and hand them to the listeners as they arrive.
  const earlyFrames: string[] = [];
  let buffering = true;
  let replayable = true;

  const attach = socket.addEventListener.bind(socket);

  socket.addEventListener = ((type: string, listener: any, ...rest: any[]) => {
    attach(type as any, listener, ...rest);

    if (type !== "message" || !replayable) return;

    // Someone is listening now, so later frames reach them on their own.
    if (buffering) {
      buffering = false;
      setTimeout(() => {
        replayable = false;
        earlyFrames.length = 0;
      }, EARLY_FRAME_REPLAY_MS);
    }

    // Every listener from this mount gets the whole backlog - which of them
    // answers which request is their business, and a frame is either in here
    // because nobody was listening, or was delivered live. Never both.
    earlyFrames.forEach((data) => listener({ data }));
  }) as typeof socket.addEventListener;

  socket.onopen = () => {
    console.log("Connected to server");
    onOpen?.();
  };

  attach("message", (e) => {
    console.log("server message", e.data);
    onMessage?.(e.data);
    if (buffering) {
      earlyFrames.push(e.data);
    }
  });

  return ws;
}

export function getWebSocket() {
  return ws;
}
