import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/heroanimation.json';

const HeroAnimation = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full flex items-center justify-center min-h-[600px] relative z-10">
      <Lottie
        animationData={animationData}
        loop={true}
        className="w-full h-full max-w-[7
AI Agents Active on Algorand
AI Agents That
Run Your Supply Chain
From sourcing to settlement — fully automated with agentic AI and secured on Algorand.

Get Started
Watch Demo
1,240+
Deals Negotiated
Live
On Algorand TestNet00px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
      />
    </div>
  );
};

export default HeroAnimation;
