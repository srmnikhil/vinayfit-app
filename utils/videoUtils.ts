// export function extractYouTubeVideoId(url: string): string | null {
//   const patterns = [
//     /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
//     /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
//   ];

//   for (const pattern of patterns) {
//     const match = url.match(pattern);
//     if (match) {
//       return match[1];
//     }
//   }
//   return null;
// }

// export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
//   const qualityMap = {
//     default: 'default.jpg',
//     medium: 'mqdefault.jpg',
//     high: 'hqdefault.jpg',
//     standard: 'sddefault.jpg',
//     maxres: 'maxresdefault.jpg',
//   };
  
//   return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
// }

// export function validateYouTubeUrl(url: string): boolean {
//   if (!url) return true; // Empty URL is valid (optional field)
//   return extractYouTubeVideoId(url) !== null;
// }

// export function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 Bytes';
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }

// export function validateVideoFile(file: any): { isValid: boolean; error?: string } {
//   const maxSize = 100 * 1024 * 1024; // 100MB
//   const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
  
//   if (file.size > maxSize) {
//     return { isValid: false, error: 'Video file must be less than 100MB' };
//   }
  
//   if (!allowedTypes.includes(file.type)) {
//     return { isValid: false, error: 'Only MP4, MOV, and AVI video files are supported' };
//   }
  
//   return { isValid: true };
// }

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg',
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

export function validateYouTubeUrl(url: string): boolean {
  if (!url) return true; // Empty URL is valid (optional field)
  return extractYouTubeVideoId(url) !== null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateVideoFile(file: any): { isValid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Video file must be less than 100MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only MP4, MOV, and AVI video files are supported' };
  }
  
  return { isValid: true };
}