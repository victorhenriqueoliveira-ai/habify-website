import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import type { LayoutType, ColorPalette, LayoutOption, ColorOption } from '@/types/wizard';

interface LayoutColorStepProps {
  selectedLayout?: LayoutType;
  selectedColor?: ColorPalette;
  onLayoutChange: (layout: LayoutType) => void;
  onColorChange: (color: ColorPalette) => void;
}

const layoutOptions: LayoutOption[] = [
  {
    id: 'classic',
    name: 'Clássico',
    description: 'Design tradicional e elegante',
    preview: 'bg-gradient-to-br from-slate-100 to-slate-200',
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Visual clean e contemporâneo',
    preview: 'bg-gradient-to-br from-blue-100 to-blue-200',
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Simples e sofisticado',
    preview: 'bg-gradient-to-br from-gray-50 to-gray-100',
  },
  {
    id: 'vibrant',
    name: 'Vibrante',
    description: 'Cores fortes e impactantes',
    preview: 'bg-gradient-to-br from-orange-100 to-orange-200',
  },
];

const colorOptions: ColorOption[] = [
  {
    id: 'blue',
    name: 'Azul Profissional',
    primary: '#0B82FF',
    secondary: '#D8EEFF',
    accent: '#0056D6',
  },
  {
    id: 'orange',
    name: 'Laranja Energia',
    primary: '#FF6B35',
    secondary: '#FFE5DC',
    accent: '#CC4417',
  },
  {
    id: 'green',
    name: 'Verde Confiança',
    primary: '#10B981',
    secondary: '#D1FAE5',
    accent: '#047857',
  },
  {
    id: 'purple',
    name: 'Roxo Sofisticado',
    primary: '#8B5CF6',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
  },
  {
    id: 'neutral',
    name: 'Neutro Elegante',
    primary: '#4B5563',
    secondary: '#F3F4F6',
    accent: '#1F2937',
  },
];

