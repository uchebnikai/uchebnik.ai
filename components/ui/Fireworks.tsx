
import React, { useEffect, useState } from 'react';

export const Fireworks = ({ active }: { active: boolean }) => {
  const [bursts, setBursts] = useState<any[]>([]);
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
        setShouldRender(true);
    } else {
        const timer = setTimeout(() => setShouldRender(false), 2000); 
        return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    
    // Generate firework locations
    const generateBursts = () => {
        return Array.from({ length: 12 }).map((_, i) => ({
            id: Math.random(),
            left: Math.random() * 80 + 10 + '%',
            top: Math.random() * 50 + 10 + '%',
            delay: Math.random() * 4 + 's',
            color: ['#fbbf24', '#38bdf8', '#818cf8', '#f472b6', '#4ade80'][Math.floor(Math.random() * 5)]
        }));
    };
    
    setBursts(generateBursts());
    const interval = setInterval(() => setBursts(generateBursts()), 6000);
    return () => clearInterval(interval);
  }, [active]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-1000 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}>
      {bursts.map(burst => (
        <div
          key={burst.id}
          className="firework"
          style={{
            left: burst.left,
            top: burst.top,
            '--fw-color': burst.color,
            animationDelay: burst.delay
          } as any}
        />
      ))}
    </div>
  );
};
