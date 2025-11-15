import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { TrendingUp, Users, Award } from 'lucide-react';

interface MetricProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  gradient: string;
  delay?: number;
}

const MetricCard: React.FC<MetricProps> = ({
  icon,
  value,
  suffix = '',
  prefix = '',
  label,
  gradient,
  delay = 0
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10">
        <div className="mb-4">{icon}</div>
        
        <div className="text-4xl md:text-5xl font-bold mb-2">
          {prefix}
          {inView && <CountUp end={value} duration={2.5} separator="." />}
          {suffix}
        </div>
        
        <div className="text-white/80 text-sm font-medium">{label}</div>
      </div>

      {/* Glow effect */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
    </motion.div>
  );
};

const MetricsDisplay: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        icon={<Users className="w-8 h-8" />}
        value={500}
        suffix="+"
        label="Corretores Ativos"
        gradient="from-blue-500 to-blue-700"
        delay={0}
      />
      <MetricCard
        icon={<TrendingUp className="w-8 h-8" />}
        value={3200}
        suffix="+"
        label="Leads Gerados/Mês"
        gradient="from-purple-500 to-purple-700"
        delay={0.1}
      />
      <MetricCard
        icon={<Award className="w-8 h-8" />}
        value={4.9}
        suffix="★"
        label="Avaliação Média"
        gradient="from-orange-500 to-orange-700"
        delay={0.2}
      />
    </div>
  );
};

export default MetricsDisplay;
