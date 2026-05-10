import { Resend } from "resend";

// Resend is optional in dev — if no key, email sending is skipped gracefully.
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "reports@dailyfieldreporting.com";
