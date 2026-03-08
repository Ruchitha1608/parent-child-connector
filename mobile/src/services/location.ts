import * as Location from 'expo-location';
import { locationAPI } from './api';
import { emitLocation } from './socket';

let watchSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  return bgStatus === 'granted';
}

export async function startLocationTracking(onUpdate?: (loc: Location.LocationObject) => void): Promise<void> {
  if (watchSubscription) return; // already tracking

  const granted = await requestLocationPermission();
  if (!granted) {
    console.warn('[Location] Permission not granted');
    return;
  }

  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000,    // every 15 seconds
      distanceInterval: 20,    // or when moved 20m
    },
    async (loc) => {
      const { latitude, longitude, accuracy, speed, altitude, heading } = loc.coords;

      // Emit via socket (real-time)
      emitLocation({ latitude, longitude, accuracy, speed, altitude, heading });

      // Also POST to REST (for persistence when socket reconnects)
      try {
        await locationAPI.update({ latitude, longitude, accuracy: accuracy ?? undefined, speed: speed ?? undefined, altitude: altitude ?? undefined, heading: heading ?? undefined });
      } catch (err: any) {
        // REST failure is non-fatal; socket already sent the update
        console.warn('[Location] REST update failed:', err.message);
      }

      onUpdate?.(loc);
    }
  );

  console.log('[Location] Tracking started');
}

export function stopLocationTracking(): void {
  watchSubscription?.remove();
  watchSubscription = null;
  console.log('[Location] Tracking stopped');
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    return null;
  }
}
