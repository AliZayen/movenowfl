import { db } from '@/app/lib/server/db';
import { errors, handler, isUuid, json, paginate, parseQuery } from '@/app/lib/server/http';
import { zPagination } from '@/app/lib/validation/common';
import { serializeReview } from '@/app/lib/server/providers';

// GET /api/v1/providers/:id/reviews?page=&pageSize=
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const { page, pageSize } = parseQuery(req, zPagination);
  const exists = isUuid(params.id) && (await db.provider.count({ where: { id: params.id, active: true } })) > 0;
  if (!exists) throw errors.notFound('Provider');

  const where = { providerId: params.id };
  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { fullName: true } } },
    }),
  ]);
  return json({ items: reviews.map(serializeReview), ...paginate(page, pageSize, total) });
});
