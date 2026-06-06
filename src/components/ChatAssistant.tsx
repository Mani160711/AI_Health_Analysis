import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  LifeBuoy, 
  Sparkles, 
  Check, 
  Mic, 
  MicOff, 
  Trash2, 
  AlertTriangle,
  Clock,
  Sparkle
} from 'lucide-react';
import { ChatMessage } from '../types';
import { getCollection, addDocSync, onSnapshotSync } from '../firebase';

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Connect to Firestore collection
  const chatCollection = getCollection('chats');

  // Trigger scroll to bottom on message count updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Real-time listener for synchronization with Firestore
  useEffect(() => {
    const unsubscribe = onSnapshotSync(chatCollection, (data) => {
      if (data.length === 0) {
        // Seeding the first greeting automatically
        const welcomeDoc = {
          id: 'welcome',
          sender: 'ai' as const,
          text: 'Good day! I am your MediSense AI health assistant. I can help interpret laboratory results, answer general medical questions, or support stress triggers. What clinical topics would you like to explore?',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeDoc]);
      } else {
        // Map to standard ChatMessage sorted chronologically
        const sorted = [...data]
          .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
          .map((doc: any) => ({
            id: doc.id,
            sender: doc.sender as 'user' | 'ai',
            text: doc.text || '',
            timestamp: doc.timestamp ? new Date(doc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
          }));
        setMessages(sorted);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up the Web Speech API Recognition
  useEffect(() => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechClass) {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const SpeechResult = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + SpeechResult : SpeechResult));
        setIsListening(false);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Speech Recognition control
  const toggleSpeech = () => {
    if (!recognition) {
       alert("Speech recognition is not fully supported in this browser layout.");
       return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const quickQuestions = [
    'How do I interpret high raw C-Reactive Protein (CRP)?',
    'General diagnostic indicators for cardiorespiratory fatigue',
    'Cognitive strategies to navigate clinical stress'
  ];

  // Send message process
  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    setInputText('');
    setIsTyping(true);

    try {
      // 1. Log user message to Firestore
      await addDocSync(chatCollection, {
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toISOString()
      });

      // 2. Fetch standard previous message logs to present context correctly to Gemini API
      const conversationHistory = messages.slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      // 3. Post telemetry payload to our server API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('Chat API network failure.');
      }

      const result = await response.json();
      const replyText = result.text || 'Understood. Please consult a physician regarding diagnostics.';

      // 4. Save Gemini response to Firestore
      await addDocSync(chatCollection, {
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error("AI chat delivery failure:", err);
      // Log static fallback error message safely to db
      await addDocSync(chatCollection, {
        sender: 'ai',
        text: 'I detected a connection latency in our diagnostic client. Please verify client integrations.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Safe manual cache wipe (clear chat)
  const handleWipeHistory = () => {
    try {
      localStorage.removeItem('chats');
      setMessages([]);
      // Force instant seed
      const welcomeDoc = {
        id: 'welcome',
        sender: 'ai' as const,
        text: 'History refreshed. I am your MediSense AI health assistant. What clinical topics would you like to explore?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeDoc]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-11rem)]">
      {/* Header element */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium text-slate-100 tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-[#14B8A6]" /> Empirical Clinical Assistant
          </h1>
          <p className="text-slate-400 mt-1">
            Converse with an empathetic primary triage model optimized to structure symptoms, interpret laboratory indexes, and map clinical concerns.
          </p>
        </div>

        {/* Clear chat button */}
        <button
          onClick={handleWipeHistory}
          title="Clear Conversation History"
          className="flex items-center gap-1.5 text-xs font-mono font-semibold bg-slate-900/80 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 hover:border-rose-900 px-3 py-2 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4" /> Clear Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Core conversation panel */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between h-full min-h-[400px]">
          
          {/* Messages scroll section */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Sender Icons */}
                  <div className={`p-2 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isAI 
                      ? 'bg-[#14B8A6]/15 border border-[#14B8A6]/40 text-[#14B8A6] shadow-teal-950/20' 
                      : 'bg-indigo-950/40 border border-indigo-800/80 text-indigo-400 shadow-indigo-950/20'
                  }`}>
                    {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Bubble body with glass fallback requested */}
                  <div className="space-y-1">
                    <div 
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAI
                          ? 'bg-slate-900/40 backdrop-blur-md text-slate-300 border border-slate-800/80 rounded-tl-none'
                          : 'bg-gradient-to-br from-teal-600 to-[#14B8A6] text-white rounded-tr-none border border-[#14B8A6]/35'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="block text-[9px] font-mono text-slate-500 px-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Structured typing / generating indicator with 3 waving dots requested */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="p-2 h-9 w-9 rounded-xl bg-[#14B8A6]/15 border border-[#14B8A6]/40 text-[#14B8A6] flex items-center justify-center">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-[#042F2E]/60 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border border-[#145e5c]/40 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] animate-bounce delay-75" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] animate-bounce delay-150" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] animate-bounce delay-300" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* User chat input panel */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            {/* Quick action chips */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-950 hover:bg-slate-850 hover:text-slate-300 border border-slate-850 transition-colors cursor-pointer flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input elements */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  placeholder="Inquire symptom risks or parse laboratory variables..."
                  className="w-full bg-[#042F2E]/40 border border-[#145e5c]/40 rounded-xl pl-4 pr-10 py-3.5 text-sm text-slate-200 placeholder-teal-400/50 focus:outline-none focus:border-[#14B8A6] transition-colors"
                />

                {/* Voice speech triggers requested */}
                <button
                  type="button"
                  onClick={toggleSpeech}
                  title={isListening ? "Listening active. Click to end." : "Transcribe question with voice"}
                  className={`absolute right-3 top-3.5 rounded-full p-1 transition-all cursor-pointer ${
                    isListening 
                      ? 'text-red-500 hover:text-red-400 bg-red-950/20 animate-pulse' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isListening ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                </button>
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="bg-[#14B8A6] hover:bg-teal-500 disabled:bg-[#042F2E]/40 disabled:text-slate-500 text-slate-950 font-semibold px-5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar disclaimer / clinical overview panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#14B8A6]">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">Cognitive Assist</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              MediSense AI utilizes deep context models to structure conversations regarding physiological thresholds, diagnostic parameters and symptoms.
            </p>

            <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-450 text-rose-400 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs uppercase font-mono">Clinical Safety Flag</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Interactions represent general screening assessments. They do not constitute official physician examinations, medical diagnoses, or direct emergency advice.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 font-mono text-[10px] text-slate-400">
            <span className="text-xs font-semibold uppercase text-slate-200 font-mono tracking-wider block">Operational Status</span>
            <div className="space-y-2 divide-y divide-slate-850">
              <div className="flex justify-between items-center pt-2">
                <span>Model Pipeline:</span>
                <span className="text-[#14B8A6] font-semibold">gemini-3.5-flash</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Synchronized Store:</span>
                <span className="text-emerald-400 font-semibold">Firestore</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Web Speech API:</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
