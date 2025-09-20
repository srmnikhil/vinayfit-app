// Simple test file for image utilities
import { getValidImageUrl, getWorkoutImageByCategory, getExerciseImage } from './imageUtils';

// Test cases for getValidImageUrl
console.log('Testing getValidImageUrl:');
console.log('Google Images URL:', getValidImageUrl('https://images.app.goo.gl/zv4Nu'));
console.log('Valid URL:', getValidImageUrl('https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg'));
console.log('Null URL:', getValidImageUrl(null));
console.log('Undefined URL:', getValidImageUrl(undefined));

// Test cases for getWorkoutImageByCategory
console.log('\nTesting getWorkoutImageByCategory:');
console.log('Strength:', getWorkoutImageByCategory('Strength'));
console.log('Cardio:', getWorkoutImageByCategory('Cardio'));
console.log('Unknown category:', getWorkoutImageByCategory('Unknown'));

// Test cases for getExerciseImage
console.log('\nTesting getExerciseImage:');
console.log('Exercise 1:', getExerciseImage('Push-ups', 0));
console.log('Exercise 2:', getExerciseImage('Squats', 1));
console.log('Exercise 10:', getExerciseImage('Deadlift', 10)); 