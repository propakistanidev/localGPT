import React, { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  const [glitchText, setGlitchText] = useState(text);
  
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
  
  useEffect(() => {
    let animationId: number;
    
    const glitchEffect = () => {
      const iterations = Math.floor(Math.random() * 10) + 5;
      let currentIteration = 0;
      
      const animate = () => {
        if (currentIteration < iterations) {
          // Create glitched version
          const glitched = text
            .split('')
            .map((char, index) => {
              if (Math.random() < 0.3) {
                return chars[Math.floor(Math.random() * chars.length)];
              }
              return char;
            })
            .join('');
          
          setGlitchText(glitched);
          currentIteration++;
          
          animationId = requestAnimationFrame(() => {
            setTimeout(animate, 50);
          });
        } else {
          // Return to original text
          setGlitchText(text);
          
          // Schedule next glitch
          setTimeout(() => {
            glitchEffect();
          }, 2000 + Math.random() * 3000);
        }
      };
      
      animate();
    };
    
    // Start the effect
    glitchEffect();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [text]);
  
  return (
    <span className={`inline-block font-mono ${className}`}>
      {glitchText}
    </span>
  );
};

export default GlitchText;
