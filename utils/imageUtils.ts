// Image URL utility functions
export function getValidImageUrl(url?: string) {
  if (!url) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800';
  if (url.startsWith('http')) return url;
  // Replace with your actual Supabase project ref
  return `https://<your-supabase-project-id>.supabase.co/storage/v1/object/public/${url}`;
}

// Default workout images for different categories
export const getWorkoutImageByCategory = (category: string): string => {
  const categoryImages: Record<string, string> = {
    'Strength': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Cardio': 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Bodyweight': 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800',
    'HIIT': 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Flexibility': 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Yoga': 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Upper Body': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Lower Body': 'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Full Body': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Athletic Performance': 'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Rehabilitation': 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  return categoryImages[category] || categoryImages['Full Body'];
};

// Exercise images array for fallback
export const getExerciseImages = (): string[] => [
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400', // Weightlifting
  'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400', // Dumbbells
  'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400', // Running
  'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400', // Yoga/Stretching
  'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=400', // Gym equipment
  'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400', // Boxing
  'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=400', // Kettlebell
  'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400', // Stretching
];

// Get exercise image by name and index
export const getExerciseImage = (exerciseName: string, index: number): string => {
  const images = getExerciseImages();
  return images[index % images.length];
};

// Validate if an image URL is accessible
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image URL validation failed:', url, error);
    return false;
  }
}; 