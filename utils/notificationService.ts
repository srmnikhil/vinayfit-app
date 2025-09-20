import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  type: 'finish' | 'oneDayBefore' | 'oneWeekBefore';
}

export interface ScheduledNotification {
  id: string;
  goalId: string;
  type: string;
  scheduledTime: string;
  notificationId: string;
}

const STORAGE_KEY = '@scheduled_notifications';

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Get the token that uniquely identifies this device
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Push token:', token.data);

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule notification for goal countdown finish
export const scheduleGoalFinishNotification = async (
  goalId: string,
  goalTitle: string,
  goalEmoji: string,
  targetDate: Date
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${goalEmoji} Goal Countdown Finished!`,
        body: `Your goal "${goalTitle}" target date has arrived! How did you do?`,
        data: {
          goalId,
          goalTitle,
          goalEmoji,
          type: 'finish',
        } as NotificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: targetDate,
      },
    });

    await saveScheduledNotification({
      id: `${goalId}_finish`,
      goalId,
      type: 'finish',
      scheduledTime: targetDate.toISOString(),
      notificationId,
    });

    console.log('Scheduled finish notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling finish notification:', error);
    return null;
  }
};

// Schedule notification for 1 day before goal
export const scheduleOneDayBeforeNotification = async (
  goalId: string,
  goalTitle: string,
  goalEmoji: string,
  targetDate: Date
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const oneDayBefore = new Date(targetDate);
    oneDayBefore.setDate(targetDate.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0); // Set to 9 AM

    // Don't schedule if the date is in the past
    if (oneDayBefore <= new Date()) {
      console.log('One day before date is in the past, skipping notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${goalEmoji} Goal Reminder - 1 Day Left!`,
        body: `Tomorrow is the target date for "${goalTitle}". Are you ready?`,
        data: {
          goalId,
          goalTitle,
          goalEmoji,
          type: 'oneDayBefore',
        } as NotificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: oneDayBefore,
      },
    });

    await saveScheduledNotification({
      id: `${goalId}_oneDayBefore`,
      goalId,
      type: 'oneDayBefore',
      scheduledTime: oneDayBefore.toISOString(),
      notificationId,
    });

    console.log('Scheduled one day before notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling one day before notification:', error);
    return null;
  }
};

// Schedule notification for 1 week before goal
export const scheduleOneWeekBeforeNotification = async (
  goalId: string,
  goalTitle: string,
  goalEmoji: string,
  targetDate: Date
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const oneWeekBefore = new Date(targetDate);
    oneWeekBefore.setDate(targetDate.getDate() - 7);
    oneWeekBefore.setHours(9, 0, 0, 0); // Set to 9 AM

    // Don't schedule if the date is in the past
    if (oneWeekBefore <= new Date()) {
      console.log('One week before date is in the past, skipping notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${goalEmoji} Goal Reminder - 1 Week Left!`,
        body: `One week until your target date for "${goalTitle}". Keep pushing!`,
        data: {
          goalId,
          goalTitle,
          goalEmoji,
          type: 'oneWeekBefore',
        } as NotificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: oneWeekBefore,
      },
    });

    await saveScheduledNotification({
      id: `${goalId}_oneWeekBefore`,
      goalId,
      type: 'oneWeekBefore',
      scheduledTime: oneWeekBefore.toISOString(),
      notificationId,
    });

    console.log('Scheduled one week before notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling one week before notification:', error);
    return null;
  }
};

// Schedule all notifications for a goal
export const scheduleGoalNotifications = async (
  goalId: string,
  goalTitle: string,
  goalEmoji: string,
  targetDate: Date,
  reminders: {
    onFinish: boolean;
    oneDayBefore: boolean;
    oneWeekBefore: boolean;
  }
): Promise<void> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    // Cancel any existing notifications for this goal
    await cancelGoalNotifications(goalId);

    // Schedule new notifications based on settings
    if (reminders.onFinish) {
      await scheduleGoalFinishNotification(goalId, goalTitle, goalEmoji, targetDate);
    }

    if (reminders.oneDayBefore) {
      await scheduleOneDayBeforeNotification(goalId, goalTitle, goalEmoji, targetDate);
    }

    if (reminders.oneWeekBefore) {
      await scheduleOneWeekBeforeNotification(goalId, goalTitle, goalEmoji, targetDate);
    }

    console.log('All goal notifications scheduled successfully');
  } catch (error) {
    console.error('Error scheduling goal notifications:', error);
  }
};

// Cancel all notifications for a specific goal
export const cancelGoalNotifications = async (goalId: string): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const scheduledNotifications = await getScheduledNotifications();
    const goalNotifications = scheduledNotifications.filter(n => n.goalId === goalId);

    for (const notification of goalNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
      console.log('Cancelled notification:', notification.notificationId);
    }

    // Remove from storage
    const remainingNotifications = scheduledNotifications.filter(n => n.goalId !== goalId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remainingNotifications));

    console.log('All notifications cancelled for goal:', goalId);
  } catch (error) {
    console.error('Error cancelling goal notifications:', error);
  }
};

// Save scheduled notification to storage
const saveScheduledNotification = async (notification: ScheduledNotification): Promise<void> => {
  try {
    const existing = await getScheduledNotifications();
    const updated = [...existing.filter(n => n.id !== notification.id), notification];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving scheduled notification:', error);
  }
};

// Get all scheduled notifications from storage
const getScheduledNotifications = async (): Promise<ScheduledNotification[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Get all scheduled notifications (for debugging)
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting all scheduled notifications:', error);
    return [];
  }
};

// Handle notification received while app is running
export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void
) => {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }

  return Notifications.addNotificationReceivedListener(handler);
};

// Handle notification response (when user taps notification)
export const addNotificationResponseReceivedListener = (
  handler: (response: Notifications.NotificationResponse) => void
) => {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }

  return Notifications.addNotificationResponseReceivedListener(handler);
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const scheduledNotifications = await getScheduledNotifications();
    const now = new Date();
    
    const validNotifications = scheduledNotifications.filter(notification => {
      const scheduledTime = new Date(notification.scheduledTime);
      return scheduledTime > now;
    });

    if (validNotifications.length !== scheduledNotifications.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validNotifications));
      console.log('Cleaned up expired notifications');
    }
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
  }
};