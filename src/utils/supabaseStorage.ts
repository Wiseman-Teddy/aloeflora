import { supabase } from '../lib/supabase';

export const uploadToSupabase = async (file: File, bucket: string = 'images', category: string = 'general'): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected error during upload:', err);
    return null;
  }
};

export const uploadWithProgressToSupabase = async (
  file: File, 
  bucket: string = 'images',
  onProgress?: (progress: number) => void,
  category: string = 'general'
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    if (onProgress) onProgress(10);

    // Simulate progress
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
       let currentProgress = 10;
       progressInterval = setInterval(() => {
          if (currentProgress < 90) {
             currentProgress += 10;
             onProgress(currentProgress);
          }
       }, 200);
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (progressInterval) clearInterval(progressInterval);

    if (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      if (onProgress) onProgress(0);
      return null;
    }

    if (onProgress) onProgress(100);

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected error during upload:', err);
    if (onProgress) onProgress(0);
    return null;
  }
};

export const deleteFromSupabase = async (url: string, bucket: string = 'images'): Promise<boolean> => {
  try {
    if (!url || typeof url !== 'string') return false;
    
    // Handle comma-separated list of URLs
    const urls = url.split(',').map(u => u.trim()).filter(Boolean);
    if (urls.length > 1) {
      const results = await Promise.all(urls.map(u => deleteFromSupabase(u, bucket)));
      return results.some(Boolean);
    }

    const singleUrl = urls[0] || url;
    if (!singleUrl || singleUrl.startsWith('data:')) return false;

    let filePath = '';
    if (singleUrl.includes(`/public/${bucket}/`)) {
      filePath = singleUrl.split(`/public/${bucket}/`)[1];
    } else if (singleUrl.includes(`/${bucket}/`)) {
      filePath = singleUrl.split(`/${bucket}/`)[1];
    } else if (singleUrl.startsWith('/')) {
      filePath = singleUrl.replace(/^\/+/, '');
    } else {
      filePath = singleUrl.split('/').pop() || '';
    }

    if (!filePath) return false;
    filePath = decodeURIComponent(filePath);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting from Supabase storage:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error during deletion:', err);
    return false;
  }
};
