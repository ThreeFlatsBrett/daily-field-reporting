import { db } from "@/db";
import { distributionLists, partnerUsers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resend, FROM_EMAIL } from "./resend";

interface SendDistributionOptions {
  jobId: string;
  reportId: string;
  reportDate: string;
  wellName: string;
  tenantName: string;
  tenantLogoUrl?: string | null;
  pdfUrl: string;
}

export async function sendDistribution(opts: SendDistributionOptions) {
  const { jobId, reportDate, wellName, tenantName, pdfUrl } = opts;

  const entries = await db
    .select()
    .from(distributionLists)
    .where(eq(distributionLists.jobId, jobId));

  const emails = new Set<string>();

  for (const entry of entries) {
    if (entry.type === "external_email" && entry.email) {
      emails.add(entry.email);
    } else if (entry.type === "internal" && entry.referenceId) {
      const [user] = await db.select().from(users).where(eq(users.id, entry.referenceId)).limit(1);
      if (user?.email) emails.add(user.email);
    } else if (entry.type === "partner_company" && entry.referenceId) {
      const members = await db
        .select({ userId: partnerUsers.userId })
        .from(partnerUsers)
        .where(eq(partnerUsers.partnerCompanyId, entry.referenceId));
      for (const member of members) {
        const [user] = await db.select().from(users).where(eq(users.id, member.userId)).limit(1);
        if (user?.email) emails.add(user.email);
      }
    }
  }

  if (emails.size === 0) return;

  const subject = `${tenantName} — ${wellName} Daily Report — ${reportDate}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.from(emails),
    subject,
    html: `
      <p>Please find attached the daily field report for <strong>${wellName}</strong> dated <strong>${reportDate}</strong>.</p>
      <p><a href="${pdfUrl}">Download Report PDF</a></p>
      <hr/>
      <p style="color:#888;font-size:12px;">Sent by Daily Field Reporting on behalf of ${tenantName}</p>
    `,
  });
}

export async function sendSubmitNotification(opts: {
  adminEmails: string[];
  wellName: string;
  reportDate: string;
  tenantName: string;
  reportId: string;
}) {
  const { adminEmails, wellName, reportDate, tenantName, reportId } = opts;
  if (adminEmails.length === 0) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `Report Submitted — ${wellName} — ${reportDate}`,
    html: `
      <p>A daily report has been submitted for your review.</p>
      <p><strong>Well:</strong> ${wellName}</p>
      <p><strong>Date:</strong> ${reportDate}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reports/${reportId}">Review Report</a></p>
      <hr/>
      <p style="color:#888;font-size:12px;">${tenantName} — Daily Field Reporting</p>
    `,
  });
}

export async function sendRejectionNotification(opts: {
  editorEmail: string;
  wellName: string;
  reportDate: string;
  rejectionNote: string;
  reportId: string;
}) {
  const { editorEmail, wellName, reportDate, rejectionNote, reportId } = opts;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: editorEmail,
    subject: `Report Returned — ${wellName} — ${reportDate}`,
    html: `
      <p>Your daily report has been returned for correction.</p>
      <p><strong>Well:</strong> ${wellName}</p>
      <p><strong>Date:</strong> ${reportDate}</p>
      <p><strong>Note:</strong> ${rejectionNote}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reports/${reportId}">Edit Report</a></p>
    `,
  });
}
