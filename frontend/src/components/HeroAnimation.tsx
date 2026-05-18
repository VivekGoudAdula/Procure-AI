import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/heroanimation.json';

/**
 * HeroAnimation - Lottie animation rendered with performance optimizations.
 * - progressiveLoad: defers segment decoding to reduce initial jank
 * - speed: throttled to 0.7x to reduce per-frame CPU workload
 * - rendererSettings: preserveAspectRatio keeps layout stable while scaling
 */
const HeroAnimation = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer mount until after first paint to avoid blocking LCP
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="w-full h-full flex items-center justify-center min-h-[600px] relative z-10"
      style={{ willChange: 'transform' }}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        speed={0.7}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
          hideOnTransparent: true,
        }}
        className="w-full h-full max-w-[700px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
      />
    </div>
  );
};

export default HeroAnimation;
