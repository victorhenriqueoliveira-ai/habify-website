import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, TrendingUp, Users } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    name: string;
    url: string;
    image: string;
    type: string;
    description?: string;
    metrics?: {
      leads: string;
      traffic: string;
      conversion: string;
    };
    features?: string[];
  };
}

const LightboxModal: React.FC<LightboxModalProps> = ({ isOpen, onClose, project }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-10 z-50 overflow-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-card rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{project.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Visitar Site</span>
                    </a>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {/* Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    {project.description && (
                      <div>
                        <h4 className="text-lg font-semibold mb-2 text-foreground">Sobre o Projeto</h4>
                        <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                      </div>
                    )}

                    {/* Metrics */}
                    {project.metrics && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-foreground">Resultados</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="text-sm text-muted-foreground">Leads</span>
                            </div>
                            <div className="text-2xl font-bold text-primary">{project.metrics.leads}</div>
                          </div>
                          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-accent" />
                              <span className="text-sm text-muted-foreground">Tráfego</span>
                            </div>
                            <div className="text-2xl font-bold text-accent">{project.metrics.traffic}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {project.features && project.features.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-foreground">Recursos Implementados</h4>
                        <ul className="space-y-2">
                          {project.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-primary mt-1">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LightboxModal;
