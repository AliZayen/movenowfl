'use client';

import React, { useRef, useState } from 'react';
import Icon from '@/app/components/ui/AppIcon';
import SectionCard from '@/app/book-service/components/SectionCard';

interface PhotosSectionProps {
  onNotify: (msg: string) => void;
}

export default function PhotosSection({ onNotify }: PhotosSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const names = Array.from(list).map((f) => f.name);
    const next = [...files, ...names].slice(0, 5);
    if (files.length + names.length > 5) onNotify('Only up to 5 photos are allowed');
    setFiles(next);
  };

  return (
    <SectionCard step={4} icon="CameraIcon" title="Add Photos" subtitle="Help us get a better idea of your items (optional).">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <button
        type="button"
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
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-border bg-secondary/40 hover:border-accent/50'
        }`}
      >
        <Icon name="CloudArrowUpIcon" size={30} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Drag &amp; drop photos here</span>
        <span className="text-xs text-muted-foreground">or click to browse — up to 5 photos</span>
      </button>
      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li
              key={`${f}-${i}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground"
            >
              <Icon name="PhotoIcon" size={14} className="text-accent" />
              <span className="max-w-40 truncate">{f}</span>
              <button
                type="button"
                aria-label={`Remove ${f}`}
                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
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
