import React, { useEffect, useRef, useState } from 'react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

const ParallaxLayer: React.FC<ParallaxLayerProps> = ({ 
  children, 
  speed = 0.5, 
  className = '' 
}) => {
  const [offset, setOffset] = useState(0);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!layerRef.current) return;
      
      const scrolled = window.pageYOffset;
      const rect = layerRef.current.getBoundingClientRect();
      const elementTop = rect.top + scrolled;
      
      // Only apply parallax when element is near viewport
      if (scrolled > elementTop - window.innerHeight && scrolled < elementTop + rect.height) {
        setOffset((scrolled - elementTop) * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={layerRef}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxLayer;
