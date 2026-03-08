import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert, ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useStore } from '../../store/useStore';
import { locationAPI, geofenceAPI } from '../../services/api';
import { LocationPoint, Geofence } from '../../types';

export default function MapScreen() {
  const { liveLocation, pairedChild, geofences, setGeofences, addGeofence, removeGeofence } = useStore();
  const mapRef = useRef<MapView>(null);
  const [history, setHistory] = useState<LocationPoint[]>([]);
  const [showAddGeofence, setShowAddGeofence] = useState(false);
  const [newGeofence, setNewGeofence] = useState({ label: '', radiusM: '300' });
  const [tappedCoord, setTappedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (pairedChild) {
      loadGeofences();
    }
  }, [pairedChild]);

  useEffect(() => {
    if (liveLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [liveLocation]);

  async function loadGeofences() {
    if (!pairedChild) return;
    try {
      const { data } = await geofenceAPI.list(pairedChild.id);
      setGeofences(data);
    } catch {}
  }

  async function loadHistory() {
    if (!pairedChild) return;
    try {
      const { data } = await locationAPI.history(pairedChild.id, selectedDate || undefined, 500);
      setHistory(data);
    } catch {}
  }

  async function handleAddGeofence() {
    if (!tappedCoord || !newGeofence.label) {
      return Alert.alert('Error', 'Tap a location on the map and enter a label');
    }
    if (!pairedChild) return;
    try {
      const { data } = await geofenceAPI.create({
        childId: pairedChild.id,
        label: newGeofence.label,
        centerLat: tappedCoord.lat,
        centerLng: tappedCoord.lng,
        radiusM: parseFloat(newGeofence.radiusM) || 300,
      });
      addGeofence(data);
      setShowAddGeofence(false);
      setTappedCoord(null);
      setNewGeofence({ label: '', radiusM: '300' });
      Alert.alert('Success', 'Geofence created!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create geofence');
    }
  }

  async function handleDeleteGeofence(id: string) {
    Alert.alert('Delete Geofence', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await geofenceAPI.delete(id);
            removeGeofence(id);
          } catch {}
        },
      },
    ]);
  }

  const initialRegion = {
    latitude: liveLocation?.latitude ?? 28.6139,
    longitude: liveLocation?.longitude ?? 77.2090,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const polylineCoords = history.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onPress={(e) => {
          if (showAddGeofence) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setTappedCoord({ lat: latitude, lng: longitude });
          }
        }}
      >
        {/* Live location marker */}
        {liveLocation && (
          <Marker
            coordinate={{ latitude: liveLocation.latitude, longitude: liveLocation.longitude }}
            title={liveLocation.childName}
            description={`Updated: ${new Date(liveLocation.timestamp).toLocaleTimeString()}`}
          >
            <View style={styles.liveMarker}><Text style={styles.liveMarkerText}>👧</Text></View>
          </Marker>
        )}

        {/* History path */}
        {polylineCoords.length > 1 && (
          <Polyline coordinates={polylineCoords} strokeColor="#4F46E5" strokeWidth={3} />
        )}

        {/* Geofences */}
        {geofences.filter((g) => g.isActive).map((gf) => (
          <React.Fragment key={gf.id}>
            <Circle
              center={{ latitude: gf.centerLat, longitude: gf.centerLng }}
              radius={gf.radiusM}
              strokeColor="#4F46E5"
              fillColor="rgba(79,70,229,0.12)"
              strokeWidth={2}
            />
            <Marker
              coordinate={{ latitude: gf.centerLat, longitude: gf.centerLng }}
              title={gf.label}
              pinColor="#4F46E5"
              onCalloutPress={() => handleDeleteGeofence(gf.id)}
            />
          </React.Fragment>
        ))}

        {/* Tapped location for new geofence */}
        {tappedCoord && (
          <Marker
            coordinate={{ latitude: tappedCoord.lat, longitude: tappedCoord.lng }}
            pinColor="#EF4444"
          />
        )}
      </MapView>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => { setShowAddGeofence(!showAddGeofence); setTappedCoord(null); }}>
          <Text style={styles.toolBtnText}>{showAddGeofence ? '✕ Cancel' : '+ Geofence'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={loadHistory}>
          <Text style={styles.toolBtnText}>📍 History</Text>
        </TouchableOpacity>
        {liveLocation && (
          <TouchableOpacity style={styles.toolBtn} onPress={() => mapRef.current?.animateToRegion({
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          })}>
            <Text style={styles.toolBtnText}>🎯 Child</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Geofence Panel */}
      {showAddGeofence && (
        <View style={styles.geofencePanel}>
          <Text style={styles.panelTitle}>New Geofence</Text>
          <Text style={styles.panelHint}>
            {tappedCoord
              ? `📍 ${tappedCoord.lat.toFixed(4)}, ${tappedCoord.lng.toFixed(4)}`
              : 'Tap on the map to set center'}
          </Text>
          <TextInput style={styles.panelInput} placeholder="Zone label (e.g. School)" value={newGeofence.label} onChangeText={(v) => setNewGeofence((p) => ({ ...p, label: v }))} />
          <TextInput style={styles.panelInput} placeholder="Radius in meters" keyboardType="numeric" value={newGeofence.radiusM} onChangeText={(v) => setNewGeofence((p) => ({ ...p, radiusM: v }))} />
          <TouchableOpacity style={styles.panelBtn} onPress={handleAddGeofence}>
            <Text style={styles.panelBtnText}>Create Geofence</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  liveMarker: {
    backgroundColor: '#4F46E5', borderRadius: 20, padding: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  liveMarkerText: { fontSize: 18 },
  toolbar: {
    position: 'absolute', top: 12, right: 12,
    gap: 8,
  },
  toolBtn: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.15,
    shadowRadius: 4, elevation: 4, marginBottom: 8,
  },
  toolBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  geofencePanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  panelTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
  panelHint: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  panelInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 10, color: '#111827',
  },
  panelBtn: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  panelBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
