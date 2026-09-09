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
  tiltMaxAngle = 8,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateX = ((mouseY / height) - 0.5) * -tiltMaxAngle;
    const rotateY = ((mouseX / width) - 0.5) * tiltMaxAngle;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px) scale3d(1.01, 1.01, 1.01)`);
    setGlowPos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)');
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowColorMap = {
    purple: 'rgba(139, 92, 246, 0.25)',
    blue: 'rgba(59, 130, 246, 0.25)',
    orange: 'rgba(249, 115, 22, 0.25)',
    emerald: 'rgba(34, 197, 94, 0.25)',
    teal: 'rgba(20, 184, 166, 0.25)',
    none: 'transparent',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={cn(
        'relative rounded-2xl border border-slate-200/80 dark:border-[#26344D] bg-white/95 dark:bg-[#121A2B] text-slate-900 dark:text-[#F8FAFC] shadow-lg card-3d overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl z-10"
        style={{
          opacity: glowPos.opacity,
          background: `radial-gradient(400px circle at ${glowPos.x}% ${glowPos.y}%, ${glowColorMap[glowColor]}, transparent 70%)`,
        }}
      />
      <div className="relative z-20">{children}</div>
    </div>
  );
}
