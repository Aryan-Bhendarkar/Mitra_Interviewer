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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 17H9.154a3.374 3.374 0 00-1.849-.553l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                Mitra AI
              </h1>
            </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
              Interview Analysis
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              <span className="capitalize font-medium text-gray-200">{interview.role}</span> Position Assessment
            </p>
            
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">
                {feedback?.createdAt
                  ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Score and Assessment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Overall Score Card */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#e5e7eb" 
                  strokeWidth="6"
                />
                {/* Score circle */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="url(#scoreGradient)"
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray={`${feedback?.totalScore * 2.83} 283`}
                  strokeDashoffset="0"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Score text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">                <span className="text-3xl font-bold text-white">
                  {feedback?.totalScore}
                </span>
                <span className="text-sm text-gray-400">out of 100</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">Overall Performance</h3>
            <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
              feedback?.totalScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
              feedback?.totalScore >= 60 ? 'bg-purple-100 text-purple-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {feedback?.totalScore >= 80 ? 'Excellent' : 
               feedback?.totalScore >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>

          {/* Final Assessment Card */}
          <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>              <h3 className="text-xl font-semibold text-white">Final Assessment</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{feedback?.finalAssessment}</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">Detailed Breakdown</h2>
          </div>
          
          <div className="space-y-8">
            {feedback?.categoryScores?.map((category, index) => (              <div key={index} className="border-b border-gray-600 pb-8 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-white">
                    {index + 1}. {category.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">
                      {category.score}
                    </span>
                    <span className="text-gray-400 text-sm">/100</span>
                  </div>
                </div>
                
                {/* Modern progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${category.score}%` }}
                  />
                </div>
                
                <p className="text-gray-300 leading-relaxed">{category.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Improvements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">          {/* Strengths */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Strengths</h3>
            </div>
            <ul className="space-y-4">
              {feedback?.strengths?.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-300 leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>          {/* Areas for Improvement */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Areas for Improvement</h3>
            </div>
            <ul className="space-y-4">
              {feedback?.areasForImprovement?.map((area, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-300 leading-relaxed">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">          <Button asChild variant="outline" className="px-8 py-3 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white">
            <Link href="/" className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </Button>

          <Button asChild className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 hover:from-indigo-600 hover:via-purple-600 hover:to-emerald-600 text-white">
            <Link href={`/interview/${id}`} className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake Interview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
