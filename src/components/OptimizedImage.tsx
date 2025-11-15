import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  blurDataURL?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  blurDataURL,
  priority = false,
  objectFit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    skip: priority,
  });

  // Convert image path to WebP if not already
  const getWebPSrc = (originalSrc: string): string => {
    if (originalSrc.endsWith('.webp')) return originalSrc;
    
    // For local images, try to use WebP version
    const extension = originalSrc.match(/\.(png|jpg|jpeg)$/i);
    if (extension) {
      return originalSrc.replace(extension[0], '.webp');
    }
    
    return originalSrc;
  };

  // Set refs
  const setRefs = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    if (priority || inView) {
      const webpSrc = getWebPSrc(src);
      
      // Preload image
      const img = new Image();
      img.src = webpSrc;
      
      img.onload = () => {
        setImageSrc(webpSrc);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        // Fallback to original if WebP fails
        setImageSrc(src);
        setIsLoaded(true);
      };
    }
  }, [src, inView, priority]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur Placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full scale-110 blur-2xl",
            `object-${objectFit}`
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Skeleton Loader */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Main Image */}
      <img
        ref={setRefs}
        src={imageSrc || (priority ? getWebPSrc(src) : '')}
        alt={alt}
        className={cn(
          "w-full h-full transition-opacity duration-700",
          `object-${objectFit}`,
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
