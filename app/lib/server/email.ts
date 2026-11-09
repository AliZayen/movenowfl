import nodemailer, { type Transporter } from 'nodemailer';

// Email sending over SMTP (Gmail works: smtp.gmail.com + an App Password; see .env.example).
// Without SMTP_HOST, development prints each email to the server console so codes can still be
// used, and production refuses to send (sendEmail throws, so callers can tell the user).

interface Email {
  to: string;
  subject: string;
  text: string;
}

export class EmailError extends Error {}

const mask = (email: string) => email.replace(/^(.).*(@.*)$/, '$1***$2');

// One connection pool per server process; reused across hot reloads in dev.
const globalForMail = globalThis as unknown as { mailer?: Transporter };

function mailer() {
  if (!process.env.SMTP_HOST) return null;
  if (!globalForMail.mailer) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    globalForMail.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replace(/\s+/g, '') } : undefined,
      pool: true,
    });
  }
  return globalForMail.mailer;
}

// Reserved test domains (RFC 2606/6761) can never receive mail, e.g. the seeded @movenow.test
// accounts. Print those instead of sending them through the real mail account.
const isTestAddress = (to: string) => /\.(test|example|invalid|localhost)$/i.test(to.split('@')[1] ?? '');

export async function sendEmail(email: Email) {
  const transport = mailer();
  if (!transport || isTestAddress(email.to)) {
    if (process.env.NODE_ENV === 'production') {
      if (!transport) throw new EmailError('Email is not configured (set SMTP_HOST)');
      console.warn(`[email] not sent to reserved test address ${mask(email.to)}`); // never log codes in production
      return;
    }
    console.info(`\n[email:dev] to ${mask(email.to)} — ${email.subject}\n${email.text}\n`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: email.to,
      subject: email.subject,
      text: email.text,
    });
    console.info(`[email] sent to ${mask(email.to)} — "${email.subject.replace(/\d{6}/g, '******')}"`);
  } catch (e) {
    // Log the reason (bad password, blocked, ...) without the message body, which may hold a code.
    console.error(`[email] failed to send to ${mask(email.to)}:`, (e as Error).message);
    throw new EmailError('Could not send the email');
  }
}

export function appUrl(path: string) {
  return new URL(path, process.env.APP_URL ?? 'http://localhost:3000').toString();
}
