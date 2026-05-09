import puppeteer from "puppeteer-core";

function getChromiumPath(): string {
  return process.env.PUPPETEER_EXECUTABLE_PATH ?? "/usr/bin/chromium-browser";
}

export async function generateReportPdf(reportUrl: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(reportUrl, { waitUntil: "networkidle0", timeout: 30000 });
    const pdf = await page.pdf({
      format: "Letter",
      margin: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
