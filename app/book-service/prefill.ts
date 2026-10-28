// Values passed from the landing page quick-estimate form via the URL.
export interface BookingPrefill {
  fromZip?: string;
  toZip?: string;
  date?: string;
}

type SearchParams = { [key: string]: string | string[] | undefined };

const ZIP = /^\d{5}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function readPrefill(sp: SearchParams): BookingPrefill {
  const fromZip = first(sp.fromZip);
  const toZip = first(sp.toZip);
  const date = first(sp.date);
  return {
    fromZip: fromZip && ZIP.test(fromZip) ? fromZip : undefined,
    toZip: toZip && ZIP.test(toZip) ? toZip : undefined,
    date: date && DATE.test(date) ? date : undefined,
  };
}
