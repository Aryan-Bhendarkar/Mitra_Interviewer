import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    console.log("Marking interview as completed:", interviewId);

    // Mark the interview as finalized without creating feedback
    await db.collection("interviews").doc(interviewId).update({
      finalized: true
    });

    console.log("Interview marked as completed successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing interview:", error);
    return NextResponse.json(
      { error: "Failed to complete interview" },
      { status: 500 }
    );
  }
}
