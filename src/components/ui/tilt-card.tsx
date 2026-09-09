'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'purple' | 'blue' | 'orange' | 'emerald' | 'teal' | 'none';
  tiltMaxAngle?: number;
}

export function TiltCard({
  children,
  className,
  glowColor = 'purple',
  tiltMaxAngle = 5,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [transform, setTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(15px) scale3d(1, 1, 1)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const baseRotateX = 4;
    const baseRotateY = -5;
    const offsetRotateX = ((mouseY / height) - 0.5) * -tiltMaxAngle;
    const offsetRotateY = ((mouseX / width) - 0.5) * tiltMaxAngle;

    const totalRotateX = baseRotateX + offsetRotateX;
    const totalRotateY = baseRotateY + offsetRotateY;

    setTransform(
      `perspective(1200px) rotateX(${totalRotateX.toFixed(2)}deg) rotateY(${totalRotateY.toFixed(2)}deg) translateY(-26px) translateZ(70px) scale3d(1.045, 1.045, 1.045)`
    );

    setGlowPos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 0.4,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) translateZ(0px) scale3d(1, 1, 1)');
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowColorMap = {
    purple: 'rgba(192, 132, 252, 0.45)',
    blue: 'rgba(96, 165, 250, 0.45)',
    orange: 'rgba(251, 146, 60, 0.45)',
    emerald: 'rgba(74, 222, 128, 0.45)',
    teal: 'rgba(45, 212, 191, 0.45)',
    none: 'transparent',
  };

  const repulsorHaloMap = {
    purple: 'from-[#8B5CF6]/50 via-[#C084FC]/30 to-transparent',
    blue: 'from-[#3B82F6]/50 via-[#60A5FA]/30 to-transparent',
    orange: 'from-[#F97316]/50 via-[#FB923C]/30 to-transparent',
    emerald: 'from-[#22C55E]/50 via-[#4ADE80]/30 to-transparent',
    teal: 'from-[#14B8A6]/50 via-[#2DD4BF]/30 to-transparent',
    none: 'from-transparent to-transparent',
  };

  const shadowRepulsorMap = {
    purple: 'shadow-repulsor-purple',
    blue: 'shadow-repulsor-blue',
    orange: 'shadow-repulsor-orange',
    emerald: 'shadow-repulsor-emerald',
    teal: 'shadow-repulsor-teal',
    none: 'shadow-2xl',
  };

  return (
    <div className="relative group/repulsor transform-gpu">
      {/* Iron-Man Repulsor Ground Shadow Layer (Separated Far Below Card) */}
      <div
        className={cn(
          'pointer-events-none absolute left-4 right-4 -bottom-6 h-8 rounded-full transition-all duration-300 z-0 blur-md opacity-0 scale-90',
          isHovered && 'opacity-90 scale-105 translate-y-6'
        )}
        style={{
          background: glowColorMap[glowColor],
        }}
      />

      {/* Main 3D Levitation Object */}
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform,
          transition: isHovered
            ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
            : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
        className={cn(
          'relative z-10 rounded-2xl border border-slate-200/80 dark:border-[#1F2C42] bg-white/95 dark:bg-[#0E1626] text-slate-900 dark:text-[#F8FAFC] card-3d overflow-hidden transform-gpu',
          isHovered ? shadowRepulsorMap[glowColor] : 'shadow-lg',
          isHovered && 'animate-repulsor-levitation border-[#8B5CF6]/60',
          className
        )}
        {...props}
      >
        {/* Iron-Man Repulsor Energy Ring Beam Underneath Card */}
        {isHovered && (
          <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full bg-radial transition-all duration-300 z-20 opacity-80 animate-repulsor-halo blur-lg"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColorMap[glowColor]}, transparent 70%)`,
            }}
          />
        )}

        {/* Dynamic Moving Glass Sheen Sweep */}
        {isHovered && (
          <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-light-sweep z-30" />
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
    </div>
  );
}
