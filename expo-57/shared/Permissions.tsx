import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Localization from 'expo-localization';


export function Permissions() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [address, setAddress] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState({
    location: 'undetermined',
    cameraRoll: 'undetermined',
    contacts: 'undetermined',
    calendar: 'undetermined',
    gallery: 'undetermined'
  });

  async function handlePermission(requestFn, key, deniedMsg, onGranted) {
    try {
      const { status } = await requestFn();
      if (status !== 'granted') {
        alert(deniedMsg);
        return;
      }
      setPermissionStatus(prev => ({ ...prev, [key]: status }));
      if (onGranted) await onGranted();
    } catch (e) {
      setErrorMsg(`Error requesting ${key} permission`);
    }
  }

  const requestLocationPermission = () =>
    handlePermission(
      Location.requestForegroundPermissionsAsync,
      'location',
      'Permission for location was denied',
      async () => {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        const result = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        setAddress(result[0] || "Address not found");
      }
    );

  const requestCameraRollPermission = () =>
    handlePermission(
      ImagePicker.requestMediaLibraryPermissionsAsync,
      'cameraRoll',
      'Permission for camera roll was denied'
    );

  const requestContactsPermission = () =>
    handlePermission(
      Contacts.requestPermissionsAsync,
      'contacts',
      'Permission for contacts was denied'
    );

  const requestCalendarPermission = () =>
    handlePermission(
      Calendar.requestCalendarPermissionsAsync,
      'calendar',
      'Permission for calendar was denied'
    );

  const requestGalleryPermissions = () =>
    handlePermission(
      ImagePicker.requestMediaLibraryPermissionsAsync,
      'gallery',
      'Permission for gallery was denied'
    );



  return (
    <View style={styles.container}>
      <Text>Location: {location ? JSON.stringify(location) : 'Null'}</Text>
      <Text>Address: {address ? JSON.stringify(address) : 'Null'}</Text>
      <Text>System Language: {Localization.locale}</Text>
      <Text style={styles.separator}></Text>
      <Text>Location Status: {permissionStatus.location}</Text>
      <Text>Camera Roll Status: {permissionStatus.cameraRoll}</Text>
      <Text>Contacts Status: {permissionStatus.contacts}</Text>
      <Text>Calendar Status: {permissionStatus.calendar}</Text>
      <Text>Gallery Status: {permissionStatus.gallery}</Text>
      <Text style={styles.separator}></Text>
      <Button title="Request Location Permission" onPress={requestLocationPermission} />
      <Button title="Request Camera Roll Permission" onPress={requestCameraRollPermission} />
      <Button title="Request Contacts Permission" onPress={requestContactsPermission}/>
      <Button title="Request Calendar Permission" onPress={requestCalendarPermission} />
      <Button title="Request Gallery Permission" onPress={requestGalleryPermissions} />
      {errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  }
});
