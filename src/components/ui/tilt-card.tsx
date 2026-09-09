'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'purple' | 'blue' | 'orange' | 'emerald' | 'teal' | 'none';
  tiltMaxAngle?: number;
  enableFlip?: boolean;
}

export function TiltCard({
  children,
  className,
  glowColor = 'purple',
  tiltMaxAngle = 6,
  enableFlip = true,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [transform, setTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(15px) scale3d(1, 1, 1)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (enableFlip) {
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const baseRotateX = 4;
    const baseRotateY = -6;
    const offsetRotateX = ((mouseY / height) - 0.5) * -tiltMaxAngle;
    const offsetRotateY = ((mouseX / width) - 0.5) * tiltMaxAngle;

    const totalRotateX = baseRotateX + offsetRotateX;
    const totalRotateY = baseRotateY + offsetRotateY;
    const flipDeg = isFlipping ? 360 : 0;

    setTransform(
      `perspective(1200px) rotateX(${totalRotateX.toFixed(2)}deg) rotateY(${(totalRotateY + flipDeg).toFixed(2)}deg) translateY(-18px) translateZ(60px) scale3d(1.04, 1.04, 1.04)`
    );

    setGlowPos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsFlipping(false);
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(15px) scale3d(1, 1, 1)');
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowColorMap = {
    purple: 'rgba(139, 92, 246, 0.35)',
    blue: 'rgba(59, 130, 246, 0.35)',
    orange: 'rgba(249, 115, 22, 0.35)',
    emerald: 'rgba(34, 197, 94, 0.35)',
    teal: 'rgba(20, 184, 166, 0.35)',
    none: 'transparent',
  };

  const floatingShadowMap = {
    purple: 'shadow-floating-purple',
    blue: 'shadow-floating-blue',
    orange: 'shadow-floating-orange',
    emerald: 'shadow-floating-emerald',
    teal: 'shadow-floating-teal',
    none: 'shadow-2xl',
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: isFlipping
          ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.6s ease'
          : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        transformOrigin: 'center center',
        willChange: 'transform',
      }}
      className={cn(
        'relative rounded-2xl border border-slate-200/80 dark:border-[#1F2C42] bg-white/95 dark:bg-[#0E1626] text-slate-900 dark:text-[#F8FAFC] card-3d overflow-hidden transform-gpu',
        isHovered ? floatingShadowMap[glowColor] : 'shadow-lg',
        isHovered && !isFlipping && 'animate-float-suspension',
        className
      )}
      {...props}
    >
      {/* Dynamic Moving Glass Sheen Sweep */}
      {isHovered && (
        <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-light-sweep z-30" />
      )}

      {/* Interactive Cursor Spotlight Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl z-10"
        style={{
          opacity: glowPos.opacity,
          background: `radial-gradient(450px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColorMap[glowColor]}, transparent 70%)`,
        }}
      />

      {/* Physical 3D Z-Axis Depth Content Wrapper */}
      <div className="relative z-20 transform-gpu translate-z-[25px]">{children}</div>
    </div>
  );
}
