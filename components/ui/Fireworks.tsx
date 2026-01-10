
import React, { useEffect, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };
  alpha: number;
  friction: number;
  gravity: number;
  decay: number;
  size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    this.size = Math.random() * 1.5 + 0.5;
    this.friction = 0.985; // Much higher friction for more controlled "gliding"
    this.gravity = 0.015;  // Very low gravity for "floating" effect
    
    // Softer initial explosion
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 3 + 1; 
    this.velocity = {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity
    };
    
    // Slower decay for longer-lasting trails
    this.decay = Math.random() * 0.006 + 0.004; 
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    // Add glow effect
    ctx.shadowBlur = 4;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.y += this.gravity;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }
}

export const Fireworks = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const createBurst = (x: number, y: number) => {
    // Gala palette: Gold, Amber, White, Soft Blue
    const colors = ['#fde68a', '#fbbf24', '#ffffff', '#93c5fd', '#d1d5db'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 35; 
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(x, y, color));
    }
  };

  useEffect(() => {
    if (!active) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    let lastBurstTime = 0;
    const burstDelay = 4000; // Infrequent, elegant bursts every 4 seconds

    const animate = (time: number) => {
      // Instead of clearRect, we fill with semi-transparent black to create "trails"
      // If we are in dark mode, this looks like long-exposure photography
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter'; // Particles "glow" when they overlap

      if (time - lastBurstTime > burstDelay) {
        createBurst(
          Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
          Math.random() * canvas.height * 0.4 + canvas.height * 0.1
        );
        lastBurstTime = time;
      }

      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
      particlesRef.current.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
};
