import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  endDate?: Date;
  showDays?: boolean;
  compact?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  showDays = true,
  compact = false,
}) => {
  // Default: 24 hours from now
  const defaultEndDate = new Date();
  defaultEndDate.setHours(defaultEndDate.getHours() + 24);

  const targetDate = endDate || defaultEndDate;

  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    if (compact) {
      return (
        <div className="flex items-baseline gap-1">
          <motion.span
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl md:text-3xl font-bold text-primary"
          >
            {String(value).padStart(2, '0')}
          </motion.span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <motion.div
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg"
        >
          <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
            {String(value).padStart(2, '0')}
          </span>
        </motion.div>
        <span className="text-xs md:text-sm text-muted-foreground mt-2 font-medium">
          {label}
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
        <span className="text-sm text-muted-foreground font-medium">Oferta termina em:</span>
        <div className="flex items-center gap-2">
          {showDays && timeLeft.days > 0 && (
            <>
              <TimeUnit value={timeLeft.days} label="d" />
              <span className="text-muted-foreground">:</span>
            </>
          )}
          <TimeUnit value={timeLeft.hours} label="h" />
          <span className="text-muted-foreground">:</span>
          <TimeUnit value={timeLeft.minutes} label="m" />
          <span className="text-muted-foreground">:</span>
          <TimeUnit value={timeLeft.seconds} label="s" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-3 md:gap-4">
      {showDays && timeLeft.days > 0 && (
        <>
          <TimeUnit value={timeLeft.days} label="Dias" />
          <span className="text-2xl text-muted-foreground font-bold">:</span>
        </>
      )}
      <TimeUnit value={timeLeft.hours} label="Horas" />
      <span className="text-2xl text-muted-foreground font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="Minutos" />
      <span className="text-2xl text-muted-foreground font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="Segundos" />
    </div>
  );
};

export default CountdownTimer;
