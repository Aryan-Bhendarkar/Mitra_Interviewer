import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createInterview } from "@/lib/actions/general.action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Generate interview API called with body:", body);
    
    const { conversation, userId } = body;

    if (!conversation || !userId) {
      console.log("Missing required fields:", { conversation: !!conversation, userId: !!userId });
      return Response.json({ 
        success: false, 
        error: "Missing conversation or userId" 
      }, { status: 400 });
    }

    console.log("Conversation length:", conversation.length);
    console.log("User ID:", userId);

    // Extract interview details from conversation using AI
    const analysisPrompt = `Analyze this conversation between a user and an AI assistant to extract interview details:

${conversation}

Extract the following information and respond in this exact JSON format:
{
  "role": "job title (e.g., Frontend Developer, Software Engineer)",
  "level": "entry-level, mid-level, or senior-level",
  "type": "technical, behavioral, or mixed",
  "techstack": ["technology1", "technology2", "..."],
  "amount": number of questions (default to 5 if not specified)
}

If any information is unclear or missing, use reasonable defaults based on the conversation context.`;

    const { text: analysisResponse } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: analysisPrompt,
      maxTokens: 500,
      temperature: 0.3,
    });    // Parse the analysis response
    let interviewDetails;
    try {
      // Extract JSON from the response
      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        interviewDetails = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in analysis response");
      }
    } catch (parseError) {
      console.error("Error parsing analysis:", parseError);
      // Fallback defaults
      interviewDetails = {
        role: "Software Developer",
        level: "mid-level",
        type: "mixed",
        techstack: ["JavaScript", "React"],
        amount: 5
      };
    }

    // Generate interview questions using AI
    const questionPrompt = `Prepare questions for a job interview.
        The job role is ${interviewDetails.role}.
        The job experience level is ${interviewDetails.level}.
        The tech stack used in the job is: ${interviewDetails.techstack.join(", ")}.
        The focus between behavioural and technical questions should lean towards: ${interviewDetails.type}.
        The amount of questions required is: ${interviewDetails.amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3`;

    const { text: questionsResponse } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: questionPrompt,
      maxTokens: 1000,
      temperature: 0.7,
    });    // Parse the questions from the AI response
    let questions: string[] = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = questionsResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by lines and clean up
        questions = questionsResponse
          .split('\n')
          .filter(line => line.trim() && !line.includes('Question'))
          .slice(0, interviewDetails.amount);
      }
    } catch (parseError) {
      console.error("Error parsing questions:", parseError);
      // Fallback to basic splitting
      questions = questionsResponse
        .split('\n')
        .filter(line => line.trim())
        .slice(0, interviewDetails.amount);
    }

    // Save interview to database
    const result = await createInterview({
      role: interviewDetails.role,
      level: interviewDetails.level,
      type: interviewDetails.type,
      techstack: interviewDetails.techstack,
      questions,
      userId,
      amount: interviewDetails.amount,
    });

    if (result.success && result.interviewId) {
      return Response.json({ 
        success: true, 
        interviewId: result.interviewId,
        questions,
        details: interviewDetails
      }, { status: 200 });
    } else {
      return Response.json({ 
        success: false, 
        error: "Failed to save interview" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json(
      { success: false, error: "Failed to generate interview" },
      { status: 500 }
    );
  }
}
