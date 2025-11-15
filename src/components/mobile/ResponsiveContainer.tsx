import React from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobileContent?: React.ReactNode;
  tabletContent?: React.ReactNode;
  desktopContent?: React.ReactNode;
  className?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobileContent,
  tabletContent,
  desktopContent,
  className = '',
}) => {
  const { type } = useDeviceDetection();

  // If specific content is provided for current device type, use it
  if (type === 'mobile' && mobileContent) {
    return <div className={className}>{mobileContent}</div>;
  }

  if (type === 'tablet' && tabletContent) {
    return <div className={className}>{tabletContent}</div>;
  }

  if (type === 'desktop' && desktopContent) {
    return <div className={className}>{desktopContent}</div>;
  }

  // Otherwise, render default children
  return <div className={className}>{children}</div>;
};

export default ResponsiveContainer;
