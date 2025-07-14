import React from 'react';
import './MagicBento.css';

interface MagicBentoProps {
  children: React.ReactNode;
  className?: string;
}

const MagicBento: React.FC<MagicBentoProps> = ({ children, className = '' }) => {
  return (
    <div className={`magic-bento ${className}`}>
      {children}
    </div>
  );
};

export default MagicBento;
