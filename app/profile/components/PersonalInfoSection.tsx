'use client';

import React, { useRef, useState } from 'react';
import AppImage from '@/app/components/ui/AppImage';
import Icon from '@/app/components/ui/AppIcon';
import ProfileCard from '@/app/profile/components/ProfileCard';

interface PersonalInfoSectionProps {
  name: string;
  onName: (v: string) => void;
  phone: string;
  onPhone: (v: string) => void;
  address: string;
  onAddress: (v: string) => void;
  onNotify: (msg: string) => void;
}

const inputCls =
'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20';

export default function PersonalInfoSection({
  name,
  onName,
  phone,
  onPhone,
  address,
  onAddress,
  onNotify
}: PersonalInfoSectionProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <ProfileCard
      id="personal"
      icon="UserIcon"
      title="Personal Information"
      subtitle="Update your personal details and profile picture.">
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-muted">
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_1a68054ef-1764690567621.png"
                alt="Smiling bearded man with dark hair wearing a navy shirt"
                fill
                sizes="128px"
                className="object-cover" />
              
            </div>
            <button
              type="button"
              aria-label="Upload profile photo"
              onClick={() => photoRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
              
              <Icon name="CameraIcon" size={14} variant="solid" />
            </button>
          </div>
          <input
            ref={photoRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onNotify(`Selected ${e.target.files[0].name}`)} />
          
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-primary transition-colors hover:border-accent hover:text-accent">
            
            <Icon name="ArrowUpTrayIcon" size={14} /> Change Photo
          </button>
          <p className="text-[11px] text-muted-foreground">JPG, PNG (max 5MB)</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full-name" className="mb-1 block text-xs font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input id="full-name" className={inputCls} value={name} onChange={(e) => onName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Icon name="PhoneIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">US</span>
                <input
                  id="phone"
                  className={`${inputCls} pl-16`}
                  value={phone}
                  onChange={(e) => onPhone(e.target.value)} />
                
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Icon name="LockClosedIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                readOnly
                value="john@example.com"
                className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted pl-9 pr-3 text-sm text-muted-foreground" />
              
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Email address cannot be changed.</p>
          </div>
          <div>
            <label htmlFor="address" className="mb-1 block text-xs font-medium text-foreground">
              Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Icon name="MapPinIcon" size={16} className="absolute left-3 top-3.5 text-primary" />
              <input id="address" className={`${inputCls} pl-9`} value={address} onChange={(e) => onAddress(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">Profile Picture</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
              <div className="relative h-24 overflow-hidden rounded-lg bg-muted">
                <AppImage
                  src="https://img.rocket.new/generatedImages/rocket_gen_img_4cb322112-1792263308761.png"
                  alt="MoveNow truck parked in front of Miami high-rise buildings"
                  fill
                  sizes="150px"
                  className="object-cover" />
                
              </div>
              <input
                ref={dropRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onNotify(`Selected ${e.target.files[0].name}`)} />
              
              <button
                type="button"
                onClick={() => dropRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files?.[0]) onNotify(`Selected ${e.dataTransfer.files[0].name}`);
                }}
                className={`flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center transition-colors ${
                dragging ? 'border-accent bg-accent/5' : 'border-border bg-secondary/40 hover:border-accent/50'}`
                }>
                
                <Icon name="CloudArrowUpIcon" size={22} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">Drag &amp; drop photo here</span>
                <span className="text-[11px] text-muted-foreground">or click to browse — up to 5 photos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProfileCard>);

}