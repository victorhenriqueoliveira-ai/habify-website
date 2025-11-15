import React from 'react';
import { motion } from 'framer-motion';

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

const PricingToggle: React.FC<PricingToggleProps> = ({ isAnnual, onToggle }) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <button
        onClick={() => onToggle(false)}
        className={`text-lg font-semibold transition-colors ${
          !isAnnual ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Mensal
      </button>

      <div className="relative">
        <motion.button
          onClick={() => onToggle(!isAnnual)}
          className="w-16 h-8 rounded-full bg-muted border-2 border-border relative"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-primary shadow-lg"
            animate={{
              x: isAnnual ? 28 : 0,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>

        {/* Discount badge */}
        {isAnnual && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-8 -right-12 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
          >
            Economize 20%
          </motion.div>
        )}
      </div>

      <button
        onClick={() => onToggle(true)}
        className={`text-lg font-semibold transition-colors ${
          isAnnual ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Anual
      </button>
    </div>
  );
};

export default PricingToggle;
