import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    border: string;
    surface: string;
  };
  showHandle?: boolean;
  showHeader?: boolean;
  enablePanGesture?: boolean;
  closeOnBackdropPress?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnap = 0,
  colors,
  showHandle = true,
  showHeader = true,
  enablePanGesture = true,
  closeOnBackdropPress = true,
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const lastGestureDy = useRef(0);
  const currentSnapIndex = useRef(initialSnap);
  const [isVisible, setIsVisible] = useState(false);

  const snapPointsPixels = snapPoints.map(point => height * (1 - point));

  // Create styles inside component to access colors
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
    },
    bottomSheetContainer: {
      flex: 1,
    },
    bottomSheetContent: {
      height: height,
      width: '100%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 20,
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#ccc',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    bottomSheetBody: {
      flex: 1,
      padding: 20,
    },
    bottomSheetBodyNoHeader: {
      flex: 1,
      padding: 20,
      paddingTop: showHandle ? 20 : 32,
    },
  });

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Small delay to prevent flash
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: snapPointsPixels[currentSnapIndex.current],
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }, 50);
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => enablePanGesture,
    onMoveShouldSetPanResponder: () => enablePanGesture,
    onPanResponderGrant: () => {
      lastGestureDy.current = 0;
    },
    onPanResponderMove: (_, gestureState) => {
      const newTranslateY = snapPointsPixels[currentSnapIndex.current] + gestureState.dy;
      
      // Prevent dragging above the highest snap point
      if (newTranslateY < snapPointsPixels[snapPointsPixels.length - 1]) {
        return;
      }
      
      const maxTranslateY = height + 50;
      const clampedTranslateY = Math.min(newTranslateY, maxTranslateY);
      
      translateY.setValue(clampedTranslateY);
      lastGestureDy.current = gestureState.dy;
    },
    onPanResponderRelease: (_, gestureState) => {
      const velocity = gestureState.vy;
      const currentY = snapPointsPixels[currentSnapIndex.current] + gestureState.dy;
      
      // Close if dragged down significantly or fast velocity down
      if (gestureState.dy > 100 || velocity > 0.5) {
        if (currentSnapIndex.current === 0) {
          onClose();
          return;
        } else {
          currentSnapIndex.current = Math.max(0, currentSnapIndex.current - 1);
        }
      } 
      // Move to higher snap point if dragged up significantly or fast velocity up
      else if (gestureState.dy < -100 || velocity < -0.5) {
        currentSnapIndex.current = Math.min(snapPoints.length - 1, currentSnapIndex.current + 1);
      } 
      // Otherwise, snap to closest point
      else {
        let closestIndex = 0;
        let closestDistance = Math.abs(currentY - snapPointsPixels[0]);
        
        for (let i = 1; i < snapPointsPixels.length; i++) {
          const distance = Math.abs(currentY - snapPointsPixels[i]);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        }
        
        currentSnapIndex.current = closestIndex;
      }
      
      // Animate to the target snap point
      Animated.spring(translateY, {
        toValue: snapPointsPixels[currentSnapIndex.current],
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    },
  });

  const backdropOpacity = translateY.interpolate({
    inputRange: [snapPointsPixels[snapPointsPixels.length - 1], height],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  if (!isVisible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            onPress={closeOnBackdropPress ? onClose : undefined}
            activeOpacity={1}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY }],
            }
          ]}
          {...(enablePanGesture ? panResponder.panHandlers : {})}
        >
          <View style={styles.bottomSheetContent}>
            {showHandle && <View style={styles.bottomSheetHandle} />}
            
            {showHeader && title && (
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={showHeader ? styles.bottomSheetBody : styles.bottomSheetBodyNoHeader}>
              {children}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;