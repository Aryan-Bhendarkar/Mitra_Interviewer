"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { getVoiceService } from "@/lib/voice.service";
import { createFeedback } from "@/lib/actions/general.action";
import BrowserSupport from "./BrowserSupport";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  profileImage,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showTapToSpeak, setShowTapToSpeak] = useState(false);
  const [voiceService, setVoiceService] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showSupport, setShowSupport] = useState(false);
  const [isProcessingCompletion, setIsProcessingCompletion] = useState(false);

  // Initialize voice service only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const service = getVoiceService();
      setVoiceService(service);
    }
  }, []);

  useEffect(() => {
    if (!voiceService) return;
    const onConversationStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };    const onConversationEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };const onMessage = (message: VoiceMessage) => {
      setMessages((prev) => [...prev, message]);
      
      // Track question progress for interviews
      if (type === "interview" && message.role === "assistant" && questions) {
        // Simple heuristic: count assistant messages to estimate question progress
        const assistantMessages = messages.filter(m => m.role === "assistant").length;
        const estimatedQuestionIndex = Math.min(assistantMessages, questions.length - 1);
        setCurrentQuestionIndex(estimatedQuestionIndex);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };    const onListeningStart = () => {
      setIsListening(true);
      setShowTapToSpeak(false);
    };

    const onListeningEnd = () => {
      setIsListening(false);
        // Show "Tap to Speak" button if conversation is active but not listening for too long
      if (callStatus === CallStatus.ACTIVE) {
        setTimeout(() => {
          if (voiceService) {
            const status = voiceService.getStatus();
            if (status.isActive && !status.isListening && !status.isSpeaking) {
              setShowTapToSpeak(true);
            }
          }
        }, 3000); // Show after 3 seconds of no listening
      }
    };    const onError = (error: Error) => {
      setCallStatus(CallStatus.INACTIVE);
      setIsSpeaking(false);
      setIsListening(false);
      setIsProcessing(false);
      
      // Show specific error messages to user
      if (error.message.includes('microphone') || error.message.includes('Microphone')) {
        setShowSupport(true);
      } else if (error.message.includes('Speech Recognition not supported')) {
        setIsSupported(false);
        setShowSupport(true);
      } else {
        // General error handling
        setShowSupport(true);
      }
    };

    const onProcessingStart = () => {
      setIsProcessing(true);
    };

    const onProcessingEnd = () => {
      setIsProcessing(false);
    };

    voiceService.on("conversation-start", onConversationStart);
    voiceService.on("conversation-end", onConversationEnd);
    voiceService.on("message", onMessage);
    voiceService.on("speech-start", onSpeechStart);
    voiceService.on("speech-end", onSpeechEnd);
    voiceService.on("listening-start", onListeningStart);
    voiceService.on("listening-end", onListeningEnd);
    voiceService.on("processing-start", onProcessingStart);
    voiceService.on("processing-end", onProcessingEnd);
    voiceService.on("error", onError);    return () => {
      voiceService.off("conversation-start", onConversationStart);
      voiceService.off("conversation-end", onConversationEnd);
      voiceService.off("message", onMessage);
      voiceService.off("speech-start", onSpeechStart);
      voiceService.off("speech-end", onSpeechEnd);
      voiceService.off("listening-start", onListeningStart);
      voiceService.off("listening-end", onListeningEnd);
      voiceService.off("processing-start", onProcessingStart);
      voiceService.off("processing-end", onProcessingEnd);
      voiceService.off("error", onError);
    };
  }, [voiceService]);
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }    const handleGenerateFeedback = async (messages: VoiceMessage[]) => {

      // Check if we have enough conversation to generate feedback
      if (messages.length === 0) {
        // Just mark the interview as finalized without generating feedback
        try {
          await fetch('/api/complete-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewId: interviewId! })
          });
          router.push("/");
        } catch (error) {
          console.error("Error marking interview as completed:", error);
          router.push("/");
        }
        return;
      }      // Convert messages to the format expected by createFeedback
      const transcript = messages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }));

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };    const handleGenerateInterview = async (messages: VoiceMessage[]) => {
      try {
        // Validate that we have meaningful conversation data
        if (!messages || messages.length < 2) {
          console.log("Insufficient conversation data for interview generation, redirecting to home");
          router.push("/");
          return;
        }

        // Filter out very short messages that might not be meaningful
        const meaningfulMessages = messages.filter(msg => msg.content && msg.content.trim().length > 10);
        
        if (meaningfulMessages.length < 2) {
          console.log("No meaningful conversation content for interview generation, redirecting to home");
          router.push("/");
          return;
        }

        // Convert conversation to the format needed for interview generation
        const conversation = meaningfulMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

        console.log("Sending interview generation request with:", {
          conversationLength: conversation.length,
          userId: userId,
          messageCount: meaningfulMessages.length
        });

        const response = await fetch('/api/generate-interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation,
            userId: userId!
          })
        });

        const responseData = await response.json();
        console.log("API Response:", { status: response.status, data: responseData });

        if (response.ok && responseData.success) {
          console.log("Interview generated successfully:", responseData.interviewId);
          router.push("/");
        } else {
          console.error("Error generating interview - API returned:", {
            status: response.status,
            error: responseData.error || 'Unknown error'
          });
          // Still redirect to home even if generation fails
          router.push("/");
        }
      } catch (error) {
        console.error("Error generating interview:", error);
        // Always redirect to home, don't leave user stuck
        router.push("/");
      }
    };if (callStatus === CallStatus.FINISHED && !isProcessingCompletion) {
      setIsProcessingCompletion(true);
      
      if (type === "generate") {
        handleGenerateInterview(messages);
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, isProcessingCompletion]);  const handleCall = async () => {
    if (!isSupported) {
      setShowSupport(true);
      return;
    }
    
    if (!voiceService) {
      console.error("Voice service not available");
      setShowSupport(true);
      return;
    }
    
    setCallStatus(CallStatus.CONNECTING);
    try {
      await voiceService.startConversation({
        type,
        questions,
        userName,
        userId,
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setCallStatus(CallStatus.INACTIVE);
      setShowSupport(true);
    }
  };
  const handleDisconnect = () => {
    if (voiceService) {
      voiceService.stopConversation();
    }
  };

  const handleTapToSpeak = () => {
    if (voiceService) {
      setShowTapToSpeak(false);
      voiceService.forceRestartListening();
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src={profileImage || "/user-avatar.png"}
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>            {isListening && (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-500">Listening...</span>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-blue-500">AI is thinking...</span>
              </div>
            )}
            {showTapToSpeak && callStatus === CallStatus.ACTIVE && (
              <button 
                onClick={handleTapToSpeak}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                🎤 Tap to Speak
              </button>
            )}
          </div>
        </div>
      </div>      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            {/* Question progress indicator for interviews */}
            {type === "interview" && questions && questions.length > 0 && (
              <div className="mb-3 text-center">
                <div className="text-xs text-gray-500 mb-1">
                  Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Start Interview"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End Interview
          </button>
        )}
      </div>      {/* Browser compatibility warning */}
      {(callStatus === CallStatus.INACTIVE && !showSupport) && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            🎤 Make sure to allow microphone access for voice interview
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Works best in Chrome, Edge, or Safari
          </p>
          <button 
            onClick={() => setShowSupport(true)}
            className="text-xs text-blue-500 underline mt-1"
          >
            Check browser compatibility
          </button>
        </div>
      )}

      {/* Browser Support Component */}
      {showSupport && (
        <div className="mt-4">
          <BrowserSupport onSupportChecked={setIsSupported} />
          <button 
            onClick={() => setShowSupport(false)}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Hide compatibility check
          </button>
        </div>
      )}      {/* Temporary Test Button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-center space-x-2">
          <button 
            className="btn-primary"
            onClick={() => {
              const testMessages: VoiceMessage[] = [
                { role: 'assistant', content: 'Hello! Thank you for taking the time to speak with me today. What is your experience with React?' },
                { role: 'user', content: 'I have been working with React for 3 years, building dynamic web applications.' },
                { role: 'assistant', content: 'That sounds great! Can you tell me about a challenging project you worked on?' },
                { role: 'user', content: 'I built a complex dashboard with real-time data updates using React hooks and context API.' }
              ];
              setMessages(testMessages);
              setCallStatus(CallStatus.FINISHED);
            }}
          >
            Test Complete ({type})
          </button>
          
          {type === "generate" && (
            <>
              <button 
                className="btn-secondary ml-2"
                onClick={() => {
                  const generateMessages: VoiceMessage[] = [
                    { role: 'assistant', content: 'Hello! I\'m here to help you create custom interview questions. What job role are you preparing for?' },
                    { role: 'user', content: 'I want to prepare for a Senior Frontend Developer position.' },
                    { role: 'assistant', content: 'Great! What technologies and frameworks should the interview focus on?' },
                    { role: 'user', content: 'I want questions about React, TypeScript, Node.js, and system design. Make it challenging for a senior level position.' },
                    { role: 'assistant', content: 'Perfect! How many questions would you like me to generate?' },
                    { role: 'user', content: 'Please generate 8 questions, mix of technical and behavioral questions.' }
                  ];
                  setMessages(generateMessages);
                  setCallStatus(CallStatus.FINISHED);
                }}
              >
                Test Generate Interview
              </button>
              
              <button 
                className="btn-secondary ml-2"
                onClick={() => {
                  // Test with empty conversation (should redirect gracefully)
                  setMessages([]);
                  setCallStatus(CallStatus.FINISHED);
                }}
              >
                Test Empty Conversation
              </button>
              
              <button 
                className="btn-secondary ml-2"
                onClick={() => {
                  // Test with insufficient conversation (should redirect gracefully)
                  const shortMessages: VoiceMessage[] = [
                    { role: 'assistant', content: 'Hi' },
                    { role: 'user', content: 'Ok' }
                  ];
                  setMessages(shortMessages);
                  setCallStatus(CallStatus.FINISHED);
                }}
              >
                Test Short Conversation
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Agent;
