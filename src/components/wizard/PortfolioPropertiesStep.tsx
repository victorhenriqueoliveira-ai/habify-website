import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { useMultipleProjects, PropertyData } from '@/hooks/useMultipleProjects';
import { formatCurrency } from '@/lib/validations';

interface PortfolioPropertiesStepProps {
  projectType: 'corretor' | 'imobiliaria';
  properties: PropertyData[];
  onPropertiesChange: (properties: PropertyData[]) => void;
  errors?: Record<string, string>;
}

const propertyTypeOptions = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'commercial', label: 'Sala Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'warehouse', label: 'Galpão Industrial' },
  { value: 'penthouse', label: 'Cobertura' },
];

const amenitiesOptions = [
  'Piscina',
  'Academia',
  'Portaria 24h',
  'Elevador',
  'Varanda Gourmet',
  'Pet Friendly',
  'Churrasqueira',
  'Salão de Festas',
  'Playground',
  'Quadra Esportiva',
  'Sauna',
  'Jardim',
  'Área de Lazer',
  'Segurança',
];

export const PortfolioPropertiesStep = ({
  projectType,
  properties,
  onPropertiesChange,
  errors = {},
}: PortfolioPropertiesStepProps) => {
  const maxProperties = projectType === 'corretor' ? 5 : 1;
  const maxPhotosPerProperty = projectType === 'corretor' ? 5 : 20;

  const addProperty = () => {
    if (properties.length < maxProperties) {
      onPropertiesChange([
        ...properties,
        {
          title: '',
          location: '',
          price: '',
          propertyType: 'apartment',
          purpose: 'sale',
          bedrooms: '',
          bathrooms: '',
          area: '',
          parkingSpaces: '',
          constructionYear: '',
          floorNumber: '',
          condominiumFee: '',
          iptu: '',
          description: '',
          amenities: [],
          photos: [],
        },
      ]);
    }
  };

  const removeProperty = (index: number) => {
    if (properties.length > 1) {
      onPropertiesChange(properties.filter((_, i) => i !== index));
    }
  };

  const updateProperty = (index: number, field: keyof PropertyData, value: any) => {
    const updated = properties.map((prop, i) =>
      i === index ? { ...prop, [field]: value } : prop
    );
    onPropertiesChange(updated);
  };

  const handlePhotoUpload = (index: number, files: FileList | null) => {
    if (!files) return;

    const currentPhotos = properties[index].photos;
    const newPhotos = Array.from(files);
    const totalPhotos = currentPhotos.length + newPhotos.length;

    if (totalPhotos > maxPhotosPerProperty) {
      alert(`Você pode adicionar no máximo ${maxPhotosPerProperty} fotos por imóvel`);
      return;
    }

    updateProperty(index, 'photos', [...currentPhotos, ...newPhotos]);
  };

  const removePhoto = (propertyIndex: number, photoIndex: number) => {
    const currentPhotos = properties[propertyIndex].photos;
    const updatedPhotos = currentPhotos.filter((_, i) => i !== photoIndex);
    updateProperty(propertyIndex, 'photos', updatedPhotos);
  };

  const toggleAmenity = (propertyIndex: number, amenity: string) => {
    const currentAmenities = properties[propertyIndex].amenities;
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    updateProperty(propertyIndex, 'amenities', updatedAmenities);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Imóveis do Portfólio</h2>
          <p className="text-muted-foreground mt-1">
            {projectType === 'corretor'
              ? `Cadastre até ${maxProperties} imóveis (${maxPhotosPerProperty} fotos cada)`
              : `Cadastre seu empreendimento (até ${maxPhotosPerProperty} fotos)`}
          </p>
        </div>
        {properties.length < maxProperties && (
          <Button onClick={addProperty} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Imóvel
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {properties.map((property, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Imóvel {index + 1} de {properties.length}
                </CardTitle>
                {properties.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProperty(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor={`title-${index}`}>
                    Título do Imóvel <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`title-${index}`}
                    value={property.title}
                    onChange={(e) => updateProperty(index, 'title', e.target.value)}
                    placeholder="Ex: Apartamento 3 quartos no centro"
                  />
                </div>

                <div>
                  <Label htmlFor={`propertyType-${index}`}>
                    Tipo de Imóvel <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={property.propertyType}
                    onValueChange={(value) => updateProperty(index, 'propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`purpose-${index}`}>
                    Finalidade <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={property.purpose}
                    onValueChange={(value) => updateProperty(index, 'purpose', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="rent">Aluguel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`location-${index}`}>
                    Localização <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`location-${index}`}
                    value={property.location}
                    onChange={(e) => updateProperty(index, 'location', e.target.value)}
                    placeholder="Ex: Centro, São Paulo - SP"
                  />
                </div>

               <div>
                  <Label htmlFor={`price-${index}`}>Valor *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id={`price-${index}`}
                      value={property.price}
                      onChange={(e) => {
                        // Remove tudo que não é número
                        const cleanValue = e.target.value.replace(/\D/g, '');
                        
                        if (!cleanValue) {
                          updateProperty(index, 'price', '');
                          return;
                        }
                        
                        // Converte para número dividindo por 100 (centavos)
                        const numberValue = parseFloat(cleanValue) / 100;
                        
                        // Formata para moeda brasileira
                        const formatted = numberValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                        
                        updateProperty(index, 'price', formatted);
                      }}
                      placeholder="0,00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`bedrooms-${index}`}>Quartos</Label>
                  <Input
                    id={`bedrooms-${index}`}
                    type="number"
                    value={property.bedrooms}
                    onChange={(e) => updateProperty(index, 'bedrooms', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`bathrooms-${index}`}>Banheiros</Label>
                  <Input
                    id={`bathrooms-${index}`}
                    type="number"
                    value={property.bathrooms}
                    onChange={(e) => updateProperty(index, 'bathrooms', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`area-${index}`}>
                    Área (m²) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`area-${index}`}
                    type="number"
                    value={property.area}
                    onChange={(e) => updateProperty(index, 'area', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`parkingSpaces-${index}`}>Vagas</Label>
                  <Input
                    id={`parkingSpaces-${index}`}
                    type="number"
                    value={property.parkingSpaces}
                    onChange={(e) => updateProperty(index, 'parkingSpaces', e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`constructionYear-${index}`}>Ano de Construção</Label>
                  <Input
                    id={`constructionYear-${index}`}
                    type="number"
                    value={property.constructionYear}
                    onChange={(e) => updateProperty(index, 'constructionYear', e.target.value)}
                    placeholder="Ex: 2020"
                  />
                </div>

                <div>
                  <Label htmlFor={`floorNumber-${index}`}>Andar</Label>
                  <Input
                    id={`floorNumber-${index}`}
                    type="number"
                    value={property.floorNumber}
                    onChange={(e) => updateProperty(index, 'floorNumber', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`condominiumFee-${index}`}>Condomínio (R$)</Label>
                  <Input
                    id={`condominiumFee-${index}`}
                    type="number"
                    value={property.condominiumFee}
                    onChange={(e) => updateProperty(index, 'condominiumFee', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`iptu-${index}`}>IPTU (R$)</Label>
                  <Input
                    id={`iptu-${index}`}
                    type="number"
                    value={property.iptu}
                    onChange={(e) => updateProperty(index, 'iptu', e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor={`description-${index}`}>Descrição Detalhada</Label>
                <Textarea
                  id={`description-${index}`}
                  value={property.description}
                  onChange={(e) => updateProperty(index, 'description', e.target.value)}
                  placeholder="Descreva os diferenciais e características do imóvel..."
                  rows={4}
                />
              </div>

              {/* Amenities */}
              <div>
                <Label className="mb-3 block">Diferenciais e Amenidades</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenitiesOptions.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${index}-${amenity}`}
                        checked={property.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(index, amenity)}
                      />
                      <label
                        htmlFor={`amenity-${index}-${amenity}`}
                        className="text-sm cursor-pointer"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <Label>
                  Fotos do Imóvel <span className="text-destructive">*</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    (máximo {maxPhotosPerProperty} fotos, JPG/PNG/WEBP, máx. 5MB cada)
                  </span>
                </Label>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    {property.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${photoIndex + 1}`}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removePhoto(index, photoIndex)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {property.photos.length < maxPhotosPerProperty && (
                    <div>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => handlePhotoUpload(index, e.target.files)}
                        className="hidden"
                        id={`photos-${index}`}
                      />
                      <Label
                        htmlFor={`photos-${index}`}
                        className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Adicionar fotos ({property.photos.length}/{maxPhotosPerProperty})
                        </span>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
