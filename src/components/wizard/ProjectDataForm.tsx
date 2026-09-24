import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, Video, X } from 'lucide-react';
import { useViaCep } from '@/hooks/useViaCep';
import { formatPhone, formatCPF } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WizardData, ProfileType, CreciType } from '@/types/wizard';

interface ProjectDataFormProps {
  data: Partial<WizardData>;
  onChange: (field: keyof WizardData, value: string) => void;
  errors: Record<string, string>;
}

const MAX_HERO_VIDEO_MB = 40;

export const ProjectDataForm = ({ data, onChange, errors }: ProjectDataFormProps) => {
  const { searchCep, formatCep, loading: cepLoading } = useViaCep();
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false);

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Envie um arquivo de vídeo (MP4 recomendado)');
      return;
    }
    if (file.size > MAX_HERO_VIDEO_MB * 1024 * 1024) {
      toast.error(`O vídeo deve ter no máximo ${MAX_HERO_VIDEO_MB}MB — comprima ou encurte o clipe`);
      return;
    }

    setUploadingHeroVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `hero-videos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('project-photos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(filePath);
      onChange('heroVideoUrl', publicUrl);
      onChange('heroMediaType', 'video');
      toast.success('Vídeo de capa enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading hero video:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploadingHeroVideo(false);
    }
  };

  const handleCepSearch = async () => {
    if (!data.addressCep) {
      return;
    }
    
    const cleanCep = data.addressCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const address = await searchCep(cleanCep);
      if (address) {
        onChange('addressStreet', address.logradouro || '');
        onChange('addressNeighborhood', address.bairro || '');
        onChange('addressCity', address.localidade || '');
        onChange('addressState', address.uf || '');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold">Dados do Projeto</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha as informações necessárias. Campos com * são obrigatórios.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Profile Type */}
          <div className="space-y-2">
            <Label htmlFor="profileType">Perfil *</Label>
            <Select
              value={data.profileType}
              onValueChange={(value) => onChange('profileType', value as ProfileType)}
            >
              <SelectTrigger className={errors.profileType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o tipo de perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corretor">Corretor de Imóveis</SelectItem>
                <SelectItem value="imobiliaria">Imobiliária</SelectItem>
              </SelectContent>
            </Select>
            {errors.profileType && (
              <p className="text-sm text-destructive">{errors.profileType}</p>
            )}
          </div>

          {/* Owner Name */}
          <div className="space-y-2">
            <Label htmlFor="ownerName">Seu Nome *</Label>
            <Input
              id="ownerName"
              value={data.ownerName || ''}
              onChange={(e) => onChange('ownerName', e.target.value)}
              placeholder="Digite seu nome completo"
              className={errors.ownerName ? 'border-destructive' : ''}
            />
            {errors.ownerName && (
              <p className="text-sm text-destructive">{errors.ownerName}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Imobiliária ou Corretor *</Label>
            <Input
              id="companyName"
              value={data.companyName || ''}
              onChange={(e) => onChange('companyName', e.target.value)}
              placeholder="Ex: Imobiliária Modelo, João Silva Corretor"
              className={errors.companyName ? 'border-destructive' : ''}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* CRECI Number */}
            <div className="space-y-2">
              <Label htmlFor="creciNumber">Nº CRECI *</Label>
              <Input
                id="creciNumber"
                value={data.creciNumber || ''}
                onChange={(e) => onChange('creciNumber', e.target.value)}
                placeholder="00000"
                className={errors.creciNumber ? 'border-destructive' : ''}
              />
              {errors.creciNumber && (
                <p className="text-sm text-destructive">{errors.creciNumber}</p>
              )}
            </div>

            {/* CRECI Type */}
            <div className="space-y-2">
              <Label htmlFor="creciType">Tipo CRECI *</Label>
              <Select
                value={data.creciType}
                onValueChange={(value) => onChange('creciType', value as CreciType)}
              >
                <SelectTrigger className={errors.creciType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="juridico">Jurídico</SelectItem>
                </SelectContent>
              </Select>
              {errors.creciType && (
                <p className="text-sm text-destructive">{errors.creciType}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Endereço</h3>

          <div className="space-y-2">
            <Label htmlFor="addressCep">CEP *</Label>
            <div className="flex gap-2">
              <Input
                id="addressCep"
                value={formatCep(data.addressCep || '')}
                onChange={(e) => onChange('addressCep', e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={errors.addressCep ? 'border-destructive' : ''}
              />
              <Button 
                type="button" 
                onClick={handleCepSearch}
                disabled={cepLoading}
                size="icon"
              >
                {cepLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.addressCep && (
              <p className="text-sm text-destructive">{errors.addressCep}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressStreet">Endereço *</Label>
            <Input
              id="addressStreet"
              value={data.addressStreet || ''}
              onChange={(e) => onChange('addressStreet', e.target.value)}
              placeholder="Rua, Avenida, etc."
              className={errors.addressStreet ? 'border-destructive' : ''}
            />
            {errors.addressStreet && (
              <p className="text-sm text-destructive">{errors.addressStreet}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressNumber">Nº *</Label>
              <Input
                id="addressNumber"
                value={data.addressNumber || ''}
                onChange={(e) => onChange('addressNumber', e.target.value)}
                placeholder="123"
                className={errors.addressNumber ? 'border-destructive' : ''}
              />
              {errors.addressNumber && (
                <p className="text-sm text-destructive">{errors.addressNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input
                id="addressComplement"
                value={data.addressComplement || ''}
                onChange={(e) => onChange('addressComplement', e.target.value)}
                placeholder="Apto, Sala, etc."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressState">Estado *</Label>
              <Input
                id="addressState"
                value={data.addressState || ''}
                onChange={(e) => onChange('addressState', e.target.value)}
                placeholder="SP"
                maxLength={2}
                className={errors.addressState ? 'border-destructive' : ''}
              />
              {errors.addressState && (
                <p className="text-sm text-destructive">{errors.addressState}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressCity">Cidade *</Label>
              <Input
                id="addressCity"
                value={data.addressCity || ''}
                onChange={(e) => onChange('addressCity', e.target.value)}
                placeholder="São Paulo"
                className={errors.addressCity ? 'border-destructive' : ''}
              />
              {errors.addressCity && (
                <p className="text-sm text-destructive">{errors.addressCity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNeighborhood">Bairro *</Label>
              <Input
                id="addressNeighborhood"
                value={data.addressNeighborhood || ''}
                onChange={(e) => onChange('addressNeighborhood', e.target.value)}
                placeholder="Centro"
                className={errors.addressNeighborhood ? 'border-destructive' : ''}
              />
              {errors.addressNeighborhood && (
                <p className="text-sm text-destructive">{errors.addressNeighborhood}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Contato</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input
                id="contactPhone"
                value={formatPhone(data.contactPhone || '')}
                onChange={(e) => onChange('contactPhone', e.target.value.replace(/\D/g, ''))}
                placeholder="(00) 0000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMobile">Celular *</Label>
              <Input
                id="contactMobile"
                value={formatPhone(data.contactMobile || '')}
                onChange={(e) => onChange('contactMobile', e.target.value.replace(/\D/g, ''))}
                placeholder="(00) 00000-0000"
                className={errors.contactMobile ? 'border-destructive' : ''}
                maxLength={15}
              />
              {errors.contactMobile && (
                <p className="text-sm text-destructive">{errors.contactMobile}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">E-mail *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={data.contactEmail || ''}
              onChange={(e) => onChange('contactEmail', e.target.value)}
              placeholder="seu@email.com"
              className={errors.contactEmail ? 'border-destructive' : ''}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmailConfirm">Repetir E-mail *</Label>
            <Input
              id="contactEmailConfirm"
              type="email"
              value={data.contactEmailConfirm || ''}
              onChange={(e) => onChange('contactEmailConfirm', e.target.value)}
              placeholder="seu@email.com"
              className={errors.contactEmailConfirm ? 'border-destructive' : ''}
            />
            {errors.contactEmailConfirm && (
              <p className="text-sm text-destructive">{errors.contactEmailConfirm}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Label className="text-base font-semibold">Avançado (opcional)</Label>

          <div className="space-y-2">
            <Label htmlFor="googleAnalyticsId">ID do Google Analytics (GA4)</Label>
            <Input
              id="googleAnalyticsId"
              value={data.googleAnalyticsId || ''}
              onChange={(e) => onChange('googleAnalyticsId', e.target.value.trim())}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              Se você já tem uma conta do Google Analytics, cole o ID aqui pra acompanhar visitas e
              cliques no WhatsApp do seu site. Deixe em branco se não usar.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Vídeo de Capa (Hero)</Label>
            <p className="text-xs text-muted-foreground">
              Opcional — um vídeo curto (10 a 20s, MP4, máx. {MAX_HERO_VIDEO_MB}MB, já comprimido) toca em
              loop no topo do site em vez da imagem/cor padrão. Deixe em branco se não quiser usar vídeo.
            </p>

            {data.heroVideoUrl ? (
              <div className="space-y-2">
                <video src={data.heroVideoUrl} className="w-full max-w-sm rounded-lg border" controls muted />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange('heroVideoUrl', '');
                    onChange('heroMediaType', '');
                  }}
                  disabled={uploadingHeroVideo}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover vídeo
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('hero-video-upload')?.click()}
              >
                {uploadingHeroVideo ? (
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                ) : (
                  <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploadingHeroVideo ? 'Enviando vídeo...' : 'Clique para enviar o vídeo de capa'}
                </p>
              </div>
            )}
            <input
              id="hero-video-upload"
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={handleHeroVideoUpload}
              disabled={uploadingHeroVideo}
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label>Estatísticas de Credibilidade</Label>
            <p className="text-xs text-muted-foreground">
              Opcional — aparecem em destaque na home (ex: "34+ Imóveis Vendidos"). Deixe em branco pra
              usar só a contagem automática de imóveis cadastrados.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statsPropertiesSold" className="text-xs text-muted-foreground">Imóveis vendidos</Label>
                <Input
                  id="statsPropertiesSold"
                  type="number"
                  min={0}
                  value={data.statsPropertiesSold || ''}
                  onChange={(e) => onChange('statsPropertiesSold', e.target.value)}
                  placeholder="Ex: 34"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statsYearsExperience" className="text-xs text-muted-foreground">Anos de experiência</Label>
                <Input
                  id="statsYearsExperience"
                  type="number"
                  min={0}
                  value={data.statsYearsExperience || ''}
                  onChange={(e) => onChange('statsYearsExperience', e.target.value)}
                  placeholder="Ex: 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statsHappyClients" className="text-xs text-muted-foreground">Clientes satisfeitos</Label>
                <Input
                  id="statsHappyClients"
                  type="number"
                  min={0}
                  value={data.statsHappyClients || ''}
                  onChange={(e) => onChange('statsHappyClients', e.target.value)}
                  placeholder="Ex: 60"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
