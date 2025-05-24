import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { INTERVIEWER_SYSTEM_PROMPT } from "@/constants";

export async function POST(request: Request) {
  try {
    const { messages, questions } = await request.json();

    // If it's an interview, use the interviewer system prompt with questions
    const isInterview = messages.some((msg: any) => 
      msg.content && msg.content.includes(INTERVIEWER_SYSTEM_PROMPT)
    );

    let systemMessage = messages[0];
    if (isInterview && questions && questions.length > 0) {
      systemMessage = {
        role: "system",
        content: `${INTERVIEWER_SYSTEM_PROMPT}

Interview Questions to ask:
${questions.map((q: string, index: number) => `${index + 1}. ${q}`).join('\n')}

Start with the first question and proceed naturally through the interview.`
      };
    }

    const { text: response } = await generateText({
      model: google("gemini-2.0-flash-001"),
      messages: [systemMessage, ...messages.slice(1)],
      maxTokens: 200, // Keep responses concise for voice
      temperature: 0.7,
    });

    return Response.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
