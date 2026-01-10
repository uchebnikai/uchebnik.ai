
import React, { useEffect, useState } from 'react';

export const Fireworks = ({ active }: { active: boolean }) => {
  const [elements, setElements] = useState<any[]>([]);
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
      setShouldRender(true);
      // Spawn initial bursts
      const initial = Array.from({ length: 12 }).map((_, i) => createBurst(i));
      setElements(initial);
      
      const interval = setInterval(() => {
        setElements(prev => {
           const next = [...prev];
           if (next.length > 20) next.shift(); // Keep count low for performance
           return [...next, createBurst(Date.now())];
        });
      }, 1500);

      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const createBurst = (id: any) => {
    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 60;
    const colors = ['#06b6d4', '#22d3ee', '#3b82f6', '#6366f1', '#ffffff', '#fbbf24'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      id,
      x: `${x}%`,
      y: `${y}%`,
      color,
      size: Math.random() * 100 + 150 + 'px'
    };
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-1000 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}>
      {elements.map(burst => (
        <div
          key={burst.id}
          className="firework-burst"
          style={{
            left: burst.x,
            top: burst.y,
            '--fw-color': burst.color,
            '--fw-size': burst.size,
          } as any}
        >
           {/* Particle dots */}
           {Array.from({length: 12}).map((_, i) => (
               <div 
                key={i} 
                className="firework-particle" 
                style={{'--angle': `${i * 30}deg`} as any}
               />
           ))}
        </div>
      ))}
      <style>{`
        .firework-burst {
          position: absolute;
          width: var(--fw-size);
          height: var(--fw-size);
          transform: translate(-50%, -50%);
        }
        .firework-particle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          background: var(--fw-color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--fw-color);
          animation: fw-explode 1.5s ease-out forwards;
        }
        @keyframes fw-explode {
          0% { transform: rotate(var(--angle)) translateY(0); opacity: 1; scale: 1; }
          100% { transform: rotate(var(--angle)) translateY(calc(var(--fw-size) / 2)); opacity: 0; scale: 0; }
        }
      `}</style>
    </div>
  );
};
