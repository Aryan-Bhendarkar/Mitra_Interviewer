import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  
  // For hackathon - use default user data since we removed authentication
  const defaultUserId = "hackathon-user";

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");
  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: defaultUserId,
  });

  if (!feedback) redirect(`/interview/${id}`);

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>      <div className="flex flex-col items-center mt-6 mb-8">
        {/* Overall Score */}
        <div className="relative w-32 h-32 mb-2">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="8"
            />
            {/* Score circle with dynamic stroke-dasharray */}
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={
                feedback?.totalScore >= 80 ? '#22c55e' : 
                feedback?.totalScore >= 60 ? '#eab308' : '#ef4444'
              }
              strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray={`${feedback?.totalScore * 2.83} 283`}
              strokeDashoffset="0" 
              transform="rotate(-90 50 50)"
            />
            {/* Text in middle */}
            <text x="50" y="50" 
              fontSize="20" 
              fontWeight="bold" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill={
                feedback?.totalScore >= 80 ? '#22c55e' : 
                feedback?.totalScore >= 60 ? '#eab308' : '#ef4444'
              }>
              {feedback?.totalScore}
            </text>
            <text x="50" y="65" 
              fontSize="8" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="currentColor">
              out of 100
            </text>
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Overall Performance</h3>
        
        <div className="flex flex-row gap-2 items-center mb-6">
          <Image src="/calendar.svg" width={18} height={18} alt="calendar" />
          <p className="text-sm text-gray-500">
            {feedback?.createdAt
              ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold mb-2">Final Assessment</h3>
        <p className="text-lg">{feedback?.finalAssessment}</p>
      </div>

      {/* Interview Breakdown */}      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index} className="border-b pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-lg">
                {index + 1}. {category.name}
              </p>
              <p className={`font-bold ${
                category.score >= 80 ? 'text-green-600' : 
                category.score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {category.score}/100
              </p>
            </div>
            
            {/* Score progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div 
                className={`h-2.5 rounded-full ${
                  category.score >= 80 ? 'bg-green-500' : 
                  category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${category.score}%` }}
              />
            </div>
            
            <p>{category.comment}</p>
          </div>
        ))}
      </div>      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-xl font-semibold text-green-800">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {feedback?.strengths?.map((strength, index) => (
              <li key={index} className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-semibold text-amber-800">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2">
            {feedback?.areasForImprovement?.map((area, index) => (
              <li key={index} className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
