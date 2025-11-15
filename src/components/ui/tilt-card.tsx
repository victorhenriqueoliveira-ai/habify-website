import React from 'react';
import Tilt from 'react-parallax-tilt';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngleX?: number;
  tiltMaxAngleY?: number;
  scale?: number;
  glareEnable?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  glareBorderRadius?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  tiltMaxAngleX = 10,
  tiltMaxAngleY = 10,
  scale = 1.05,
  glareEnable = true,
  glareMaxOpacity = 0.2,
  glareColor = '#ffffff',
  glareBorderRadius = '1rem',
}) => {
  return (
    <Tilt
      tiltMaxAngleX={tiltMaxAngleX}
      tiltMaxAngleY={tiltMaxAngleY}
      scale={scale}
      transitionSpeed={400}
      glareEnable={glareEnable}
      glareMaxOpacity={glareMaxOpacity}
      glareColor={glareColor}
      glareBorderRadius={glareBorderRadius}
      className={cn("transform-gpu", className)}
    >
      {children}
    </Tilt>
  );
};

interface AnimatedBorderCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedBorderCard: React.FC<AnimatedBorderCardProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn("relative group", className)}>
      {/* Animated border gradient */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-pulse-500 via-pulse-600 to-pulse-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 animate-[gradient-shift_3s_linear_infinite] bg-[length:200%_auto]"></div>
      
      {/* Content */}
      <div className="relative bg-card rounded-2xl p-6 z-10">
        {children}
      </div>
    </div>
  );
};
