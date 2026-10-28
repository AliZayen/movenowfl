import React from 'react';
import Icon from '@/app/components/ui/AppIcon';
import { BookingStatus, statusStyles } from '@/app/data/mockData';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const iconByStatus: Record<BookingStatus, string> = {
  Confirmed: 'CheckCircleIcon',
  Pending: 'ClockIcon',
  Completed: 'CheckCircleIcon',
  Cancelled: 'XCircleIcon',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${style.badge} ${className}`}
    >
      <Icon name={iconByStatus[status]} size={12} variant="solid" />
      {status}
    </span>
  );
}