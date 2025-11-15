import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface BentoCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  title,
  description,
  icon: Icon,
  gradient,
  className = '',
  children,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 p-8 hover:border-primary/50 transition-all duration-300 ${className}`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/50 to-background/80 backdrop-blur-xl" />
      
      {/* Animated gradient border */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${gradient} blur-xl`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon with gradient */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        {children}
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
    </motion.div>
  );
};

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
};
