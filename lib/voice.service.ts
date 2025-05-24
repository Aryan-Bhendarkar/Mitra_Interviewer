"use client";

import { INTERVIEWER_SYSTEM_PROMPT } from "@/constants";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
}

export class VoiceService {
  private eventListeners: Map<string, Function[]> = new Map();
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition: SpeechRecognition | null = null;
  private isActive = false;
  private isListening = false;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private conversationHistory: VoiceMessage[] = [];
  private systemPrompt = "";
  private questions: string[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.setupSpeechRecognition();
    } else {
      console.warn('Speech Recognition not supported in this browser');
      // Emit error for unsupported browsers
      setTimeout(() => {
        this.emit('error', new Error('Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.'));
      }, 100);
    }

    // Load voices when they become available
    this.speechSynthesis.onvoiceschanged = () => {
      console.log('Voices loaded:', this.speechSynthesis.getVoices().length);
    };
  }

  private setupSpeechRecognition() {
    if (!this.speechRecognition) return;

    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';

    this.speechRecognition.onstart = () => {
      this.isListening = true;
      this.emit('listening-start');
    };    this.speechRecognition.onend = () => {
      this.isListening = false;
      this.emit('listening-end');
      
      // Restart listening if conversation is still active and not speaking
      if (this.isActive && !this.isSpeaking) {
        // Add a longer delay to ensure speech has fully stopped
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking && !this.isListening) {
            this.startListening();
          }
        }, 1000);
      }
    };

    this.speechRecognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        if (transcript) {
          const userMessage: VoiceMessage = { role: 'user', content: transcript };
          this.conversationHistory.push(userMessage);
          this.emit('message', userMessage);
          this.processUserInput(transcript);
        }
      }
    };    this.speechRecognition.onerror = (event) => {
      // Handle specific error cases
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        console.log('Speech recognition: No speech detected, restarting...');
        // These are recoverable errors, restart listening
        if (this.isActive) {
          setTimeout(() => {
            if (this.isActive && !this.isListening && !this.isSpeaking) {
              this.startListening();
            }
          }, 1500);
        }      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // Permission issues - emit error to UI
        console.error('Speech recognition error:', event.error);
        this.emit('error', new Error('Microphone access denied. Please allow microphone permissions and try again.'));
      } else {
        // Other errors - try to restart after delay
        console.error('Speech recognition error:', event.error);
        if (this.isActive) {
          setTimeout(() => {
            if (this.isActive && !this.isListening && !this.isSpeaking) {
              this.startListening();
            }
          }, 2000);
        }
      }
    };  }

  private startHeartbeat() {
    // Clear any existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Check every 5 seconds if listening should be active
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive && !this.isSpeaking && !this.isListening) {
        console.log('Heartbeat: Restarting listening...');
        this.startListening();
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async processUserInput(userInput: string) {
    try {
      // Emit processing start
      this.emit('processing-start');
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(userInput);
      
      // Emit processing end
      this.emit('processing-end');
      
      const assistantMessage: VoiceMessage = { role: 'assistant', content: aiResponse };
      this.conversationHistory.push(assistantMessage);
      this.emit('message', assistantMessage);
      
      // Speak the AI response
      await this.speak(aiResponse);
    } catch (error) {
      this.emit('processing-end');
      console.error('Error processing user input:', error);
      this.emit('error', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async generateAIResponse(userInput: string): Promise<string> {
    const conversation = this.conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...conversation,
          { role: 'user', content: userInput }
        ],
        questions: this.questions
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    return data.response;
  }
  private speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isSpeaking) {
        this.speechSynthesis.cancel();
      }

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings with better voice selection
      const voices = this.speechSynthesis.getVoices();
      
      // Prefer high quality voices first
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (
          voice.name.toLowerCase().includes('microsoft') ||
          voice.name.toLowerCase().includes('google') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('female')
        )
      ) || voices.find(voice => voice.lang.startsWith('en') && voice.localService) ||
          voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        this.currentUtterance.voice = preferredVoice;
      }
      
      this.currentUtterance.rate = 0.85; // Slightly slower for better clarity
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;      this.currentUtterance.onstart = () => {
        this.isSpeaking = true;
        this.emit('speech-start');
      };
      
      this.currentUtterance.onend = () => {
        this.isSpeaking = false;
        this.emit('speech-end');
        
        // Ensure listening restarts after AI finishes speaking
        if (this.isActive) {
          setTimeout(() => {
            if (this.isActive && !this.isSpeaking && !this.isListening) {
              this.startListening();
            }
          }, 800);
        }
        
        resolve();
      };
      
      this.currentUtterance.onerror = (event) => {
        this.isSpeaking = false;
        this.emit('speech-end');
        
        // Handle "interrupted" as normal behavior when we cancel speech
        if (event.error === 'interrupted') {
          console.log('Speech synthesis was interrupted (normal when canceling)');
          resolve(); // Resolve normally since this is expected
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        }
      };

      this.speechSynthesis.speak(this.currentUtterance);
    });
  }
  
  private startListening() {
    if (!this.speechRecognition || !this.isActive) {
      console.log('Cannot start listening: speechRecognition or isActive is false');
      return;
    }

    // Don't start if already listening or currently speaking
    if (this.isListening || this.isSpeaking) {
      console.log('Cannot start listening: already listening or speaking', {
        isListening: this.isListening,
        isSpeaking: this.isSpeaking
      });
      return;
    }

    try {
      console.log('Starting speech recognition...');
      this.speechRecognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // If speech recognition fails, try again after a short delay
      if (this.isActive) {
        setTimeout(() => {
          if (this.isActive && !this.isListening && !this.isSpeaking) {
            console.log('Retrying speech recognition after error...');
            this.startListening();
          }
        }, 2000);
      }
    }
  }

  private stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
    }
  }  public async startConversation(config: {
    type: 'generate' | 'interview';
    questions?: string[];
    userName?: string;
    userId?: string;
  }) {
    if (this.isActive) {
      this.stopConversation();
    }

    // Check for microphone permissions
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      this.emit('error', new Error('Microphone access is required for voice interviews. Please allow microphone access and try again.'));
      return;
    }

    this.isActive = true;
    this.conversationHistory = [];
    this.questions = config.questions || [];

    // Set system prompt based on conversation type
    if (config.type === 'generate') {
      this.systemPrompt = `You are a professional interview question generator assistant. Help the user create interview questions for their job role. Be conversational and ask follow-up questions to understand their needs better. Keep responses concise since this is a voice conversation.`;
    } else {
      this.systemPrompt = `${INTERVIEWER_SYSTEM_PROMPT}

Interview Questions to ask:
${this.questions.map((q, index) => `${index + 1}. ${q}`).join('\n')}

Start with the first question and proceed naturally through the interview.`;
    }

    // Start heartbeat monitoring to ensure listening remains active
    this.startHeartbeat();

    this.emit('conversation-start');

    // Start with greeting
    const greeting = config.type === 'generate' 
      ? `Hello ${config.userName}! I'm here to help you create interview questions. What type of role are you preparing interview questions for?`
      : "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience. Let's start with the first question.";

    const greetingMessage: VoiceMessage = { role: 'assistant', content: greeting };
    this.conversationHistory.push(greetingMessage);
    this.emit('message', greetingMessage);

    // Speak greeting and start listening
    await this.speak(greeting);
    this.startListening();
  }
  public stopConversation() {
    this.isActive = false;
    this.stopListening();
    this.stopHeartbeat();
    
    if (this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }

    this.emit('conversation-end');
  }  public forceRestartListening() {
    console.log('Force restarting speech recognition...', {
      isActive: this.isActive,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    });
    
    this.stopListening();
    
    setTimeout(() => {
      if (this.isActive && !this.isSpeaking) {
        console.log('Force restart: Starting listening...');
        this.startListening();
      } else {
        console.log('Force restart: Cannot start listening', {
          isActive: this.isActive,
          isSpeaking: this.isSpeaking
        });
      }
    }, 1000);
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    };
  }

  public getConversationHistory(): VoiceMessage[] {
    return [...this.conversationHistory];
  }

  public on(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(listener => {
        listener(...args);
      });
    }
  }
}

// Global instance
let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
};
