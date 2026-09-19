'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  text: string;
  color: string;
}

export function MoneyRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Preload ₹500 Note Image for Canvas Floating Particle Rendering
    const img = new Image();
    img.src = '/inr-500-note.png';
    imageRef.current = img;

    const noteSymbols = ['₹500', '₹', '₹500', '₹2000', '₹100', '₹500'];
    const noteColors = [
      'rgba(56, 189, 248, ',   // Sky Cyan
      'rgba(168, 85, 247, ',  // Purple
      'rgba(236, 72, 153, ',  // Pink
      'rgba(52, 211, 153, ',  // Emerald Green
    ];

    const particleCount = Math.min(Math.floor(width / 35), 35);
    const particles: Particle[] = [];

    const createParticle = (initialYRandom = false): Particle => {
      const colorBase = noteColors[Math.floor(Math.random() * noteColors.length)];
      const opacity = 0.15 + Math.random() * 0.25;
      return {
        x: Math.random() * width,
        y: initialYRandom ? Math.random() * height : -40,
        size: 24 + Math.random() * 24,
        speedY: 0.5 + Math.random() * 1.0,
        speedX: Math.sin(Math.random() * Math.PI) * 0.4 - 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        opacity,
        text: noteSymbols[Math.floor(Math.random() * noteSymbols.length)],
        color: `${colorBase}${opacity})`,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y / 40) * 0.3 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 50) {
          particles[idx] = createParticle(false);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // If ₹500 note image is loaded, draw mini note image
        if (img.complete && img.naturalWidth > 0 && idx % 2 === 0) {
          ctx.globalAlpha = p.opacity;
          const imgW = p.size * 2.4;
          const imgH = p.size * 1.1;
          ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
        } else {
          // Draw soft glowing banknote rect
          ctx.fillStyle = p.color;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.2)';
          ctx.shadowBlur = 8;

          const rectW = p.size * 2.2;
          const rectH = p.size * 1.1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-rectW / 2, -rectH / 2, rectW, rectH, 4);
          } else {
            ctx.rect(-rectW / 2, -rectH / 2, rectW, rectH);
          }
          ctx.fill();

          // Draw note symbol
          ctx.fillStyle = p.color.replace(/[\d\.]+\)$/, `${p.opacity * 1.8})`);
          ctx.font = `bold ${Math.floor(p.size * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text, 0, 1);
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background ₹500 Currency Note Watermark Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] dark:opacity-[0.14] mix-blend-luminosity scale-105"
        style={{ backgroundImage: `url('/inr-500-note.png')` }}
      />

      {/* Falling Money Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80 dark:opacity-90" />

      {/* Dark Translucent Glass Overlay for Crisp Text Readability */}
      <div className="absolute inset-0 bg-slate-900/10 dark:bg-[#080B14]/75 backdrop-blur-[1px] transition-colors" />

      {/* Radial Ambient Sky-Blue Glow Center Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
    </div>
  );
}
