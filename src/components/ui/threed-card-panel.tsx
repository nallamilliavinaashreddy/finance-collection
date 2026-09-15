'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ThreeDCardPanelProps {
  children: React.ReactNode;
  className?: string;
  depthPx?: number; // base Z offset (default: 12px)
  hoverElevatePx?: number; // extra Z offset on hover (default: 10px)
  borderGlowColor?: string; // default: cyan
}

export function ThreeDCardPanel({
  children,
  className,
  depthPx = 12,
  hoverElevatePx = 10,
  borderGlowColor = 'sky',
}: ThreeDCardPanelProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'threed-card-container relative rounded-2xl transition-all duration-300 ease-out',
        className
      )}
      style={{
        transform: `translateZ(${isHovered ? depthPx + hoverElevatePx : depthPx}px)`,
      }}
    >
      {/* 3D Depth Extrusion Shadow Layer */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300',
          isHovered
            ? 'shadow-[0_16px_32px_-4px_rgba(0,0,0,0.6),0_0_15px_rgba(56,189,248,0.2)] opacity-100'
            : 'shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] opacity-70'
        )}
      />

      {/* Layered Content Child */}
      <div className="preserve-3d relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
