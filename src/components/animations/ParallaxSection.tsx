import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // -1 to 1, negative for reverse parallax
  id?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className,
  speed = 0.5,
  id
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

  return (
    <div ref={ref} className={cn("relative", className)} id={id}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
};

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  zIndex?: number;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  className,
  speed = 0.5,
  zIndex = 0
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, zIndex }}
      className={cn("absolute inset-0", className)}
    >
      {children}
    </motion.div>
  );
};
