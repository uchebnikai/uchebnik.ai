
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
  history: { x: number; y: number }[];
  maxHistory: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    this.size = Math.random() * 2 + 1;
    this.friction = 0.97; 
    this.gravity = 0.02;
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 4 + 1; 
    this.velocity = {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity
    };
    
    this.decay = Math.random() * 0.008 + 0.005; 
    this.history = [];
    this.maxHistory = 15; // Controls trail length
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.history.length < 2) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Draw the shimmering trail
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Add glow
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    
    ctx.stroke();
    
    // Draw the "head" spark
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; // Brilliant white core
    ctx.fill();
    
    ctx.restore();
  }

  update() {
    // Add current position to history for trail
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
        this.history.shift();
    }

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
    // Elegant Festive Palette
    const colors = ['#fde68a', '#fbbf24', '#ffffff', '#818cf8', '#f472b6', '#4ade80'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 30; 
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(x, y, color));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!active) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      particlesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    let lastBurstTime = 0;
    const burstDelay = 3500; // Elegant spacing

    const animate = (time: number) => {
      // Clean frame-by-frame clearing prevents ghosting/transparent leftovers
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastBurstTime > burstDelay) {
        createBurst(
          Math.random() * canvas.width * 0.7 + canvas.width * 0.15,
          Math.random() * canvas.height * 0.4 + canvas.height * 0.1
        );
        lastBurstTime = time;
      }

      // Update and Draw particles
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
