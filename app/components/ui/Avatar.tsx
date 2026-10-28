import React from 'react';
import AppImage from '@/app/components/ui/AppImage';

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export default function Avatar({ src, alt, size = 40, className = '' }: AvatarProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-muted ${className}`}
      style={{ width: size, height: size }}
    >
      <AppImage src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />
    </div>
  );
}