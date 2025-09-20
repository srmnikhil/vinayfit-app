// Test script to verify the session status fix
const { determineEnhancedSessionStatus } = require('./utils/sessionUtils.ts');

// Mock a training session that hasn't started yet
const futureSession = {
  id: '1',
  status: 'scheduled',
  scheduled_date: '2025-07-25',
  scheduled_time: '18:00', // 6 PM today
  duration_minutes: 60
};

// Mock a training session that is currently ongoing
const ongoingSession = {
  id: '2', 
  status: 'confirmed',
  scheduled_date: '2025-07-25',
  scheduled_time: '04:00', // 4 AM today (assuming it's past this time)
  duration_minutes: 60
};

// Mock a completed session
const completedSession = {
  id: '3',
  status: 'completed',
  scheduled_date: '2025-07-25', 
  scheduled_time: '03:00', // 3 AM today
  duration_minutes: 60
};

console.log('Testing session status calculations...\n');

console.log('Future session (6 PM today):');
console.log('Status:', determineEnhancedSessionStatus(futureSession));
console.log('Expected: scheduled (not ongoing)\n');

console.log('Session that started at 4 AM (1 hour duration):');
console.log('Status:', determineEnhancedSessionStatus(ongoingSession));
console.log('Expected: ongoing or missed depending on current time\n');

console.log('Completed session:');
console.log('Status:', determineEnhancedSessionStatus(completedSession));
console.log('Expected: completed\n');

console.log('Current time:', new Date().toLocaleString());
