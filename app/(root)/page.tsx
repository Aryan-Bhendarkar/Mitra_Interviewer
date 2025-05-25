import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import {
  getPendingInterviewsByUserId,
  getCompletedInterviewsByUserId,
} from "@/lib/actions/general.action";

async function Home() {
  // For hackathon - use a default user ID since we removed authentication
  const defaultUserId = "hackathon-user";

  const [pendingInterviews, completedInterviews] = await Promise.all([
    getPendingInterviewsByUserId(defaultUserId),
    getCompletedInterviewsByUserId(defaultUserId),
  ]);
  console.log("Dashboard data:", {
    pendingCount: pendingInterviews?.length ?? 0,
    completedCount: completedInterviews?.length ?? 0,
    pendingInterviews: pendingInterviews?.map((i) => ({
      id: i.id,
      role: i.role,
      finalized: i.finalized,
    })),
    completedInterviews: completedInterviews?.map((i) => ({
      id: i.id,
      role: i.role,
      finalized: i.finalized,
    })),
  });

  const hasPendingInterviews = (pendingInterviews?.length ?? 0) > 0;
  const hasCompletedInterviews = (completedInterviews?.length ?? 0) > 0;
  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Generate Interview Questions</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Ready to Take</h2>
        <p className="text-sm text-gray-600">
          Click on any interview card below to start your voice interview
        </p>

        <div className="interviews-section">
          {hasPendingInterviews ? (
            pendingInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={defaultUserId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No interview questions generated yet
              </p>
              <Button asChild variant="outline">
                <Link href="/interview">Generate Your First Interview</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Completed Interviews</h2>

        <div className="interviews-section">
          {hasCompletedInterviews ? (            completedInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={defaultUserId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p className="text-gray-500">No completed interviews yet</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
