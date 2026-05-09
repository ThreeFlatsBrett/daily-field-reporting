import { anthropic, AI_MODEL } from "./client";
import { TimeLogEntry } from "@/types/modules";

export async function parseTimeLog(
  naturalLanguageInput: string,
  context?: { currentDepth?: number; jobModule?: string }
): Promise<TimeLogEntry[]> {
  const systemPrompt = `You are an expert at parsing oil and gas field operations time logs.
Convert natural language descriptions of daily field activities into structured time log entries.
Times should be in HH:MM 24-hour format. Hours must be positive numbers.
Depths are in feet measured depth (MD). Activities should be concise operational terms.`;

  const userPrompt = `Parse this field activity description into structured time log entries:

"${naturalLanguageInput}"

${context?.currentDepth ? `Current well depth: ${context.currentDepth} ft MD` : ""}
${context?.jobModule ? `Job type: ${context.jobModule}` : ""}

Return a JSON array of time log entries. Each entry must have:
- activity (string): brief operational activity name
- startTime (string): HH:MM
- endTime (string): HH:MM
- hours (number): duration in hours
- fromDepth (number, optional): starting depth in feet
- toDepth (number, optional): ending depth in feet
- vendor (string, optional): service company name
- notes (string, optional): additional notes`;

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected AI response format");
  }

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse time log entries from AI response");
  }

  return JSON.parse(jsonMatch[0]) as TimeLogEntry[];
}
