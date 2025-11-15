import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
}

export const MagneticButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, MagneticButtonProps>(
  ({ children, className, magneticStrength = 0.3, as = 'button', href, target, rel, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * magneticStrength;
      const deltaY = (e.clientY - centerY) * magneticStrength;

      setPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    const Component = as === 'a' ? motion.a : motion.button;

    return (
      <Component
        {...(as === 'a' 
          ? { href, target, rel } as any
          : props as any)}
        ref={buttonRef as any}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        className={cn(
          "relative overflow-hidden cursor-pointer",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </Component>
    );
  }
);

MagneticButton.displayName = "MagneticButton";
