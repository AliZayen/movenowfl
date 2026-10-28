'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface DarkAppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const DarkAppLogo = memo(function AppLogo({
  src = '/assets/images/darkLogo.png',
  iconName = 'SparklesIcon',
  size = 60,
  className = '',
  onClick,
}: DarkAppLogoProps) {
  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Show image if src provided, otherwise show icon */}
      {src ? (
        <AppImage
          src={src}
          alt="Logo" 
          className="flex-shrink-0 w-37"
          priority={true}
          unoptimized={src.endsWith('.svg')}
        />
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
    </div>
  );
});

export default DarkAppLogo;
