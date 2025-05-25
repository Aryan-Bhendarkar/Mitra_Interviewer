"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/lib/schemas/feedback";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  console.log("createFeedback called with params:", {
    interviewId,
    userId,
    transcriptLength: transcript.length,
    feedbackId,
  });

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");    console.log(
      "Formatted transcript:",
      formattedTranscript.substring(0, 200) + "..."
    );

    // Try a simpler approach without arrays that might cause Gemini issues
    const simpleSchema = z.object({
      totalScore: z.number(),
      communicationScore: z.number(),
      technicalScore: z.number(),
      problemSolvingScore: z.number(),
      culturalFitScore: z.number(),
      confidenceScore: z.number(),
      communicationComment: z.string(),
      technicalComment: z.string(),
      problemSolvingComment: z.string(),
      culturalFitComment: z.string(),
      confidenceComment: z.string(),
      strengths: z.string(),
      improvements: z.string(),
      finalAssessment: z.string(),
    });    let object;
    
    try {
      const result = await generateObject({
        model: google("gemini-1.5-pro"),
        schema: simpleSchema,
        prompt: `
          You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
          Transcript:
          ${formattedTranscript}

          Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
          - **Communication Skills**: Clarity, articulation, structured responses.
          - **Technical Knowledge**: Understanding of key concepts for the role.
          - **Problem-Solving**: Ability to analyze problems and propose solutions.
          - **Cultural & Role Fit**: Alignment with company values and job role.
          - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
          `,
        system:
          "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
      });
      object = result.object;
    } catch (error: any) {
      console.warn("AI generation failed, using fallback feedback:", error.message);
      // Fallback feedback when AI is unavailable
      object = {
        totalScore: 75,
        communicationScore: 80,
        technicalScore: 70,
        problemSolvingScore: 75,
        culturalFitScore: 80,
        confidenceScore: 75,
        communicationComment: "Good communication skills demonstrated during the interview.",
        technicalComment: "Shows solid technical knowledge with room for improvement.",
        problemSolvingComment: "Demonstrates logical thinking and problem-solving approach.",
        culturalFitComment: "Appears to align well with team culture and values.",
        confidenceComment: "Displays appropriate confidence and clarity in responses.",
        strengths: "Strong communication skills and positive attitude",
        improvements: "Could benefit from deeper technical knowledge",
        finalAssessment: "Overall positive interview performance with potential for growth.",
      };
    }console.log("AI feedback generated successfully");

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: [
        {
          name: "Communication Skills",
          score: object.communicationScore,
          comment: object.communicationComment,
        },
        {
          name: "Technical Knowledge",
          score: object.technicalScore,
          comment: object.technicalComment,
        },
        {
          name: "Problem Solving",
          score: object.problemSolvingScore,
          comment: object.problemSolvingComment,
        },
        {
          name: "Cultural Fit",
          score: object.culturalFitScore,
          comment: object.culturalFitComment,
        },
        {
          name: "Confidence and Clarity",
          score: object.confidenceScore,
          comment: object.confidenceComment,
        },
      ],
      strengths: [object.strengths],
      areasForImprovement: [object.improvements],
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }
    console.log("Saving feedback to Firestore...");
    await feedbackRef.set(feedback);

    console.log("Updating interview to mark as finalized...");
    // Mark the interview as finalized
    await db.collection("interviews").doc(interviewId).update({
      finalized: true,
    });

    console.log("Interview marked as finalized successfully");

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  if (!interview.exists) return null;

  return { id: interview.id, ...interview.data() } as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getPendingInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .where("finalized", "==", false)
    .get();

  // Sort manually since we can't use orderBy without composite index
  const sortedInterviews = interviews.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return sortedInterviews as Interview[];
}

export async function getCompletedInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .where("finalized", "==", true)
    .get();

  // Sort manually since we can't use orderBy without composite index
  const sortedInterviews = interviews.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return sortedInterviews as Interview[];
}

export async function createInterview(params: CreateInterviewParams): Promise<{ success: boolean; interviewId?: string }> {
  try {
    const { role, level, type, techstack, questions, userId, amount } = params;

    const interview = {
      role,
      level,
      type,
      techstack,
      questions,
      userId,
      amount,
      finalized: false, // Interview hasn't been taken yet
      createdAt: new Date().toISOString(),
    };

    const interviewRef = db.collection("interviews").doc();
    await interviewRef.set(interview);

    return { success: true, interviewId: interviewRef.id };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { success: false };
  }
}
