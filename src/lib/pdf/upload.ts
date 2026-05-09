import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME ?? "daily-reports-pdfs");

export async function uploadPdf(
  pdfBuffer: Buffer,
  reportId: string,
  reportDate: string
): Promise<string> {
  const filename = `reports/${reportDate}/${reportId}.pdf`;
  const file = bucket.file(filename);

  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    metadata: { reportId, reportDate },
  });

  const publicUrl = `${process.env.GCS_PUBLIC_URL}/${filename}`;
  return publicUrl;
}
