import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface DeviceInfo {
  type: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      orientation: height > width ? 'portrait' : 'landscape',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenWidth: width,
      screenHeight: height,
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
        orientation: height > width ? 'portrait' : 'landscape',
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Update on resize and orientation change
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// Hook for checking if current device is mobile
export const useIsMobile = (): boolean => {
  const { type } = useDeviceDetection();
  return type === 'mobile';
};

// Hook for checking if current device is tablet
export const useIsTablet = (): boolean => {
  const { type } = useDeviceDetection();
  return type === 'tablet';
};

// Hook for checking if current device supports touch
export const useIsTouchDevice = (): boolean => {
  const { isTouchDevice } = useDeviceDetection();
  return isTouchDevice;
};
