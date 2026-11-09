// Upload limits shared by the server and the browser (so forms can warn before sending).

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB per file, before processing
export const MAX_PHOTOS_PER_BOOKING = 10;
// No HEIC in the picker list on purpose: iPhones then hand the browser a JPEG copy.
export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

/** Message to show for a file that would be refused, or null if it looks fine. */
export function checkImageFile(file: File) {
  if (!file.type.startsWith('image/')) return `${file.name} isn't a photo`;
  if (file.size > UPLOAD_MAX_BYTES) return `${file.name} is over ${UPLOAD_MAX_BYTES / 1024 / 1024} MB`;
  return null;
}
