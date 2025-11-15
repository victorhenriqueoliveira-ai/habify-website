import React from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
