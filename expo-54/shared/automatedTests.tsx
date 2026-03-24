import React from "react";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Appearance,
  AppState,
  Dimensions,
  PixelRatio,
  Platform
} from "react-native";

import { preview } from "radon-ide";
import { Button } from "./Button";
import { useScheme } from "./Colors";
import TrackableButton from "./TrackableButton";
import { getWebSocket } from "./websocket";
import router from "./ExpoRouter";
import appConfig from "../app.json";
import { applyPolyfills, restoreOriginalGlobals } from "./polyfill";

const appName = appConfig.name ? appConfig.name : appConfig.expo.name;
const isIOS = Platform.OS === "ios";
const PLATFORM_LOCALHOST = isIOS ? "localhost" : "10.0.2.2";
const BASE_URL = `http://${PLATFORM_LOCALHOST}:8080/api`;

preview(
  <TrackableButton
    id="preview-button"
    title="Preview Button"
    onPress={printLogs}
  />
);

function breakpointStepInto(a: number, b: number) {
  const result = a * b; // STEP INTO LINE
  return result; // BREAKPOINT 4
}

function breakpointTests() {
  console.log("Session started"); // BREAKPOINT 1
  const product = breakpointStepInto(6, 6); // STEP OUT LINE
  const items = ["A", "B", "C"]; // LINE AFTER FUNCTION
  React.Children.count(items); // BREAKPOINT 2
  for (let i = 0; i < items.length; i++) {
    console.log("Processing item:", items[i]); // BREAKPOINT 3
  }
  console.log("Session ended");
}

async function printLogs() {
  // put breakpoint on the next line
  const text = "console.log()";
  console.log(text);
}

function getColorScheme() {
  return Appearance.getColorScheme();
}

function getOrientation() {
  const { width, height } = Dimensions.get("window");
  return width > height ? "landscape" : "portrait";
}

function getFontSize() {
  return PixelRatio.getFontScale();
}

function getAppState() {
  return AppState.currentState;
}

function getAppName() {
  return appName;
}