export const LayoutColorStep = ({
  selectedLayout,
  selectedColor,
  onLayoutChange,
  onColorChange,
}: LayoutColorStepProps) => {
  // Get the selected color palette object
  const selectedPalette = colorOptions.find(c => c.id === selectedColor);
  
  // CSS variables for the preview
  const previewStyle = selectedPalette ? {
    '--preview-primary': selectedPalette.primary,
    '--preview-secondary': selectedPalette.secondary,
    '--preview-accent': selectedPalette.accent,
  } as React.CSSProperties : {};

  return (
    <div className="space-y-8">
      {/* Layout Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Escolha o Layout</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione o estilo visual do seu site
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {layoutOptions.map((layout) => (
            <Card
              key={layout.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedLayout === layout.id
                  ? 'ring-2 ring-primary'
                  : 'hover:ring-1 hover:ring-border'
              }`}
              onClick={() => onLayoutChange(layout.id)}
            >
              <CardContent className="p-4">
                <div className="relative">
                  <div className={`h-32 rounded-lg ${layout.preview} mb-3`} />
                  {selectedLayout === layout.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{layout.name}</h3>
                <p className="text-sm text-muted-foreground">{layout.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Escolha a Paleta de Cores</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Defina as cores principais do seu site
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {colorOptions.map((color) => (
            <Card
              key={color.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedColor === color.id
                  ? 'ring-2 ring-primary'
                  : 'hover:ring-1 hover:ring-border'
              }`}
              onClick={() => onColorChange(color.id)}
            >
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <div className="flex gap-2 h-20">
                    <div 
                      className="flex-1 rounded" 
                      style={{ backgroundColor: color.primary }}
                    />
                    <div 
                      className="flex-1 rounded" 
                      style={{ backgroundColor: color.secondary }}
                    />
                    <div 
                      className="flex-1 rounded" 
                      style={{ backgroundColor: color.accent }}
                    />
                  </div>
                  {selectedColor === color.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-center">{color.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview */}
      {selectedLayout && selectedColor && selectedPalette && (
        <Card className="bg-gradient-to-br from-muted/50 to-muted border-2">
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Preview da Combinação</Label>
            <div 
              className="bg-background rounded-xl overflow-hidden shadow-lg border-2 border-border"
              style={previewStyle}
            >
              {/* Mockup Header */}
              <div 
                className="p-4 flex items-center justify-between transition-colors duration-300"
                style={{ backgroundColor: 'var(--preview-accent)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full animate-pulse"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  />
                  <div className="space-y-1">
                    <div 
                      className="h-3 w-24 rounded animate-pulse"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                    />
                    <div 
                      className="h-2 w-16 rounded animate-pulse"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[0, 75, 150].map((delay) => (
                    <div 
                      key={delay}
                      className="w-8 h-8 rounded animate-pulse"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        animationDelay: `${delay}ms`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Mockup Hero Section */}
              <div 
                className="p-6 transition-colors duration-300"
                style={{ backgroundColor: 'var(--preview-secondary)' }}
              >
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div 
                    className="h-8 w-3/4 mx-auto rounded animate-pulse"
                    style={{ backgroundColor: 'var(--preview-primary)', opacity: 0.3 }}
                  />
                  <div 
                    className="h-4 w-full rounded animate-pulse"
                    style={{ backgroundColor: 'var(--preview-primary)', opacity: 0.2, animationDelay: '75ms' }}
                  />
                  <div 
                    className="h-4 w-2/3 mx-auto rounded animate-pulse"
                    style={{ backgroundColor: 'var(--preview-primary)', opacity: 0.2, animationDelay: '150ms' }}
                  />
                  <div className="flex justify-center gap-3 mt-6">
                    <div 
                      className="h-10 w-32 rounded-lg animate-pulse transition-colors duration-300"
                      style={{ backgroundColor: 'var(--preview-accent)' }}
                    />
                    <div 
                      className="h-10 w-32 rounded-lg animate-pulse"
                      style={{ backgroundColor: 'var(--preview-accent)', opacity: 0.3, animationDelay: '75ms' }}
                    />
                  </div>
                </div>
              </div>

              {/* Mockup Content Grid */}
              <div className="p-6 bg-background">
                <div className="grid grid-cols-3 gap-4">
                  {[0, 75, 150].map((delay) => (
                    <div key={delay} className="space-y-2">
                      <div 
                        className="h-32 rounded-lg animate-pulse transition-colors duration-300"
                        style={{ 
                          backgroundColor: 'var(--preview-secondary)',
                          animationDelay: `${delay}ms`
                        }}
                      />
                      <div 
                        className="h-3 w-full rounded animate-pulse"
                        style={{ 
                          backgroundColor: 'var(--preview-secondary)',
                          animationDelay: `${delay + 75}ms`
                        }}
                      />
                      <div 
                        className="h-2 w-3/4 rounded animate-pulse"
                        style={{ 
                          backgroundColor: 'var(--preview-primary)', 
                          opacity: 0.2,
                          animationDelay: `${delay + 150}ms`
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup Footer */}
              <div 
                className="p-4 border-t transition-colors duration-300"
                style={{ backgroundColor: 'var(--preview-accent)', opacity: 0.1 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    {[0, 75, 150].map((delay) => (
                      <div 
                        key={delay}
                        className="h-2 w-16 rounded animate-pulse"
                        style={{ 
                          backgroundColor: 'var(--preview-accent)',
                          animationDelay: `${delay}ms`
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[0, 75, 150].map((delay) => (
                      <div 
                        key={delay}
                        className="w-6 h-6 rounded-full animate-pulse"
                        style={{ 
                          backgroundColor: 'var(--preview-accent)', 
                          opacity: 0.3,
                          animationDelay: `${delay}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Visualização em tempo real da combinação selecionada
              </p>
              {selectedPalette && (
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: selectedPalette.primary }}
                    />
                    <span className="text-muted-foreground">Principal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: selectedPalette.secondary }}
                    />
                    <span className="text-muted-foreground">Secundária</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: selectedPalette.accent }}
                    />
                    <span className="text-muted-foreground">Destaque</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
