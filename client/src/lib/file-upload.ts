/**
 * File upload utilities for Supabase Storage
 */
import { supabase } from './supabase';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const STORAGE_BUCKET = 'model-files';

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds 50MB limit. Please use external URL instead.`,
    };
  }

  // Check if file exists
  if (!file.name) {
    return {
      valid: false,
      error: 'Invalid file - no filename detected.',
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload file with progress tracking
 */
export async function uploadFileWithProgress(
  file: File,
  userId: string,
  modelId: string,
  description: string | undefined,
  onProgress: (progress: number) => void
): Promise<{ url: string; fileId: string }> {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // For progress tracking with Supabase, we'll simulate progress
  // since Supabase JS client doesn't expose upload progress natively
  onProgress(0);

  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${modelId}/${timestamp}_${sanitizedFileName}`;

  try {
    onProgress(30);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    onProgress(60);

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    onProgress(80);

    const { data: fileData, error: dbError } = await supabase
      .from('model_files')
      .insert({
        model_id: modelId,
        file_name: file.name,
        file_type: 'upload',
        file_url: publicUrl,
        file_path: filePath,
        file_size: file.size,
        description: description || null,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    onProgress(100);

    return {
      url: publicUrl,
      fileId: fileData.id,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Save external URL as file reference
 */
export async function saveExternalUrl(
  modelId: string,
  fileName: string,
  url: string,
  description?: string
): Promise<string> {
  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  const { data, error } = await supabase
    .from('model_files')
    .insert({
      model_id: modelId,
      file_name: fileName,
      file_type: 'external_url',
      file_url: url,
      file_path: null,
      file_size: null,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save external URL: ${error.message}`);
  }

  return data.id;
}

/**
 * Delete file from storage and database
 */
export async function deleteFile(fileId: string, filePath?: string): Promise<void> {
  // Delete from database
  const { error: dbError } = await supabase
    .from('model_files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    throw new Error(`Failed to delete file record: ${dbError.message}`);
  }

  // Delete from storage if it's an uploaded file
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      // Don't throw - file record is already deleted
    }
  }
}

/**
 * Fetch files for a model
 */
export async function fetchModelFiles(modelId: string) {
  const { data, error } = await supabase
    .from('model_files')
    .select('*')
    .eq('model_id', modelId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`);
  }

  return data || [];
}

/**
 * Check if user has access to model files
 */
export async function checkFileAccess(
  modelId: string,
  userId: string | null,
  userEmail?: string | null,
  currentRole?: string | null
): Promise<boolean> {
  // Not logged in - no access
  if (!userId) return false;

  // Check if user is publisher of model
  const { data: model, error: modelError } = await supabase
    .from('models')
    .select('publisher_id')
    .eq('id', modelId)
    .single();

  if (modelError) {
    console.error('Error checking model ownership:', modelError);
    return false;
  }

  if (model.publisher_id === userId) return true;

  // Check if user is a collaborator (must be logged in as publisher)
  if (userEmail && currentRole === 'publisher') {
    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('email')
      .eq('model_id', modelId)
      .ilike('email', userEmail);  // Case-insensitive email comparison

    if (collabError) {
      console.error('Error checking collaborator status:', collabError);
    } else if (collaborators && collaborators.length > 0) {
      return true;
    }
  }

  // Check if user has active subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('model_id', modelId)
    .eq('buyer_id', userId)
    .maybeSingle();

  if (subError) {
    console.error('Error checking subscription:', subError);
    return false;
  }

  return subscription?.status === 'active';
}

/**
 * Generate signed URL for file download
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  // Generate signed URL (expires in 1 hour)
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Download file with access control
 */
export async function downloadFile(
  fileId: string,
  filePath: string | null,
  fileName: string,
  modelId: string,
  userId: string | null,
  userEmail?: string | null,
  currentRole?: string | null
): Promise<void> {
  // Check if user has access (includes owner, collaborator, and subscriber checks)
  const hasAccess = await checkFileAccess(modelId, userId, userEmail, currentRole);

  if (!hasAccess) {
    throw new Error('You must be subscribed or be a collaborator to download files from this model.');
  }

  // External URL files don't need signed URL
  if (!filePath) {
    throw new Error('Cannot download external URL files using this method.');
  }

  // Generate signed URL
  const signedUrl = await getFileDownloadUrl(filePath);

  try {
    // Fetch the file as a blob to handle cross-origin downloads properly
    const response = await fetch(signedUrl);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Convert response to blob
    const blob = await response.blob();

    // Create object URL from blob
    const blobUrl = URL.createObjectURL(blob);

    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);

    // Revoke object URL after a short delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download file. Please try again.');
  }
}
