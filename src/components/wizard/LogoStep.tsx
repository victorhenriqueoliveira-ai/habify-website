import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogoStepProps {
  hasLogo: boolean;
  logoUrl?: string;
  onHasLogoChange: (hasLogo: boolean) => void;
  onLogoUrlChange: (url: string) => void;
}

export const LogoStep = ({
  hasLogo,
  logoUrl,
  onHasLogoChange,
  onLogoUrlChange,
}: LogoStepProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie apenas arquivos de imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      onLogoUrlChange(publicUrl);
      toast.success('Logotipo enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload do logotipo');
    } finally {
      setUploading(false);
    }
  };

  return (
    /* Sem título próprio: o cabeçalho do wizard já anuncia a etapa, e dois
        títulos iguais empilhados só empurram o conteúdo pra baixo. */
    <div className="space-y-6">
      {/* Sem o logo o site usa as iniciais num círculo — funciona, mas os
        *  dois últimos projetos saíram assim por a etapa ser fácil de
        *  passar batido. */}
      {!logoUrl && (
        <p className="rounded-lg border border-warning/30 bg-warning/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed">
          Sem logo, o site mostra as iniciais do nome num círculo. Se você tem um arquivo,
          envie aqui — aparece no topo de todas as páginas.
        </p>
      )}

      <Card>
        <CardContent className="p-6">
          <Label className="block mb-3">Upload do Logotipo</Label>
            
            {logoUrl ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Alterar Logotipo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para fazer upload ou arraste a imagem
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou SVG (máx. 5MB)
                </p>
                {uploading && (
                  <div className="mt-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                )}
              </div>
            )}

          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </CardContent>
      </Card>
    </div>
  );
};
