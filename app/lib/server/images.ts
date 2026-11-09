import sharp, { type Sharp } from 'sharp';
import { ApiError, errors } from '@/app/lib/server/http';
import { UPLOAD_MAX_BYTES } from '@/app/lib/uploads';

// Every uploaded image is decoded and re-encoded to WebP, which:
// - checks it really is an image (the file's bytes decide, not its name or the browser's label),
// - strips metadata such as GPS location from phone photos,
// - applies the camera rotation, and resizes it so pages stay fast.

const MAX_INPUT_PIXELS = 50_000_000; // refuses "decompression bombs" (tiny files that expand hugely)
const ACCEPTED = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff']);

export interface ProcessedImage {
  body: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

const invalid = () => errors.validation("That file isn't a photo we can read. Use a JPG, PNG or WebP image.", { file: 'Unsupported image' });

async function decode(input: Buffer) {
  try {
    const img = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error', animated: false });
    const meta = await img.metadata();
    if (!meta.format || !ACCEPTED.has(meta.format)) throw invalid();
    return img.rotate(); // apply EXIF orientation before metadata is dropped
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw invalid();
  }
}

async function encode(img: Sharp, quality: number): Promise<ProcessedImage> {
  try {
    const { data, info } = await img.webp({ quality }).toBuffer({ resolveWithObject: true });
    return { body: data, width: info.width, height: info.height, sizeBytes: data.length };
  } catch {
    throw invalid();
  }
}

/** Square profile picture, 512×512, cropped around the middle. */
export async function processAvatar(input: Buffer) {
  const img = await decode(input);
  return encode(img.resize(512, 512, { fit: 'cover', position: 'attention' }), 82);
}

/** Booking photo (max 2048 px on the long side) plus a 480 px thumbnail for grids. */
export async function processPhoto(input: Buffer) {
  const img = await decode(input);
  const [full, thumb] = await Promise.all([
    encode(img.clone().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }), 82),
    encode(img.clone().resize(480, 480, { fit: 'inside', withoutEnlargement: true }), 75),
  ]);
  return { full, thumb };
}

/** Reads the single `file` field of a multipart upload, enforcing the size limit. */
export async function readUpload(req: Request): Promise<{ data: Buffer; name: string }> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > UPLOAD_MAX_BYTES + 64 * 1024) throw tooLarge();
  if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) {
    throw errors.validation('Send the photo as multipart/form-data in a field named "file"');
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw errors.validation('The upload was interrupted. Please try again.');
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) throw errors.validation('Choose a photo to upload', { file: 'Required' });
  if (file.size > UPLOAD_MAX_BYTES) throw tooLarge();
  return { data: Buffer.from(await file.arrayBuffer()), name: cleanName(file.name) };
}

const tooLarge = () => new ApiError(413, 'FILE_TOO_LARGE', `Photos can be up to ${UPLOAD_MAX_BYTES / 1024 / 1024} MB`);

/** Keeps a readable original name for the UI, without paths or odd characters. */
function cleanName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[^\w.\- ()]+/g, '').trim().slice(0, 120);
  return cleaned || 'photo';
}
