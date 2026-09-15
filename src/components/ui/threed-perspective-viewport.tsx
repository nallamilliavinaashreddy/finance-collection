'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ThreeDPerspectiveViewportProps {
  children: React.ReactNode;
  className?: string;
  maxTiltAngle?: number; // default: 4 degrees
  depthPx?: number; // default: 1200px
}

export function ThreeDPerspectiveViewport({
  children,
  className,
  maxTiltAngle = 4,
  depthPx = 1200,
}: ThreeDPerspectiveViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOrReducedMotion, setIsMobileOrReducedMotion] = useState(false);

  useEffect(() => {
    // Detect mobile touch devices or reduced motion preference
    const checkReducedOrTouch = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsMobileOrReducedMotion(isTouch || isReducedMotion);
    };

    checkReducedOrTouch();
    window.addEventListener('resize', checkReducedOrTouch);
    return () => window.removeEventListener('resize', checkReducedOrTouch);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileOrReducedMotion || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to center (-0.5 to +0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // Inverse Y for rotateX to follow natural tilt
    const targetRotateX = -mouseY * (maxTiltAngle * 2);
    const targetRotateY = mouseX * (maxTiltAngle * 2);

    // Percentage coordinates for radial lighting (0% to 100%)
    const lightX = ((e.clientX - rect.left) / width) * 100;
    const lightY = ((e.clientY - rect.top) / height) * 100;

    requestAnimationFrame(() => {
      setRotateX(targetRotateX);
      setRotateY(targetRotateY);
      setLightPos({ x: lightX, y: lightY });
    });
  };

  const handleMouseEnter = () => {
    if (!isMobileOrReducedMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobileOrReducedMotion) return;
    setIsHovered(false);
    requestAnimationFrame(() => {
      setRotateX(0);
      setRotateY(0);
      setLightPos({ x: 50, y: 50 });
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn('perspective-viewport w-full relative', className)}
      style={{ perspective: `${depthPx}px` }}
    >
      <div
        className="preserve-3d w-full transition-transform duration-200 ease-out"
        style={{
          transform: isHovered && !isMobileOrReducedMotion
            ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
            : 'rotateX(0deg) rotateY(0deg)',
        }}
      >
        {/* Dynamic Interactive Cursor Radial Light Layer */}
        {isHovered && !isMobileOrReducedMotion && (
          <div
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 opacity-40 rounded-3xl"
            style={{
              background: `radial-gradient(600px circle at ${lightPos.x}% ${lightPos.y}%, rgba(56, 189, 248, 0.08), transparent 70%)`,
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
}
