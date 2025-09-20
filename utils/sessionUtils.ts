import { TrainingSession } from '../types/workout';

/**
 * Calculate session end time by adding duration to the scheduled time
 * @param scheduledTime - Session scheduled time (ISO string or time format like "14:30")
 * @param durationMinutes - Session duration in minutes
 * @returns Date object representing session end time, or null if calculation fails
 */
export const calculateSessionEndTime = (scheduledTime: string, durationMinutes: number): Date | null => {
  if (!scheduledTime || !durationMinutes) return null;
  
  try {
    // Handle ISO string format or time-only format
    let startTime: Date;
    
    if (scheduledTime.includes('T')) {
      // ISO string format like "2025-07-24T14:30:00"
      startTime = new Date(scheduledTime);
    } else {
      // Time-only format like "14:30"
      const today = new Date().toISOString().split('T')[0]; // Get today's date
      startTime = new Date(`${today}T${scheduledTime}`);
    }
    
    if (isNaN(startTime.getTime())) {
      console.error('Invalid start time format:', scheduledTime);
      return null;
    }
    
    // Add duration in minutes to the start time
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    return endTime;
  } catch (error) {
    console.error('Error calculating session end time:', error);
    return null;
  }
};

/**
 * Determine session status based on current time, session timing, and backend status
 * @param session - Training session object
 * @returns Session status string including future sessions
 */
export const determineSessionStatus = (session: TrainingSession): string => {
  const currentTime = new Date();
  
  // If explicitly marked as completed in backend, return completed
  if (session.status === 'completed') {
    return 'completed';
  }
  
  // If cancelled, return cancelled
  if (session.status === 'cancelled') {
    return 'cancelled';
  }
  
  // Calculate the actual session start time
  const durationMinutes = session.duration_minutes || session.duration || session.template?.estimated_duration_minutes || 60;
  let actualStartTime: Date;
  
  try {
    const scheduledTime = session.scheduled_time || '';
    
    if (scheduledTime.includes('T')) {
      // ISO string format like "2025-07-24T14:30:00"
      actualStartTime = new Date(scheduledTime);
    } else if (scheduledTime) {
      // Time-only format like "14:30" - combine with scheduled_date or today
      const sessionDate = session.scheduled_date || new Date().toISOString().split('T')[0];
      actualStartTime = new Date(`${sessionDate}T${scheduledTime}`);
    } else {
      // No valid scheduled time, use backend status as fallback
      return session.status === 'completed' ? 'completed' : (session.status || 'scheduled');
    }
    
    if (isNaN(actualStartTime.getTime())) {
      console.error('Invalid session start time:', scheduledTime, session.scheduled_date);
      return session.status === 'completed' ? 'completed' : (session.status || 'scheduled');
    }
  } catch (error) {
    console.error('Error parsing session start time:', error);
    return session.status === 'completed' ? 'completed' : (session.status || 'scheduled');
  }
  
  // Calculate session end time
  const endTime = new Date(actualStartTime.getTime() + durationMinutes * 60 * 1000);
  
  // Determine status based on current time relative to session timing
  if (currentTime < actualStartTime) {
    // Session hasn't started yet - return the backend status
    return session.status || 'scheduled';
  } else if (currentTime >= actualStartTime && currentTime < endTime) {
    // Session is currently in progress - only if confirmed or scheduled
    if (session.status === 'confirmed' || session.status === 'scheduled') {
      return 'ongoing';
    }
    return 'missed';
  } else {
    // Session time has passed
    return session.status === 'completed' ? 'completed' : 'missed';
  }
};

/**
 * Enhanced version of determineSessionStatus that supports more session types and statuses
 * Used for trainer views that need to handle additional states like 'cancelled'
 * @param session - Enhanced training session object
 * @returns Session status string including additional states
 */
export const determineEnhancedSessionStatus = (session: any): string => {
  const currentTime = new Date();
  
  // If explicitly marked as completed in backend, return completed
  if (session.status === 'completed') {
    return 'completed';
  }
  
  // If cancelled, return cancelled
  if (session.status === 'cancelled') {
    return 'cancelled';
  }
  
  // Calculate the actual session start time
  const durationMinutes = session.duration_minutes || 60;
  let actualStartTime: Date;
  
  try {
    const scheduledTime = session.scheduled_time || '';
    
    if (scheduledTime.includes('T')) {
      // ISO string format like "2025-07-24T14:30:00"
      actualStartTime = new Date(scheduledTime);
    } else if (scheduledTime) {
      // Time-only format like "14:30" - combine with scheduled_date
      const sessionDate = session.scheduled_date || new Date().toISOString().split('T')[0];
      actualStartTime = new Date(`${sessionDate}T${scheduledTime}`);
    } else {
      // No valid scheduled time, use backend status as fallback
      return session.status === 'completed' ? 'completed' : 'missed';
    }
    
    if (isNaN(actualStartTime.getTime())) {
      console.error('Invalid session start time:', scheduledTime, session.scheduled_date);
      return session.status === 'completed' ? 'completed' : 'missed';
    }
  } catch (error) {
    console.error('Error parsing session start time:', error);
    return session.status === 'completed' ? 'completed' : 'missed';
  }
  
  // Calculate session end time
  const endTime = new Date(actualStartTime.getTime() + durationMinutes * 60 * 1000);
  
  // Determine status based on current time relative to session timing
  if (currentTime < actualStartTime) {
    // Session hasn't started yet - return the backend status (scheduled, confirmed, etc.)
    return session.status || 'scheduled';
  } else if (currentTime >= actualStartTime && currentTime < endTime) {
    // Session is currently in progress
    return 'ongoing';
  } else {
    // Session time has passed
    return session.status === 'completed' ? 'completed' : 'missed';
  }
};

