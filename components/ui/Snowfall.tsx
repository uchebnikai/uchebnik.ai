
import React, { useEffect, useState } from 'react';

export const Snowfall = ({ active }: { active: boolean }) => {
  const [flakes, setFlakes] = useState<any[]>([]);
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
        setShouldRender(true);
    } else {
        // Allow time for fade out transition before unmounting to save resources
        const timer = setTimeout(() => setShouldRender(false), 2000); 
        return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
    // Reduce flake count slightly for performance (40 instead of 60)
    // Use wider distribution for animation duration
    const newFlakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: Math.random() * 10 + 10 + 's', // Slower, smoother: 10-20s
      animationDelay: -(Math.random() * 20) + 's',
      opacity: Math.random() * 0.5 + 0.1, // More subtle
      fontSize: Math.random() * 1.2 + 0.4 + 'em',
      character: Math.random() > 0.6 ? '❅' : '❆'
    }));
    setFlakes(newFlakes);
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-1000 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}>
      {flakes.map(flake => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
            fontSize: flake.fontSize
          }}
        >
          {flake.character}
        </div>
      ))}
    </div>
  );
};
