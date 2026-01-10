
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
    this.friction = 0.96; 
    this.gravity = 0.025;
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 5 + 2; 
    this.velocity = {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity
    };
    
    this.decay = Math.random() * 0.01 + 0.005; 
    this.maxHistory = 12;
    // Pre-populate history to prevent initial jump/flicker
    this.history = Array(this.maxHistory).fill({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;

    ctx.save();
    // Add subtle twinkle by jittering alpha
    const twinkle = Math.random() * 0.2;
    ctx.globalAlpha = Math.max(0, this.alpha - twinkle);
    
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
    
    // Ambient glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    
    ctx.stroke();
    
    // Draw the core ember
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; // Hot white core
    ctx.fill();
    
    ctx.restore();
  }

  update() {
    this.history.shift();
    this.history.push({ x: this.x, y: this.y });

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
    // Festive Neon Palette
    const colors = ['#fde68a', '#fbbf24', '#ffffff', '#818cf8', '#f472b6', '#22d3ee', '#c084fc'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 35; 
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
    const burstDelay = 3800; // Elegant, infrequent bursts

    const animate = (time: number) => {
      // Clear frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastBurstTime > burstDelay) {
        // Spawn ONLY in the sky region (Top 40% of the Sofia background)
        // We focus on the darker areas to avoid the cathedral's golden dome
        createBurst(
          Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          Math.random() * canvas.height * 0.3 + canvas.height * 0.05
        );
        lastBurstTime = time;
      }

      // Update and Draw
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
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
};
