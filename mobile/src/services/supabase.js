import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials
export const SUPABASE_URL = 'https://pnqfopgpoqzscozygdlg.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_OHlY4JsUy7OdnI57Bdhp1Q_QVX2VD0E';

/**
 * Client-side Supabase instance for Connectly Mobile
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  STORIES: 'stories',
  VOICE: 'voice-messages'
};

/**
 * Upload an image, story, or audio file to Supabase Storage
 */
export async function uploadMedia(bucket, filePath, fileBlob, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBlob, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicData.publicUrl, path: filePath };
  } catch (err) {
    console.error(`[Supabase Upload Error] (${bucket}):`, err.message);
    throw err;
  }
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getMediaPublicUrl(bucket, filePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

export default supabase;
