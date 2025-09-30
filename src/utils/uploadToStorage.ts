import { supabase } from '@/integrations/supabase/client';

export const uploadFileToStorage = async (
  file: File,
  bucket: string = 'project-photos',
  path?: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    return null;
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  bucket: string = 'project-photos',
  path?: string
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadFileToStorage(file, bucket, path));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return [];
  }
};
