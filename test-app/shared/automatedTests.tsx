import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { preview } from 'radon-ide';

import { Button } from './Button';
import { useScheme } from './Colors';
import TrackableButton from './TrackableButton';
import { Platform } from 'react-native';

preview(
  <Button
    title="Button"
    onPress={() => {
      console.log('console.log()');
    }}
  />,
);

function printLogs() {
  // put breakpoint on the next line
  const text = 'console.log()';
  console.log(text);
}

export function AutomatedTests({ ws }: { ws: WebSocket | null }) {
  const style = useStyle();
  const [elementVisible, setElementVisible] = useState(true);

  return (
    <View style={style.mainContainer}>
      <View style={style.container}>
        <TrackableButton
          ws={ws}
          id="console-log-button"
          title="Test console logs and breakpoints"
          onPress={printLogs}
        />
        <TrackableButton
          ws={ws}
          id="uncaught-exception-button"
          title="Check uncaught exceptions"
          onPress={() => {
            const tryToThrow = 'expected error';
            throw new Error(tryToThrow);
          }}
        />
        <TrackableButton
          ws={ws}
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
          ws={ws}
          id="toggle-element-button"
          title="Toggle element visibility"
          onPress={() => {
            console.log('Toggling element visibility');
            setElementVisible(prev => !prev);
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
  });
}