export function AutomatedTests() {
  const style = useStyle();
  const [elementVisible, setElementVisible] = useState(true);
  const ws = getWebSocket();

  const prepareRequestOptions = ({
    method = "GET",
    headers = {},
    body,
    multipart
  }: any) => {
    let requestBody;
    let requestHeaders = { ...headers };

    if (multipart) {
      if (body instanceof FormData) {
        requestBody = body;
      } else {
        const formData = new FormData();
        Object.keys(body).forEach((key) => {
          const value = body[key];

          if (value && typeof value === "object" && value._is_file) {
            formData.append(key, {
              uri: value.uri,
              type: value.type,
              name: value.name
            } as any);
          } else {
            formData.append(key, value);
          }
        });
        requestBody = formData;
      }
      delete requestHeaders["Content-Type"];
    } else if (typeof body === "string") {
      requestBody = body;
      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      }
    } else if (body) {
      requestBody = JSON.stringify(body);
      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }
    }

    return {
      method,
      headers: requestHeaders,
      body: requestBody
    };
  };

  const handlePolyfillTest = async (payload: any) => {
    await applyPolyfills();

    const { type, url } = payload;

    if (!url) {
      console.error("URL is required for polyfill tests");
      restoreOriginalGlobals();
      return;
    }

    const fetchOptions = prepareRequestOptions(payload);

    try {
      switch (type) {
        case "stream-complete": {
          const res = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore
            reactNative: { textStreaming: true }
          });

          const stream = res.body;
          if (!stream) throw new Error("No stream found");

          const reader = stream.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            decoder.decode(value, { stream: true });
          }
          console.log("test");
          break;
        }

        case "stream-cancel": {
          const res = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore
            reactNative: { textStreaming: true }
          });

          const stream = res.body;
          if (!stream) throw new Error("No stream found");

          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let chunks = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks++;
            decoder.decode(value, { stream: true });

            if (chunks >= 3) {
              await reader.cancel("Test cancelled stream");
              break;
            }
          }
          break;
        }

        case "stream-abandon": {
          const res = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore
            reactNative: { textStreaming: true }
          });

          const stream = res.body;
          if (!stream) throw new Error("No stream found");

          const reader = stream.getReader();
          let chunks = 0;

          while (true) {
            const { done } = await reader.read();
            if (done) break;
            chunks++;
            if (chunks >= 2) {
              break;
            }
          }
          break;
        }

        case "stream-fallback": {
          const res = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore
            reactNative: { textStreaming: true }
          });
          await res.text();
          break;
        }

        case "standard-polyfill": {
          const res = await fetch(url, fetchOptions);
          await res.text();
          break;
        }

        default:
          console.warn("Unknown polyfill test type:", type);
      }
    } catch (error: any) {
      console.error("Polyfill test error:", error.message);
    } finally {
      restoreOriginalGlobals();
    }
  };

  useEffect(() => {
    if (!ws) return;
    ws.addEventListener("message", (e: any) => {
      const message = JSON.parse(e.data);
      if (message.message === `getColorScheme`) {
        ws.send(JSON.stringify({ value: getColorScheme(), id: message.id }));
      } else if (message.message === `getOrientation`) {
        ws.send(JSON.stringify({ value: getOrientation(), id: message.id }));
      } else if (message.message === `getFontSize`) {
        ws.send(JSON.stringify({ value: getFontSize(), id: message.id }));
      } else if (message.message === `getAppState`) {
        ws.send(JSON.stringify({ value: getAppState(), id: message.id }));
      } else if (message.message === "fetchData") {
        const options = prepareRequestOptions(message);

        if (message.url.includes("stream-xhr")) {
          const xhr = new XMLHttpRequest();
          xhr.open(options.method, message.url);

          Object.keys(options.headers).forEach((key) => {
            xhr.setRequestHeader(key, options.headers[key]);
          });

          xhr.send(options.body);
        } else {
          fetch(message.url, options);
        }
      } else if (message.message === `fetchWithPolyfill`) {
        handlePolyfillTest(message);
      } else if (message.message === `getAppName`) {
        ws.send(JSON.stringify({ value: getAppName(), id: message.id }));
      }
    });
  }, [ws]);

  return (
    <View style={style.mainContainer}>
      <View style={style.container}>
        <TrackableButton
          id="console-log-button"
          title="Test console logs and breakpoints"
          onPress={printLogs}
        />
        <TrackableButton
          id="breakpoints-button"
          title="test breakpoints"
          onPress={breakpointTests}
        />
        <TrackableButton
          id="uncaught-exception-button"
          title="Check uncaught exceptions"
          onPress={() => {
            const tryToThrow = "expected error";
            throw new Error(tryToThrow);
          }}
        />
        <TrackableButton
          id="fetch-request-button"
          title="Fetch request visible in network panel"
          onPress={async () => {
            const response = await fetch(
              "https://pokeapi.co/api/v2/pokemon/ditto"
            );
            console.log("Response", response);
          }}
        />
        <TrackableButton
          id="toggle-element-button"
          title="Toggle element visibility"
          onPress={() => {
            console.log("Toggling element visibility");
            setElementVisible((prev) => !prev);
          }}
        />
        <TrackableButton
          id="expo-route-explore-button"
          title="expo-router (do nothing if app is not expo)"
          onPress={() => {
            console.log("Toggling element visibility");
            if (router) {
              router.push("/explore");
            }
          }}
        />
        <View
          style={{
            marginTop: 20,
            width: 50,
            height: 50,
            backgroundColor: "red",
            display: elementVisible ? "flex" : "none",
            margin: "auto"
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "10%",
          height: "10%",
          backgroundColor: "yellow"
        }}
      />
    </View>
  );
}

function useStyle() {
  const { gap, colors } = useScheme();
  return StyleSheet.create({
    mainContainer: {
      display: "flex",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background
    },
    container: {
      gap: gap,
      backgroundColor: colors.background
    },
    stepContainer: { gap, marginHorizontal: gap * 4 }
  });
}
