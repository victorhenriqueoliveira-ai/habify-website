import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  fullWidth = false,
  disabled = false,
}) => {
  // Minimum touch target size: 44x44px (iOS) / 48x48px (Android)
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-3 text-sm',
    md: 'min-h-[48px] px-6 py-4 text-base',
    lg: 'min-h-[52px] px-8 py-5 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20',
    ghost: 'text-foreground hover:bg-muted active:bg-muted/80',
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-xl font-bold
    transition-all duration-200
    touch-manipulation
    disabled:opacity-50 disabled:pointer-events-none
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </>
  );

  const MotionComponent = motion.button;

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        className={baseClasses}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <MotionComponent
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {content}
    </MotionComponent>
  );
};

export default TouchOptimizedButton;
