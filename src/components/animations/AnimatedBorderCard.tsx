import React from 'react';

interface AnimatedBorderCardProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedBorderCard: React.FC<AnimatedBorderCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Animated border gradient */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-500 animate-gradient-shift" />
      
      {/* Card content */}
      <div className="relative bg-card rounded-lg">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBorderCard;
