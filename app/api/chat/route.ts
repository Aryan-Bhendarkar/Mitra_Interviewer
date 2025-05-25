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

interface OldFormatRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant' | 'data'; content: string }>;
  questions?: string[];
}

async function handleOldFormat({ messages, questions }: OldFormatRequest) {
  // If it's an interview, use the interviewer system prompt with questions
  const isInterview = messages.some((msg) => 
    msg.content && msg.content.includes(INTERVIEWER_SYSTEM_PROMPT)
  );
  // Extract role and tech stack information if available
  let role = "the position";
  let techStack: string[] = [];
  
  // Try to extract role and tech stack information from the messages
  for (const msg of messages) {
    if (msg.role === 'system') {
      const roleMatch = msg.content.match(/for a ([^,]+?) (position|role|job)/i);
      if (roleMatch) role = roleMatch[1];
      
      const techMatch = msg.content.match(/technologies?:?\s*([^.]+)/i);
      if (techMatch) {
        techStack = techMatch[1].split(/,\s*/).filter((t: string) => t.trim().length > 0);
      }
    }
  }

  let systemMessage = messages[0];
  if (isInterview && questions && questions.length > 0) {
    systemMessage = {
      role: "system",
      content: `${INTERVIEWER_SYSTEM_PROMPT}

You are interviewing for a ${role} position${techStack.length > 0 ? ' with focus on ' + techStack.join(', ') : ''}.

Interview Questions to ask:
${questions.map((q: string, index: number) => `${index + 1}. ${q}`).join('\n')}

Start with the first question. Keep your responses brief and focused. Proceed naturally through the interview, asking follow-up questions when appropriate.`
    };
  }

  const { text: response } = await generateText({
    model: google("gemini-2.0-flash-001"),
    messages: [systemMessage, ...messages.slice(1)],
    maxTokens: 300, // Keep responses concise for voice but allow for follow-up questions
    temperature: 0.5, // Lower temperature for more focused responses
  });

  return Response.json({ response }, { status: 200 });
}

