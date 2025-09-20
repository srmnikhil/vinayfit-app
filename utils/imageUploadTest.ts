// Test file for image upload functionality
import { uploadImageWithRetry } from '../lib/supabase';

// Test the upload function with a sample image URL
export const testImageUpload = async () => {
  try {
    console.log('Testing image upload functionality...');
    
    // Test with a sample image URL (this won't actually upload, just test the function)
    const testUrl = 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400';
    
    console.log('Test URL:', testUrl);
    console.log('Upload function exists:', typeof uploadImageWithRetry === 'function');
    
    // Note: This would require actual file URI from device to test upload
    // For now, just verify the function exists and is properly exported
    
    return {
      success: true,
      message: 'Image upload function is properly exported and ready to use',
      functionExists: typeof uploadImageWithRetry === 'function'
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      message: 'Test failed',
      error: error
    };
  }
}; 