'use client';

import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  formatAsCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number; // ms
  decimals?: number;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  formatAsCurrency = false,
  prefix = '',
  suffix = '',
  duration = 600,
  decimals = 0,
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [trendClass, setTrendClass] = useState<string>('');
  const prevValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    // Determine direction for subtle value change indicator
    if (endValue > startValue) {
      setTrendClass('animate-flash-green');
    } else if (endValue < startValue) {
      setTrendClass('animate-flash-red');
    }

    const timer = setTimeout(() => {
      setTrendClass('');
    }, 1200);

    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateNumber);

    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formattedOutput = () => {
    if (formatAsCurrency) {
      return formatCurrency(displayValue);
    }
    const numStr = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();
    return `${prefix}${numStr}${suffix}`;
  };

  return <span className={cn('transition-colors duration-300', trendClass, className)}>{formattedOutput()}</span>;
}