/**
 * Get color code for session status
 * @param status - Session status
 * @returns Hex color code for the status
 */
export const getSessionStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled': return '#007AFF'; // Blue
    case 'confirmed': return '#007AFF'; // Blue
    case 'completed': return '#34C759'; // Green
    case 'missed': return '#FF3B30'; // Red
    case 'cancelled': return '#FF3B30'; // Red
    case 'ongoing': return '#FFA500'; // Orange
    case 'no_show': return '#FF9500'; // Orange/Warning
    default: return '#8E8E93'; // Gray
  }
};

/**
 * Get status badge styling for React Native components
 * @param status - Session status
 * @returns Object with backgroundColor for status badges
 */
export const getStatusBadgeStyle = (status: string): { backgroundColor: string } => {
  return { backgroundColor: getSessionStatusColor(status) };
};

/**
 * Get icon name for session status (for use with icon libraries)
 * @param status - Session status
 * @returns Icon name or component identifier
 */
export const getSessionStatusIcon = (status: string): string => {
  switch (status) {
    case 'scheduled': return 'calendar';
    case 'confirmed': return 'check-circle';
    case 'completed': return 'check-circle';
    case 'missed': return 'alert-circle';
    case 'cancelled': return 'x-circle';
    case 'ongoing': return 'play-circle';
    case 'no_show': return 'alert-triangle';
    default: return 'help-circle';
  }
};

/**
 * Format session status for display
 * @param status - Raw session status
 * @returns Formatted status string for UI display
 */
export const formatSessionStatus = (status: string): string => {
  switch (status) {
    case 'scheduled': return 'Scheduled';
    case 'confirmed': return 'Confirmed';
    case 'completed': return 'Completed';
    case 'missed': return 'Missed';
    case 'cancelled': return 'Cancelled';
    case 'ongoing': return 'Ongoing';
    case 'no_show': return 'No Show';
    default: return 'Unknown';
  }
};

/**
 * Check if a session just ended and needs completion confirmation
 * @param session - Training session object
 * @returns True if session just ended and needs completion prompt
 */
export const shouldShowCompletionPrompt = (session: TrainingSession): boolean => {
  const currentTime = new Date();
  
  // Only show prompt for confirmed or ongoing sessions
  if (session.status !== 'confirmed' && session.status !== 'ongoing') {
    return false;
  }
  
  const durationMinutes = session.duration_minutes || session.duration || session.template?.estimated_duration_minutes || 60;
  const endTime = calculateSessionEndTime(session.scheduled_time || '', durationMinutes);
  
  if (!endTime) {
    return false;
  }
  
  // Check if session ended within the last 5 minutes
  const timeSinceEnd = currentTime.getTime() - endTime.getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return timeSinceEnd >= 0 && timeSinceEnd <= fiveMinutesInMs;
};

/**
 * Check if a session is currently ongoing
 * @param session - Training session object
 * @returns True if session is currently in progress
 */
export const isSessionOngoing = (session: TrainingSession): boolean => {
  const currentTime = new Date();
  
  // Only check confirmed sessions
  if (session.status !== 'confirmed') {
    return false;
  }
  
  const durationMinutes = session.duration_minutes || session.duration || session.template?.estimated_duration_minutes || 60;
  const endTime = calculateSessionEndTime(session.scheduled_time || '', durationMinutes);
  
  if (!endTime) {
    return false;
  }
  
  const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);
  
  return currentTime >= startTime && currentTime < endTime;
};

/**
 * Get time remaining in a session
 * @param session - Training session object
 * @returns Minutes remaining in session, or null if not ongoing
 */
export const getSessionTimeRemaining = (session: TrainingSession): number | null => {
  const currentTime = new Date();
  
  if (!isSessionOngoing(session)) {
    return null;
  }
  
  const durationMinutes = session.duration_minutes || session.duration || session.template?.estimated_duration_minutes || 60;
  const endTime = calculateSessionEndTime(session.scheduled_time || '', durationMinutes);
  
  if (!endTime) {
    return null;
  }
  
  const timeRemainingMs = endTime.getTime() - currentTime.getTime();
  return Math.max(0, Math.ceil(timeRemainingMs / (60 * 1000)));
};
