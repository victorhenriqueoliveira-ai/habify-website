// Preload critical images for better performance
export const preloadCriticalImages = () => {
  const criticalImages = [
    { src: '/Header-background.webp', priority: 'high' },
    { src: '/Foto1.png', priority: 'high' },
  ];

  criticalImages.forEach(({ src, priority }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  });
};

// Convert image to WebP format hint
export const getWebPHint = (src: string): string => {
  if (src.endsWith('.webp')) return src;
  
  const extension = src.match(/\.(png|jpg|jpeg)$/i);
  if (extension) {
    return src.replace(extension[0], '.webp');
  }
  
  return src;
};

// Generate blur data URL for placeholder (simple version)
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  // This is a simple gray placeholder
  // In production, you'd use a library or backend to generate actual blur hashes
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' fill='%23e5e7eb' filter='url(%23b)'/%3E%3C/svg%3E`;
};
