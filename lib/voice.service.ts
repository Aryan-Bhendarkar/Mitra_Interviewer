interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationConfig {
  type: string;
  questions?: string[];
  userName: string;
  userId: string;
}

export class VoiceService {
  private eventListeners: Map<string, Function[]> = new Map();
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isActive: boolean = false;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private conversationHistory: VoiceMessage[] = [];
  private config: ConversationConfig | null = null;
  private currentQuestionIndex: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.setupRecognitionEvents();
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    }
  }

  private setupRecognitionEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('listening-start');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('listening-end');
      
      // Restart listening if conversation is still active and not speaking
      if (this.isActive && !this.isSpeaking) {
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking) {
            this.startListening();
          }
        }, 1000);
      }
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript) {
        this.handleUserInput(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', new Error(`Speech recognition error: ${event.error}`));
    };
  }

  private async handleUserInput(transcript: string) {
    console.log('User said:', transcript);
    
    // Add user message to history
    const userMessage: VoiceMessage = { role: 'user', content: transcript };
    this.conversationHistory.push(userMessage);
    this.emit('message', userMessage);

    // Stop listening while processing
    this.stopListening();
    this.emit('processing-start');

    try {
      // Generate AI response
      const aiResponse = await this.generateAIResponse(transcript);
      
      // Add AI message to history
      const aiMessage: VoiceMessage = { role: 'assistant', content: aiResponse };
      this.conversationHistory.push(aiMessage);
      this.emit('message', aiMessage);

      // Speak the AI response
      await this.speak(aiResponse);
      
      this.emit('processing-end');
      
      // Check if interview should end
      if (this.shouldEndConversation()) {
        this.stopConversation();
      } else {
        // Continue listening for next user input
        this.startListening();
      }
    } catch (error) {
      this.emit('processing-end');
      this.emit('error', error);
    }
  }

  private async generateAIResponse(userInput: string): Promise<string> {
    if (!this.config) {
      throw new Error('No conversation config available');
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: this.conversationHistory,
          type: this.config.type,
          questions: this.config.questions,
          currentQuestionIndex: this.currentQuestionIndex,
          userName: this.config.userName
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update question index if this was an interview question
      if (this.config.type === 'interview' && this.config.questions) {
        this.currentQuestionIndex++;
      }
      
      return data.response || "I'm sorry, I didn't understand that. Could you please repeat?";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm experiencing some technical difficulties. Could you please try again?";
    }
  }

  private shouldEndConversation(): boolean {
    if (!this.config) return true;
    
    if (this.config.type === 'interview' && this.config.questions) {
      // End if we've gone through all questions
      return this.currentQuestionIndex >= this.config.questions.length;
    }
    
    // For generate type, end after a reasonable number of exchanges
    if (this.config.type === 'generate') {
      return this.conversationHistory.length >= 20; // 10 exchanges
    }
    
    return false;
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.emit('speech-start');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.emit('speech-end');
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.emit('speech-end');
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  private startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }

  private stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
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

  public async startConversation(config: ConversationConfig) {
    if (!this.recognition || !this.synthesis) {
      throw new Error('Speech recognition or synthesis not supported');
    }

    this.config = config;
    this.isActive = true;
    this.conversationHistory = [];
    this.currentQuestionIndex = 0;

    console.log('Starting voice conversation with config:', config);

    // Start with AI greeting
    let greeting = '';
    if (config.type === 'interview') {
      greeting = `Hello ${config.userName}! I'm your AI interviewer today. I'll be asking you some questions to assess your skills and experience. Let's begin with our first question: ${config.questions?.[0] || 'Tell me about yourself.'}`;
    } else {
      greeting = `Hello ${config.userName}! I'm here to help you practice for interviews. Feel free to tell me about your background, skills, or any specific areas you'd like to work on.`;
    }

    this.emit('conversation-start');

    try {
      await this.speak(greeting);
      
      // Add AI greeting to history
      const greetingMessage: VoiceMessage = { role: 'assistant', content: greeting };
      this.conversationHistory.push(greetingMessage);
      this.emit('message', greetingMessage);
      
      // Start listening for user response
      this.startListening();
    } catch (error) {
      this.emit('error', error);
    }
  }

  public stopConversation() {
    console.log('Stopping voice conversation');
    this.isActive = false;
    this.stopListening();
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.emit('conversation-end');
  }

  public forceRestartListening() {
    if (this.isActive && !this.isSpeaking) {
      this.startListening();
    }
  }

  public getStatus() {
    return {
      isActive: this.isActive,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    };
  }

  public getConversationHistory() {
    return this.conversationHistory;
  }
}

// Global instance - only available on client side
let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (): VoiceService => {
  // Return null during SSR, will be handled by components
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
};
