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
    primary: 'bg-blue-500',
    secondary: 'bg-blue-100',
    accent: 'bg-blue-700',
  },
  {
    id: 'orange',
    name: 'Laranja Energia',
    primary: 'bg-orange-500',
    secondary: 'bg-orange-100',
    accent: 'bg-orange-700',
  },
  {
    id: 'green',
    name: 'Verde Confiança',
    primary: 'bg-green-500',
    secondary: 'bg-green-100',
    accent: 'bg-green-700',
  },
  {
    id: 'purple',
    name: 'Roxo Sofisticado',
    primary: 'bg-purple-500',
    secondary: 'bg-purple-100',
    accent: 'bg-purple-700',
  },
  {
    id: 'neutral',
    name: 'Neutro Elegante',
    primary: 'bg-gray-700',
    secondary: 'bg-gray-100',
    accent: 'bg-gray-900',
  },
];

export const LayoutColorStep = ({
  selectedLayout,
  selectedColor,
  onLayoutChange,
  onColorChange,
}: LayoutColorStepProps) => {
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
                    <div className={`flex-1 rounded ${color.primary}`} />
                    <div className={`flex-1 rounded ${color.secondary}`} />
                    <div className={`flex-1 rounded ${color.accent}`} />
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
      {selectedLayout && selectedColor && (
        <Card className="bg-gradient-to-br from-muted/50 to-muted border-2">
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Preview da Combinação</Label>
            <div className="bg-background rounded-xl overflow-hidden shadow-lg border-2 border-border">
              {/* Mockup Header */}
              <div className="bg-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-primary-foreground/30 rounded animate-pulse" />
                    <div className="h-2 w-16 bg-primary-foreground/20 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded bg-primary-foreground/20 animate-pulse" />
                  <div className="w-8 h-8 rounded bg-primary-foreground/20 animate-pulse delay-75" />
                  <div className="w-8 h-8 rounded bg-primary-foreground/20 animate-pulse delay-150" />
                </div>
              </div>

              {/* Mockup Hero Section */}
              <div className="bg-secondary/30 p-6">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="h-8 w-3/4 mx-auto bg-foreground/10 rounded animate-pulse" />
                  <div className="h-4 w-full bg-foreground/10 rounded animate-pulse delay-75" />
                  <div className="h-4 w-2/3 mx-auto bg-foreground/10 rounded animate-pulse delay-150" />
                  <div className="flex justify-center gap-3 mt-6">
                    <div className="h-10 w-32 bg-accent rounded-lg animate-pulse" />
                    <div className="h-10 w-32 bg-accent/30 rounded-lg animate-pulse delay-75" />
                  </div>
                </div>
              </div>

              {/* Mockup Content Grid */}
              <div className="p-6 bg-background">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="h-32 bg-secondary rounded-lg animate-pulse" />
                    <div className="h-3 w-full bg-secondary rounded animate-pulse delay-75" />
                    <div className="h-2 w-3/4 bg-muted rounded animate-pulse delay-150" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-32 bg-secondary rounded-lg animate-pulse delay-75" />
                    <div className="h-3 w-full bg-secondary rounded animate-pulse delay-150" />
                    <div className="h-2 w-3/4 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-32 bg-secondary rounded-lg animate-pulse delay-150" />
                    <div className="h-3 w-full bg-secondary rounded animate-pulse" />
                    <div className="h-2 w-3/4 bg-muted rounded animate-pulse delay-75" />
                  </div>
                </div>
              </div>

              {/* Mockup Footer */}
              <div className="bg-accent/10 p-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div className="h-2 w-16 bg-accent rounded animate-pulse" />
                    <div className="h-2 w-16 bg-accent rounded animate-pulse delay-75" />
                    <div className="h-2 w-16 bg-accent rounded animate-pulse delay-150" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/30 animate-pulse" />
                    <div className="w-6 h-6 rounded-full bg-accent/30 animate-pulse delay-75" />
                    <div className="w-6 h-6 rounded-full bg-accent/30 animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Visualização automática da combinação selecionada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
