const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[Supabase Client] Initialized successfully for', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase Client] Initialization warning:', err.message);
  }
} else {
  console.log('[Supabase Client] No SUPABASE_URL or key provided, operating in standard database mode.');
}

/**
 * Storage bucket definitions for Connectly
 */
const BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  STORIES: 'stories',
  VOICE: 'voice-messages'
};

/**
 * Helper to upload buffer/file to Supabase Storage
 */
async function uploadToStorage(bucketName, filePath, fileBuffer, contentType = 'image/jpeg') {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true
    });
  if (error) {
    console.warn('[Supabase Storage Upload Error]', error.message);
    return null;
  }
  const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return publicData?.publicUrl || null;
}

/**
 * Helper to get public URL for asset in Supabase Storage
 */
function getStoragePublicUrl(bucketName, filePath) {
  if (!supabase) return null;
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

module.exports = {
  supabase,
  BUCKETS,
  uploadToStorage,
  getStoragePublicUrl
};