async function handleNewFormat({
  message, 
  conversationHistory = [], 
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
  
  // Count how many questions we've already asked (excluding initial greeting)
  const questionsAsked = Math.floor((history.length - 1) / 2); // Subtract 1 for greeting, divide by 2 for pairs
  
  console.log(`Interview Progress: ${questionsAsked}/${questions.length} questions asked`);
  
  // Analyze the last question if available
  const lastQuestion = questionsAsked > 0 && questionsAsked <= questions.length 
    ? questions[questionsAsked - 1] 
    : null;
    
  // If we still have questions to ask
  if (questionsAsked < questions.length) {
    const nextQuestionIndex = questionsAsked;
    
    // Generate more insightful feedback based on the user's response and the last question
    let feedback = "";
    
    if (lastQuestion) {
      // Is this a technical or behavioral question?
      const isTechnical = lastQuestion.toLowerCase().includes('code') || 
                          lastQuestion.toLowerCase().includes('technical') || 
                          lastQuestion.toLowerCase().includes('develop') ||
                          lastQuestion.toLowerCase().includes('programming') ||
                          lastQuestion.toLowerCase().includes('architecture');
      
      // Did the user provide a detailed response?
      const isDetailed = userMessage.length > 100;
      
      // Generate appropriate feedback
      if (isTechnical) {
        feedback = isDetailed
          ? "Thanks for that technical explanation. Your approach sounds well-reasoned."
          : "Thanks for your response. Consider adding more technical details in your future answers.";
      } else {
        feedback = isDetailed
          ? "Thank you for sharing that experience in detail."
          : "Thank you for that response.";
      }
      
      // Add variation to prevent repetitive responses
      const feedbackVariations = [
        "Let me move on to the next question.",
        "That's helpful context. Now for our next topic.",
        "I appreciate your insights. Let's continue with the next question.",
        "That's valuable information. Moving forward,",
        "Thanks for that response. Continuing with our interview,",
      ];
      
      const randomVariation = feedbackVariations[Math.floor(Math.random() * feedbackVariations.length)];
      feedback = `${feedback} ${randomVariation}`;
    } else {
      // Default feedback for first question
      feedback = "Let's begin our interview with the first question.";
    }
    
    if (nextQuestionIndex < questions.length) {
      return `${feedback} ${questions[nextQuestionIndex]}`;
    }
  }
  
  // If we've asked all questions, conclude the interview
  return `Thank you for your responses to all the questions, ${userName}. That concludes our structured interview. Is there anything else you'd like to add about your qualifications, or do you have any questions for me about the role or company?`;
}

async function generatePracticeResponse(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userName: string
): Promise<string> {
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Extract role and technology information from user message or history
  let detectedRole = "";
  let detectedTechnologies: string[] = [];
  
  // Common tech keywords to detect
  const techKeywords = [
    "javascript", "react", "angular", "vue", "node", "express", "python", "django", "flask",
    "java", "spring", "ruby", "rails", "php", "laravel", "c#", ".net", "golang", "rust",
    "aws", "azure", "gcp", "devops", "docker", "kubernetes", "jenkins", "cicd", "frontend", 
    "backend", "fullstack", "database", "sql", "nosql", "mongodb", "postgresql", "mysql", 
    "redis", "mobile", "android", "ios", "swift", "kotlin", "react native", "flutter"
  ];
  
  // Common roles
  const roleKeywords = [
    "developer", "engineer", "architect", "designer", "manager", "lead", "devops",
    "frontend", "backend", "fullstack", "data scientist", "analyst", "qa", "tester",
    "product manager", "scrum master", "ui/ux", "mobile", "cloud", "security"
  ];
  
  // Detect role and technologies from current message
  for (const role of roleKeywords) {
    if (lowerMessage.includes(role)) {
      detectedRole = role;
      break;
    }
  }
  
  // Detect technologies mentioned in the message
  detectedTechnologies = techKeywords.filter(tech => lowerMessage.includes(tech));
  
  // If we didn't find in this message, try the conversation history
  if (!detectedRole || detectedTechnologies.length === 0) {
    for (const msg of history) {
      const msgLower = msg.content.toLowerCase();
      
      // Look for role if not found yet
      if (!detectedRole) {
        for (const role of roleKeywords) {
          if (msgLower.includes(role)) {
            detectedRole = role;
            break;
          }
        }
      }
      
      // Add any technologies mentioned
      for (const tech of techKeywords) {
        if (msgLower.includes(tech) && !detectedTechnologies.includes(tech)) {
          detectedTechnologies.push(tech);
        }
      }
    }
  }
  
  // Format detected information
  const roleContext = detectedRole ? `${detectedRole} role` : "this position";
  const techContext = detectedTechnologies.length > 0 ? 
    `your experience with ${detectedTechnologies.slice(0, 3).join(', ')}` : 
    "your technical experience";
  
  // Detect if user is asking for help with specific topics
  if (lowerMessage.includes('help') || lowerMessage.includes('practice')) {
    return `I'd be happy to help you practice for ${roleContext}, ${userName}! We can discuss ${techContext}, your project experience, or I can ask you common interview questions. What specific area would you like to focus on?`;
  }
  
  // If user mentions technical skills, ask a relevant question
  if (lowerMessage.includes('programming') || lowerMessage.includes('coding') || lowerMessage.includes('development')) {
    return `That's great to hear about ${techContext}! For a ${roleContext}, can you describe a challenging technical problem you faced recently and how you approached solving it? Focus on your problem-solving process and the technologies you used.`;
  }
  
  // If user mentions experience
  if (lowerMessage.includes('experience') || lowerMessage.includes('worked') || lowerMessage.includes('job')) {
    if (detectedTechnologies.length > 0) {
      return `Your experience with ${detectedTechnologies.join(', ')} sounds valuable for a ${roleContext}. Could you walk me through a specific project where you used ${detectedTechnologies[0]} and what your contribution was?`;
    } else {
      return `Your experience sounds valuable. For a ${roleContext}, can you describe a situation where you had to learn a new technology quickly or adapt to changing requirements? How did you handle it?`;
    }
  }
  
  // If user mentions skills
  if (lowerMessage.includes('skill') || lowerMessage.includes('good at') || lowerMessage.includes('strength')) {
    if (detectedRole) {
      return `Those are excellent skills for a ${roleContext}. Can you provide a specific example of how you applied these skills in a professional setting and what the outcome was?`;
    } else {
      return `Those are excellent skills. Can you describe a situation where you leveraged these strengths to achieve a positive outcome or solve a complex problem?`;
    }
  }
  
  // Default responses based on conversation stage, but more tailored
  if (history.length <= 2) {
    return `Thanks for sharing that, ${userName}. To better tailor our practice session, could you tell me more about the specific type of role you're preparing for and the technologies you're focusing on?`;
  } else if (history.length <= 6) {
    if (detectedRole) {
      return `That's helpful context. For a ${roleContext}, what would you say is your greatest technical strength, and can you share a specific example that demonstrates it?`;
    } else {
      return `That's interesting. What would you consider your greatest professional strength, and can you give me a concrete example of how it has helped you succeed in a project?`;
    }
  } else if (history.length <= 10) {
    if (detectedTechnologies.length > 0) {
      return `Good example! Now, let's discuss a scenario: Imagine you're working with a team using ${detectedTechnologies[0]}, and you encounter a significant performance issue in production. How would you approach diagnosing and resolving it?`;
    } else {
      return `Great example! Now, tell me about a time when you faced a significant challenge or disagreement in a team setting. How did you handle it, and what was the outcome?`;
    }  } else {
    return `You're doing well with your interview preparation! Let's try a more specific question for ${roleContext}: What strategies do you use to stay updated with the latest developments in ${detectedTechnologies.length > 0 ? detectedTechnologies.join(', ') : 'your field'}, and how have you applied new knowledge to improve your work?`;
  }
}
