"use client";

import { useState, useEffect } from "react";

interface BrowserSupportProps {
  onSupportChecked: (isSupported: boolean) => void;
}

const BrowserSupport = ({ onSupportChecked }: BrowserSupportProps) => {
  const [supportStatus, setSupportStatus] = useState<{
    speechRecognition: boolean;
    speechSynthesis: boolean;
    microphone: boolean;
  }>({
    speechRecognition: false,
    speechSynthesis: false,
    microphone: false,
  });

  useEffect(() => {
    const checkSupport = async () => {
      // Check Speech Recognition
      const speechRecognitionSupported = 
        'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

      // Check Speech Synthesis
      const speechSynthesisSupported = 'speechSynthesis' in window;

      // Check Microphone Access
      let microphoneSupported = false;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          microphoneSupported = true;
          // Stop the stream immediately
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Microphone access denied or not available');
        }
      }

      const status = {
        speechRecognition: speechRecognitionSupported,
        speechSynthesis: speechSynthesisSupported,
        microphone: microphoneSupported,
      };

      setSupportStatus(status);
      
      // Check if all required features are supported
      const isFullySupported = speechRecognitionSupported && speechSynthesisSupported && microphoneSupported;
      onSupportChecked(isFullySupported);
    };

    checkSupport();
  }, [onSupportChecked]);

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="font-semibold mb-2">Browser Compatibility</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className={supportStatus.speechRecognition ? "text-green-500" : "text-red-500"}>
            {supportStatus.speechRecognition ? "✓" : "✗"}
          </span>
          <span>Speech Recognition</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={supportStatus.speechSynthesis ? "text-green-500" : "text-red-500"}>
            {supportStatus.speechSynthesis ? "✓" : "✗"}
          </span>
          <span>Text-to-Speech</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={supportStatus.microphone ? "text-green-500" : "text-red-500"}>
            {supportStatus.microphone ? "✓" : "✗"}
          </span>
          <span>Microphone Access</span>
        </div>
      </div>
      
      {(!supportStatus.speechRecognition || !supportStatus.speechSynthesis) && (
        <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
          ⚠️ For the best experience, please use Chrome, Edge, or Safari browser.
        </div>
      )}
      
      {!supportStatus.microphone && (
        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-sm">
          🎤 Microphone access is required for voice interviews. Please allow microphone permissions.
        </div>
      )}
    </div>
  );
};

export default BrowserSupport;
