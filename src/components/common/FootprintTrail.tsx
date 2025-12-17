import { useEffect, useRef, useState } from 'react';

type Footprint = {
  id: number;
  x: number;
  y: number;
  rotation: number;
};

const MAX_FOOTPRINTS = 26;
const LIFETIME_MS = 1100;
const STEP_INTERVAL_MS = 90;

export const FootprintTrail = () => {
  const [prints, setPrints] = useState<Footprint[]>([]);
  const counter = useRef(0);
  const stepIndex = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const now = performance.now();
      if (now - lastTimeRef.current < STEP_INTERVAL_MS) return;
      lastTimeRef.current = now;

      const id = counter.current++;
      const localStep = stepIndex.current % 4;
      stepIndex.current += 1;

      // Simple four-paw gait pattern around the cursor
      const offsets = [
        { dx: -6, dy: 8, rotation: -14 }, // front-left
        { dx: 6, dy: 8, rotation: 14 }, // front-right
        { dx: -5, dy: 14, rotation: -18 }, // back-left
        { dx: 5, dy: 14, rotation: 18 } // back-right
      ];

      const { dx, dy, rotation } = offsets[localStep];

      const footprint: Footprint = {
        id,
        x: event.clientX + dx,
        y: event.clientY + dy,
        rotation
      };

      setPrints((prev) => {
        const next = [...prev, footprint];
        return next.length > MAX_FOOTPRINTS ? next.slice(next.length - MAX_FOOTPRINTS) : next;
      });

      window.setTimeout(() => {
        setPrints((prev) => prev.filter((p) => p.id !== id));
      }, LIFETIME_MS);
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {prints.map((print) => (
        <span
          key={print.id}
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-footprint bg-paw-print"
          style={{ left: print.x, top: print.y, rotate: `${print.rotation}deg` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};


