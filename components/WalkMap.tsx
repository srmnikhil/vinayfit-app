import React, { useState, useRef } from 'react';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { MapPin, Route } from 'lucide-react-native';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface WalkMapProps {
  route: Coordinate[];
  distance: number;
  duration: number;
  date: string;
}

export default function WalkMap({ 
  route, 
  distance, 
  duration,
  date,
  live = false, // new prop: if true, enable live tracking
  fullExpand = false // new prop: if true, expand map to full width
}: WalkMapProps & { live?: boolean; fullExpand?: boolean }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const [liveRoute, setLiveRoute] = useState<Coordinate[]>([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const locationSub = useRef<any>(null);

  // Add expand/collapse logic
  const [expanded, setExpanded] = useState(fullExpand);

  // Start live walk tracking
  const startTracking = async () => {
    setLiveRoute([]);
    setLiveDistance(0);
    setLiveDuration(0);
    setTracking(true);
    setStartTime(Date.now());
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      setTracking(false);
      return;
    }
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => {
        setLiveRoute(prev => {
          const updated = [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude }];
          if (updated.length > 1) {
            setLiveDistance(prevDist => prevDist + getDistance(updated[updated.length - 2], updated[updated.length - 1]));
          }
          return updated;
        });
        if (startTime) {
          setLiveDuration((Date.now() - startTime) / 60000);
        }
      }
    );
  };

  // Stop live walk tracking
  const stopTracking = () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setTracking(false);
    // Optionally: save liveRoute, liveDistance, liveDuration, and date to storage
  };

  // Ensure we have route data (only for non-live mode)
  if (!live && (!route || route.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}> 
        <View style={styles.header}>
          <Text style={[styles.title, { 
            color: colors.text,
            fontFamily: 'Inter-SemiBold'
          }]}>Recent Activity</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Route size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Medium'
          }]}>No recent walk activities</Text>
        </View>
      </View>
    );
  }
  
  // Calculate map region from route
  const calculateRegion = () => {
    let minLat = route[0].latitude;
    let maxLat = route[0].latitude;
    let minLng = route[0].longitude;
    let maxLng = route[0].longitude;
    
    route.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
    
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };
  
  // Format duration to minutes and seconds
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  // Format distance to km with one decimal place
  const formatDistance = (distanceInMeters: number) => {
    const km = distanceInMeters / 1000;
    return `${km.toFixed(1)} km`;
  };
  
  if (live) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: colors.surface },
        expanded && { borderRadius: 0, marginHorizontal: 0, width: '100%' }
      ]}> 
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>Live Walk Tracker</Text>
          <Text
            onPress={() => setExpanded(e => !e)}
            style={{ marginLeft: 12, color: colors.primary, fontWeight: 'bold', textDecorationLine: 'underline', fontSize: 14 }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Text>
        </View>
        <View style={[styles.mapContainer, expanded && { borderRadius: 0, marginHorizontal: 0, width: '100%', height: 300 }]}> 
          <MapView
            style={[styles.map, expanded && { borderRadius: 0, width: '100%', height: '100%' }]}
            region={liveRoute.length > 0 ? {
              latitude: liveRoute[liveRoute.length - 1].latitude,
              longitude: liveRoute[liveRoute.length - 1].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } : {
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            customMapStyle={darkMapStyle}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {liveRoute.length > 1 && (
              <Polyline
                coordinates={liveRoute}
                strokeWidth={4}
                strokeColor={colors.primary}
              />
            )}
            {liveRoute.length > 0 && (
              <Marker coordinate={liveRoute[0]}>
                <View style={[styles.markerContainer, { backgroundColor: colors.success }]}> 
                  <MapPin size={16} color='#fff' />
                </View>
              </Marker>
            )}
            {liveRoute.length > 1 && (
              <Marker coordinate={liveRoute[liveRoute.length - 1]}>
                <View style={[styles.markerContainer, { backgroundColor: colors.error }]}> 
                  <MapPin size={16} color='#fff' />
                </View>
              </Marker>
            )}
          </MapView>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: 'Inter-SemiBold' }]}> {(liveDistance / 1000).toFixed(2)} km </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: 'Inter-SemiBold' }]}> {Math.floor(liveDuration)} min </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: 'Inter-SemiBold' }]}> {liveDuration > 0 ? (liveDistance / 1000 / (liveDuration / 60)).toFixed(1) : '0.0'} km/h </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>Avg Speed</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          {!tracking ? (
            <Text onPress={startTracking} style={{ backgroundColor: colors.primary, color: '#fff', padding: 12, borderRadius: 8, fontWeight: 'bold', overflow: 'hidden' }}>Start Walk</Text>
          ) : (
            <Text onPress={stopTracking} style={{ backgroundColor: colors.error, color: '#fff', padding: 12, borderRadius: 8, fontWeight: 'bold', overflow: 'hidden' }}>Stop Walk</Text>
          )}
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { 
          color: colors.text,
          fontFamily: 'Inter-SemiBold'
        }]}>
          Recent Activity
        </Text>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            {date}
          </Text>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={calculateRegion()}
          customMapStyle={darkMapStyle}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Polyline
            coordinates={route}
            strokeWidth={4}
            strokeColor={colors.primary}
          />
          <Marker coordinate={route[0]}>
            <View style={[styles.markerContainer, { backgroundColor: colors.success }]}>
              <MapPin size={16} color='#fff' />
            </View>
          </Marker>
          <Marker coordinate={route[route.length - 1]}>
            <View style={[styles.markerContainer, { backgroundColor: colors.error }]}>
              <MapPin size={16} color='#fff' />
            </View>
          </Marker>
        </MapView>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {formatDistance(distance)}
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Distance
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {formatDuration(duration)}
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Duration
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { 
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }]}>
            {(distance / 1000 / (duration / 60)).toFixed(1)} km/h
          </Text>
          <Text style={[styles.statLabel, { 
            color: colors.textSecondary,
            fontFamily: 'Inter-Regular'
          }]}>
            Avg Speed
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  dateContainer: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
  },
});

// Dark mode map style
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];