'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';
import { ACCEPTED_IMAGE_TYPES, checkImageFile, MAX_PHOTOS_PER_BOOKING, UPLOAD_MAX_BYTES } from '@/app/lib/uploads';

interface PhotosSectionProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  onNotify: (msg: string) => void;
}

// Photos are kept in the browser until "Request booking"; they upload right after the booking is created.
export default function PhotosSection({ photos, onChange, onNotify }: PhotosSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const ok: File[] = [];
    for (const f of Array.from(list)) {
      const problem = checkImageFile(f);
      if (problem) onNotify(problem);
      else ok.push(f);
    }
    const room = MAX_PHOTOS_PER_BOOKING - photos.length;
    if (ok.length > room) onNotify(`Up to ${MAX_PHOTOS_PER_BOOKING} photos per booking`);
    onChange([...photos, ...ok.slice(0, Math.max(0, room))]);
    if (inputRef.current) inputRef.current.value = ''; // lets the same file be picked again after removing it
  };

  const full = photos.length >= MAX_PHOTOS_PER_BOOKING;

  return (
    <SectionCard step={4} icon="CameraIcon" title="Add Photos" subtitle="Optional. Photos of large or tricky items help your pro come prepared.">
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      <button
        type="button"
        disabled={full}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          dragging ? 'border-accent bg-accent/5' : 'border-border bg-secondary/40 hover:border-accent/50'
        }`}
      >
        <Icon name="CloudArrowUpIcon" size={30} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">{full ? 'Photo limit reached' : 'Drag & drop photos here'}</span>
        <span className="text-xs text-muted-foreground">
          or click to browse · up to {MAX_PHOTOS_PER_BOOKING} photos, {UPLOAD_MAX_BYTES / 1024 / 1024} MB each (JPG, PNG, WebP)
        </span>
      </button>

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((f, i) => (
            <li key={`${f.name}-${f.lastModified}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              <Preview file={f} />
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/** Local preview of a picked file, read in the browser (nothing is uploaded yet). */
function Preview({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- local preview, nothing to optimize
  return <img src={src} alt={file.name} className="h-full w-full object-cover" />;
}
