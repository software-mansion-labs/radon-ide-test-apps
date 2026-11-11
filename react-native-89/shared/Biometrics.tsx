import React from 'react';
import {Button, StyleSheet, View} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';



export async function handleBiometricAuth() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (compatible) {
    const biometricRecords = await LocalAuthentication.isEnrolledAsync();
    if (!biometricRecords) {
      alert('No biometric data stored!');
      //return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your identity',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });

    if (result.success) {
      alert('Authorization successfully completed!');
    } else {
      alert('Authorization failed.');
    }
  } else {
    alert('This device does not support biometric authentication.');
  }
}

export function Biometrics() {
  return (
      <Button
        title="Test Biometric"
        onPress={handleBiometricAuth}
      />
  );
}
