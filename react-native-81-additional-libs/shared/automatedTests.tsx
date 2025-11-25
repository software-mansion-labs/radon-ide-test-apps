import React from 'react';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Appearance,
  AppState,
  Dimensions,
  PixelRatio,
  Image,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';

import { preview } from 'radon-ide';
import { Button } from './Button';
import { useScheme } from './Colors';
import TrackableButton from './TrackableButton';
import { getWebSocket } from './websocket';
import router from './ExpoRouter';
import appConfig from '../app.json';
import RNLocation from 'react-native-location';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import * as RNLocalize from 'react-native-localize';
import ReactNativeBiometrics from 'react-native-biometrics';

const appName = appConfig.name ? appConfig.name : appConfig.expo.name;

RNLocation.configure({
  distanceFilter: 5,
  desiredAccuracy: {
    ios: 'best',
    android: 'highAccuracy',
  },
  interval: 5000,
  fastestInterval: 2000,
});

// export async function loadLatestPhoto() {
//   try {
//     if (Platform.OS === 'android') {
//       const permission = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES ||
//           PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//       );
//       if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Permission denied');
//         return;
//       }
//     }
//     const photos = await CameraRoll.getPhotos({
//       first: 1,
//       assetType: 'Photos',
//       groupTypes: 'All',
//     });
//     console.log('Photos loaded:', photos.edges[0]);
//     if (photos.edges.length > 0) {
//       const uri = photos.edges[0].node.image.uri;
//       setLatestPhoto(uri);
//     }
//   } catch (error) {
//     console.error('Error loading photos:', error);
//   }
// }

export async function getCurrentLocation() {
  const permission = await RNLocation.requestPermission({
    ios: 'whenInUse',
    android: {
      detail: 'fine',
    },
  });

  if (!permission) {
    throw new Error('Location permission not granted');
  }

  const location = await RNLocation.getLatestLocation({ timeout: 10000 });
  if (!location) {
    throw new Error('Unable to get location');
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
  };
}

async function checkBiometrics() {
  const rnBiometrics = new ReactNativeBiometrics();

  const promptResult = await rnBiometrics.simplePrompt({
    promptMessage: 'Authenticate',
    cancelButtonText: 'Cancel',
  });

  if (promptResult.success) {
    console.log('Biometrics authentication successful');
    return true;
  } else {
    console.log('Biometrics authentication failed or cancelled');
    return false;
  }
}

preview(
  <TrackableButton
    id="preview-button"
    title="Preview Button"
    onPress={printLogs}
  />,
);

function breakpointStepInto(a: number, b: number) {
  const result = a * b; // STEP INTO LINE
  return result; // BREAKPOINT 4
}

function breakpointTests() {
  console.log('Session started'); // BREAKPOINT 1
  const product = breakpointStepInto(6, 6); // STEP OUT LINE
  const items = ['A', 'B', 'C']; // LINE AFTER FUNCTION
  React.Children.count(items); // BREAKPOINT 2
  for (let i = 0; i < items.length; i++) {
    console.log('Processing item:', items[i]); // BREAKPOINT 3
  }
  console.log('Session ended');
}

async function printLogs() {
  // put breakpoint on the next line
  const text = 'console.log()';
  console.log(text);
}

function getColorScheme() {
  return Appearance.getColorScheme();
}

function getOrientation() {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
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

function getCurrentLocalization() {
  return RNLocalize.getLocales()[0];
}

async function getBiometricsAvailability() {
  const rnBiometrics = new ReactNativeBiometrics();
  return await rnBiometrics?.isSensorAvailable();
}

export function AutomatedTests() {
  const style = useStyle();
  const [elementVisible, setElementVisible] = useState(true);
  const ws = getWebSocket();
  const [latestPhoto, setLatestPhoto] = useState(null);

  useEffect(() => {
    if (!ws) return;
    ws.addEventListener('message', async (e: any) => {
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
      } else if (message.message === `getLocation`) {
        ws.send(
          JSON.stringify({ value: await getCurrentLocation(), id: message.id }),
        );
      } else if (message.message === `getLocalization`) {
        ws.send(
          JSON.stringify({
            value: getCurrentLocalization(),
            id: message.id,
          }),
        );
      } else if (message.message === `checkBiometricsAvailability`) {
        ws.send(
          JSON.stringify({
            value: await getBiometricsAvailability(),
            id: message.id,
          }),
        );
      } else if (message.message === `performBiometricsCheck`) {
        ws.send(
          JSON.stringify({
            value: await checkBiometrics(),
            id: message.id,
          }),
        );
      }
    });
  }, [ws]);

  return (
    <View style={style.mainContainer}>
      <View style={style.container}>
        {latestPhoto ? (
          <Image
            source={{ uri: latestPhoto }}
            style={{ width: 300, height: 300 }}
          />
        ) : (
          <Text>Loading latest photo...</Text>
        )}
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
            const tryToThrow = 'expected error';
            throw new Error(tryToThrow);
          }}
        />
        <TrackableButton
          id="fetch-request-button"
          title="Fetch request visible in network panel"
          onPress={async () => {
            const response = await fetch(
              'https://pokeapi.co/api/v2/pokemon/ditto',
            );
            console.log('Response', response);
          }}
        />
        <TrackableButton
          id="toggle-element-button"
          title="Toggle element visibility"
          onPress={() => {
            console.log('Toggling element visibility');
            setElementVisible(prev => !prev);
          }}
        />
        <TrackableButton
          id="expo-route-explore-button"
          title="expo-router (do nothing if app is not expo)"
          onPress={() => {
            console.log('Toggling element visibility');
            if (router) {
              router.push('/explore');
            }
          }}
        />
        <View
          style={{
            marginTop: 20,
            width: 50,
            height: 50,
            backgroundColor: 'red',
            display: elementVisible ? 'flex' : 'none',
            margin: 'auto',
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '10%',
          height: '10%',
          backgroundColor: 'yellow',
        }}
      />
    </View>
  );
}

function useStyle() {
  const { gap, colors } = useScheme();
  return StyleSheet.create({
    mainContainer: {
      display: 'flex',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    container: {
      gap: gap,
      backgroundColor: colors.background,
    },
    stepContainer: { gap, marginHorizontal: gap * 4 },
    image: {
      marginTop: 20,
      width: 250,
      height: 250,
      borderRadius: 10,
    },
  });
}
