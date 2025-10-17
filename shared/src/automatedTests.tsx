import React from "react";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Appearance,
  AppState,
  Dimensions,
  PixelRatio,
} from "react-native";

import { preview } from "radon-ide";
import { Button } from "./Button";
import { useScheme } from "./Colors";
import TrackableButton from "./TrackableButton";
import { getWebSocket } from "./websocket";
import router from "./ExpoRouter";
import appConfig from "../app.json";

const appName = appConfig.name ? appConfig.name : appConfig.expo.name;

preview(
  <TrackableButton
    id="preview-button"
    title="Preview Button"
    onPress={printLogs}
  />
);

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
      } else if (message.message === `fetchData`) {
        fetch(message.url);
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
            margin: "auto",
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
          backgroundColor: "yellow",
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
      backgroundColor: colors.background,
    },
    container: {
      gap: gap,
      backgroundColor: colors.background,
    },
    stepContainer: { gap, marginHorizontal: gap * 4 },
  });
}
