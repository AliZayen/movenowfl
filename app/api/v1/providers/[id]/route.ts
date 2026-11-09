import { serializeProvider } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import { errors, handler, isUuid, json } from '@/app/lib/server/http';
import { serializeReview } from '@/app/lib/server/providers';

// GET /api/v1/providers/:id — public profile with services, areas and the latest reviews.
// The phone number is not public; customers get it on their confirmed booking.
export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const provider = isUuid(params.id)
    ? await db.provider.findFirst({
        where: { id: params.id, active: true },
        include: {
          serviceAreas: { where: { active: true }, select: { name: true } },
          reviews: { orderBy: { createdAt: 'desc' }, take: 5, include: { customer: { select: { fullName: true } } } },
        },
      })
    : null;
  if (!provider) throw errors.notFound('Provider');

  return json({
    provider: {
      ...serializeProvider(provider),
      services: provider.services,
      serviceAreas: provider.serviceAreas.map((a) => a.name),
      recentReviews: provider.reviews.map(serializeReview),
    },
  });
});

