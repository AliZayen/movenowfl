import type { NextRequest } from 'next/server';
import { db } from '@/app/lib/server/db';
import { clientIp } from '@/app/lib/server/http';
import type { Prisma } from '@/generated/prisma/client';

// Audit log: one row per staff action. Written after the action succeeds; a failed write is logged
// but never undoes the action. Rows are only ever added (no edit or delete endpoint).

export interface AuditEntry {
  action: string;
  targetType: 'booking' | 'provider' | 'user' | 'availability_block';
  targetId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}

export async function audit(req: NextRequest | Request, actor: { id: string }, entry: AuditEntry) {
  try {
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary.slice(0, 500),
        metadata: entry.metadata,
        ip: 'nextUrl' in req ? clientIp(req as NextRequest) : null,
      },
    });
  } catch (e) {
    console.error('[audit] could not write entry', entry.action, e);
  }
}
