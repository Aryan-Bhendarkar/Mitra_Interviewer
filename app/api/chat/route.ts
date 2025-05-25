import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { INTERVIEWER_SYSTEM_PROMPT } from "@/constants";

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  type: string;
  questions?: string[];
  currentQuestionIndex: number;
  userName: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Support both old format (messages, questions) and new format (message, conversationHistory, etc.)
    if (body.messages) {
      // Old format - for backward compatibility
      return handleOldFormat(body);
    } else {
      // New format - for voice service
      return handleNewFormat(body);
    }
  } catch (error) {
    console.error("Error generating AI response:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

async function handleOldFormat({ messages, questions }: any) {
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
}

async function handleNewFormat({
  message, 
  conversationHistory, 
  type, 
  questions, 
  currentQuestionIndex, 
  userName 
}: ChatRequest) {
  
  console.log('Voice chat API called with:', {
    message,
    type,
    currentQuestionIndex,
    historyLength: conversationHistory.length
  });

  let response = '';

  if (type === 'interview' && questions && questions.length > 0) {
    response = await generateInterviewResponse(
      message, 
      conversationHistory, 
      questions, 
      currentQuestionIndex, 
      userName
    );
  } else {
    response = await generatePracticeResponse(
      message, 
      conversationHistory, 
      userName
    );
  }

  return Response.json({ response });
}

async function generateInterviewResponse(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  questions: string[],
  currentQuestionIndex: number,
  userName: string
): Promise<string> {
  
  // If this is the first user response, acknowledge and ask the next question
  if (history.length <= 2) {
    if (currentQuestionIndex + 1 < questions.length) {
      return `Thank you for that response, ${userName}. Let me ask you the next question: ${questions[currentQuestionIndex + 1]}`;
    } else {
      return `Thank you for your response. That concludes our interview questions. Do you have any questions for me about the role or company?`;
    }
  }

  // For subsequent responses, provide brief feedback and move to next question
  const feedbackPhrases = [
    "That's a great point.",
    "I appreciate your detailed answer.",
    "Interesting perspective.",
    "Thank you for sharing that.",
    "That's valuable experience."
  ];

  const randomFeedback = feedbackPhrases[Math.floor(Math.random() * feedbackPhrases.length)];

  if (currentQuestionIndex + 1 < questions.length) {
    return `${randomFeedback} Now, let's move on to the next question: ${questions[currentQuestionIndex + 1]}`;
  } else {
    return `${randomFeedback} That concludes our structured interview. Is there anything else you'd like to add about your qualifications or any questions you have for me?`;
  }
}

async function generatePracticeResponse(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName: string
): Promise<string> {
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect if user is asking for help with specific topics
  if (lowerMessage.includes('help') || lowerMessage.includes('practice')) {
    return `I'd be happy to help you practice, ${userName}! You can tell me about your background, discuss specific skills, or I can ask you common interview questions. What would you like to focus on?`;
  }
  
  // If user mentions technical skills
  if (lowerMessage.includes('programming') || lowerMessage.includes('coding') || lowerMessage.includes('development')) {
    return `That's great that you have programming experience! Can you tell me about a challenging project you've worked on and how you approached solving the technical problems?`;
  }
  
  // If user mentions experience
  if (lowerMessage.includes('experience') || lowerMessage.includes('worked') || lowerMessage.includes('job')) {
    return `Your experience sounds valuable. Can you give me a specific example of a time when you had to learn something new quickly or adapt to a challenging situation?`;
  }
  
  // If user mentions skills
  if (lowerMessage.includes('skill') || lowerMessage.includes('good at') || lowerMessage.includes('strength')) {
    return `Those are excellent skills to have. Can you describe a situation where you used these skills to achieve a positive outcome or solve a problem?`;
  }
  
  // Default responses based on conversation stage
  if (history.length <= 2) {
    return `Thanks for sharing that, ${userName}. Can you tell me more about your professional background and what type of role you're preparing for?`;
  } else if (history.length <= 6) {
    return `That's interesting. What would you say is your greatest professional strength, and can you give me an example of how it has helped you succeed?`;
  } else if (history.length <= 10) {
    return `Great example! Now, tell me about a time when you faced a significant challenge at work or in a project. How did you handle it?`;
  } else {
    return `Excellent! You're doing well with your interview practice. What specific areas would you like to work on more, or do you have any questions about interview techniques?`;
  }
}
