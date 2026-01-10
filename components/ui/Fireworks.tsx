
import React, { useEffect, useState } from 'react';

export const Fireworks = ({ active }: { active: boolean }) => {
  const [bursts, setBursts] = useState<any[]>([]);
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
        setShouldRender(true);
        const interval = setInterval(() => {
            setBursts(prev => {
                const id = Date.now() + Math.random();
                const newBurst = {
                    id,
                    left: 20 + Math.random() * 60 + '%',
                    top: 20 + Math.random() * 50 + '%',
                    color: ['#facc15', '#60a5fa', '#f87171', '#c084fc'][Math.floor(Math.random() * 4)]
                };
                // Keep only last 5 bursts for performance
                return [...prev, newBurst].slice(-5);
            });
        }, 1500);
        return () => clearInterval(interval);
    } else {
        const timer = setTimeout(() => {
            setShouldRender(false);
            setBursts([]);
        }, 1000); 
        return () => clearTimeout(timer);
    }
  }, [active]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9998] overflow-hidden transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
        {bursts.map(burst => (
            <div 
                key={burst.id}
                className="absolute"
                style={{ left: burst.left, top: burst.top }}
            >
                {/* Center Sparkle */}
                <div 
                    className="w-2 h-2 rounded-full animate-firework-burst"
                    style={{ backgroundColor: burst.color, boxShadow: `0 0 15px ${burst.color}` }}
                />
                {/* Particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-1 h-1 rounded-full animate-firework-particle"
                        style={{ 
                            backgroundColor: burst.color, 
                            boxShadow: `0 0 8px ${burst.color}`,
                            transform: `rotate(${i * 45}deg) translateY(-20px)`,
                            '--particle-dist': '60px'
                        } as any}
                    />
                ))}
            </div>
        ))}
        <style>{`
            @keyframes firework-burst {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.5); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }
            @keyframes firework-particle {
                0% { transform: rotate(var(--rot)) translateY(0); opacity: 1; }
                100% { transform: rotate(var(--rot)) translateY(var(--particle-dist)); opacity: 0; }
            }
            .animate-firework-burst {
                animation: firework-burst 1s ease-out forwards;
            }
            .animate-firework-particle {
                animation: firework-particle 1s ease-out forwards;
            }
        `}</style>
    </div>
  );
};
