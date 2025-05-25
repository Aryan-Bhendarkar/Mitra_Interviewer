import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createInterview } from "@/lib/actions/general.action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Generate interview API called with body:", body);
    
    let interviewDetails;
    const { userId } = body;

    if (!userId) {
      console.log("Missing userId");
      return Response.json({ 
        success: false, 
        error: "Missing userId" 
      }, { status: 400 });
    }

    // Check if this is a direct form submission or conversation-based request
    if (body.role && body.level && body.type && body.techstack) {
      // Direct form submission - use the data directly
      console.log("Processing direct form submission");
      interviewDetails = {
        role: body.role,
        level: body.level,
        type: body.type,
        techstack: body.techstack,
        amount: body.amount || 5
      };
    } else if (body.conversation) {
      // Conversation-based request - analyze the conversation
      console.log("Processing conversation-based request");
      const { conversation } = body;
      
      console.log("Conversation length:", conversation.length);
      
      // Extract interview details from conversation using AI
      const analysisPrompt = `Analyze this conversation between a user and an AI assistant to extract specific details about the job interview the user wants to prepare for:

${conversation}

Look for mentions of:
- Exact job title or role (be specific, e.g., "React Frontend Developer" rather than just "Developer")
- Experience level (entry-level/junior, mid-level, senior-level)
- Interview type focus (technical, behavioral, or mixed)
- Specific technologies, frameworks, languages mentioned (be comprehensive)
- Number of questions desired (if specified)

Extract this information and respond in this exact JSON format:
{
  "role": "specific job title (e.g., React Frontend Developer, DevOps Engineer)",
  "level": "entry-level, mid-level, or senior-level",
  "type": "technical, behavioral, or mixed",
  "techstack": ["technology1", "technology2", "..."],
  "amount": number of questions (default to 5 if not specified),
  "keywords": ["key1", "key2", "..."] (important focus areas mentioned in the conversation)
}

If any information is unclear or missing, use reasonable defaults based on the conversation context. Be as specific as possible with the role and technologies.`;

      const { text: analysisResponse } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: analysisPrompt,
        maxTokens: 800,
        temperature: 0.2,
      });

      // Parse the analysis response
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
    } else {
      return Response.json({ 
        success: false, 
        error: "Missing required interview data or conversation" 
      }, { status: 400 });
    }    console.log("Interview details:", interviewDetails);

    // Generate interview questions using AI
    const questionPrompt = `You are an expert technical recruiter creating highly relevant interview questions for a ${interviewDetails.level} ${interviewDetails.role} position.

INTERVIEW CONTEXT:
- Role: ${interviewDetails.role} (be very specific to this exact role)
- Experience Level: ${interviewDetails.level}
- Required Technologies: ${interviewDetails.techstack.join(", ")}
- Interview Type: ${interviewDetails.type} 
- Number of Questions: ${interviewDetails.amount}
${interviewDetails.keywords ? `- Key Focus Areas: ${interviewDetails.keywords.join(", ")}` : ''}

QUESTION REQUIREMENTS:
1. Create exactly ${interviewDetails.amount} questions that are highly relevant and specific to the ${interviewDetails.role} role
2. ${interviewDetails.type === 'technical' ? 'Focus primarily on technical questions about ' + interviewDetails.techstack.join(", ") : 
   interviewDetails.type === 'behavioral' ? 'Focus primarily on behavioral questions relevant to the role' :
   'Create a balanced mix of technical and behavioral questions'}
3. Make questions progressively more challenging
4. Include role-specific scenarios that a ${interviewDetails.role} would encounter
5. For technical questions, focus on practical application rather than theory
6. For behavioral questions, focus on specific experiences and problem-solving
7. Make questions conversational and suited for verbal delivery

OUTPUT FORMAT:
Return ONLY a JSON array of questions without any additional text or explanation:
["Question 1", "Question 2", "Question 3"]

IMPORTANT: Questions should be free of special characters (/, *, etc.) as they will be read by a voice assistant.`;

    const { text: questionsResponse } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: questionPrompt,
      maxTokens: 1500,
      temperature: 0.5,
    });    // Parse the questions from the AI response
    let questions: string[] = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = questionsResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
        
        // Validate and clean questions
        questions = questions
          .filter(q => typeof q === 'string' && q.trim().length > 0)
          .map(q => {
            // Remove numbering prefixes if present
            return q.replace(/^\d+[\.\)\-]+\s*/, '').trim();
          });
      } else {
        // Fallback: split by lines and clean up
        console.log("JSON parsing failed, using line-based fallback");
        questions = questionsResponse
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10 && !line.toLowerCase().includes('question'))
          .map(line => {
            // Remove numbering prefixes if present
            return line.replace(/^\d+[\.\)\-]+\s*/, '').trim();
          })
          .slice(0, interviewDetails.amount);
      }
      
      // If we still don't have enough questions, generate some defaults based on the role and tech stack
      if (questions.length < interviewDetails.amount) {
        console.log("Not enough questions parsed, adding defaults");
        const defaultQuestions = generateDefaultQuestions(
          interviewDetails.role, 
          interviewDetails.techstack, 
          interviewDetails.type,
          interviewDetails.amount - questions.length
        );
        questions = [...questions, ...defaultQuestions];
      }
      
    } catch (parseError) {
      console.error("Error parsing questions:", parseError);
      // Fallback to basic splitting with more comprehensive filtering
      console.log("Using emergency fallback parsing");
      questions = questionsResponse
        .split(/[\n\.\?]/)
        .map(line => line.trim())
        .filter(line => line.length > 15)
        .map(line => {
          // Remove any prefixes, quotes, or other artifacts
          return line.replace(/^["'\d\s\.\-\)]+/, '').trim() + "?";
        })
        .slice(0, interviewDetails.amount);
        
      // If still not enough, add defaults
      if (questions.length < interviewDetails.amount) {
        const defaultQuestions = generateDefaultQuestions(
          interviewDetails.role, 
          interviewDetails.techstack, 
          interviewDetails.type,
          interviewDetails.amount - questions.length
        );
        questions = [...questions, ...defaultQuestions];
      }
    }
    
    // Ensure we have the right number of questions
    questions = questions.slice(0, interviewDetails.amount);
    
    // Function to generate default questions if parsing fails
    function generateDefaultQuestions(role: string, techstack: string[], type: string, count: number): string[] {
      const roleLC = role.toLowerCase();
      const defaults: string[] = [];
      
      // Technical questions based on role and tech stack
      const technicalQuestions = [
        `Can you explain your experience with ${techstack[0] || 'the main technologies'} in your previous projects?`,
        `What do you consider best practices when working with ${techstack[1] || techstack[0] || 'modern development frameworks'}?`,
        `How would you approach debugging a complex issue in a ${roleLC} project?`,
        `Describe your development workflow and how you ensure code quality.`,
        `What recent developments in ${techstack[0] || 'your technical field'} are you most excited about and why?`
      ];
      
      // Behavioral questions
      const behavioralQuestions = [
        `Can you describe a challenging project you worked on as a ${roleLC} and how you approached it?`,
        `Tell me about a time when you had to meet a tight deadline. How did you manage your time and priorities?`,
        `How do you handle feedback and criticism on your work?`,
        `Describe a situation where you had a conflict with a team member and how you resolved it.`,
        `What's your approach to learning new technologies or skills that are required for a project?`
      ];
      
      // Choose appropriate questions based on interview type
      if (type.toLowerCase() === 'technical') {
        defaults.push(...technicalQuestions.slice(0, count));
      } else if (type.toLowerCase() === 'behavioral') {
        defaults.push(...behavioralQuestions.slice(0, count));
      } else {
        // Mixed - alternate between technical and behavioral
        for (let i = 0; i < count; i++) {
          defaults.push(i % 2 === 0 
            ? technicalQuestions[Math.floor(i/2) % technicalQuestions.length]
            : behavioralQuestions[Math.floor(i/2) % behavioralQuestions.length]
          );
        }
      }
      
      return defaults;
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
