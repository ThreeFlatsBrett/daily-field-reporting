import { anthropic, AI_MODEL } from "./client";

export type DocumentType =
  | "mud_report"
  | "cement_ticket"
  | "directional_survey"
  | "bit_record"
  | "daily_drilling_report"
  | "completion_report"
  | "unknown";

export interface ParsedDocument {
  documentType: DocumentType;
  extractedFields: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  rawText: string;
}

export async function parseDocument(
  fileContent: string,
  fileType: string,
  jobModule: string
): Promise<ParsedDocument> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert at parsing upstream oil and gas field documents.

Extract all relevant data from this ${fileType} document for a ${jobModule} daily report.

Document content:
<document>
${fileContent}
</document>

Return a JSON object with:
- documentType: one of "mud_report", "cement_ticket", "directional_survey", "bit_record", "daily_drilling_report", "completion_report", "unknown"
- extractedFields: object containing all extracted data with appropriate field names
- confidence: "high", "medium", or "low" based on how clearly the data was presented
- rawText: the cleaned text you extracted data from`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected AI response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse document fields from AI response");
  }

  return JSON.parse(jsonMatch[0]) as ParsedDocument;
}
