
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

  constructor(x: number, y: number, color: string, burstPower: number) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    
    // Randomize size per particle
    this.size = Math.random() * 2.5 + 0.5;
    
    // Vary friction and gravity slightly to make some particles "float" more than others
    this.friction = 0.94 + Math.random() * 0.04; 
    this.gravity = 0.02 + Math.random() * 0.02;
    
    const angle = Math.random() * Math.PI * 2;
    // Speed is determined by individual randomness multiplied by the burst's global power
    const speed = (Math.random() * 4 + 1) * burstPower; 
    
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    
    // Randomize decay so some sparks last longer
    this.decay = Math.random() * 0.012 + 0.003; 
    this.maxHistory = Math.floor(Math.random() * 10) + 8;
    this.history = Array(this.maxHistory).fill({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;

    ctx.save();
    // Twinkle effect
    const twinkle = Math.random() * 0.3;
    ctx.globalAlpha = Math.max(0, this.alpha - twinkle);
    
    // Draw trail
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.stroke();
    
    // Spark core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
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
    const colors = ['#fde68a', '#fbbf24', '#ffffff', '#818cf8', '#f472b6', '#22d3ee', '#c084fc', '#4ade80'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Randomize burst size (number of particles) and power (speed)
    const particleCount = Math.floor(Math.random() * 40) + 20; 
    const burstPower = Math.random() * 1.5 + 0.8; // Some are explosive, some are gentle
    
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle(x, y, color, burstPower));
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
    // Randomize the delay between bursts for a more natural look
    let nextBurstDelay = 2000 + Math.random() * 3000;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastBurstTime > nextBurstDelay) {
        // Explode in the sky (top 40%)
        createBurst(
          Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          Math.random() * canvas.height * 0.35 + canvas.height * 0.05
        );
        lastBurstTime = time;
        nextBurstDelay = 1500 + Math.random() * 3500;
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
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
};
