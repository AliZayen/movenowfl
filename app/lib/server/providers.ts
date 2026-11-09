// Reviews show the first name and last initial only.
export function serializeReview(r: {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  customer: { fullName: string };
}) {
  const [first, last] = r.customer.fullName.trim().split(/\s+/);
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    author: last ? `${first} ${last[0]}.` : first || 'Customer',
    createdAt: r.createdAt.toISOString(),
  };
}
