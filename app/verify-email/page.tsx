import { redirect } from 'next/navigation';

// Email confirmation now uses a 6-digit code (entered after sign-up, or from Profile for older
// accounts). Old confirmation links land here and go to the profile, where a code can be requested.
export default function VerifyEmailPage() {
  redirect('/profile');
}
