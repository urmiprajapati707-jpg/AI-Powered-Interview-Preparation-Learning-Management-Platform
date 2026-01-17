
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  Code, 
  User, 
  Trophy, 
  Play, 
  MessageSquare, 
  Search, 
  Download, 
  Users, 
  ArrowRight, 
  Zap, 
  Mic, 
  Send,
  Plus,
  Home,
  ChevronRight,
  Monitor,
  CheckCircle,
  Award,
  Settings,
  LogOut,
  Terminal,
  Pause,
  Volume2,
  Flame,
  Star,
  ShieldCheck,
  Target,
  Menu,
  X,
  Video,
  VideoOff,
  Camera,
  RefreshCcw,
  Maximize2,
  CircleStop,
  MicOff
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
type Section = 'home' | 'notes' | 'interview' | 'problems' | 'videos' | 'leaderboard' | 'profile';
type UserProfile = {
  name: string;
  points: number;
  level: number;
  streak: number;
  badges: string[];
  solvedProblems: number;
  lessonsCompleted: number;
};

// --- Constants & Data ---
const NOTES_CATEGORIES = [
  { id: 'fullstack', title: 'Java Full Stack', items: ['Core Java', 'OOPs & SOLID', 'DSA Foundations', 'Spring Boot 3.0', 'Microservices', 'PostgreSQL', 'System Design'] },
  { id: 'company', title: 'Top-Tier Preparation', items: ['FAANG Foundations', 'TCS NQT Prep', 'Infosys Specialized', 'Amazon SDE-1', 'Microsoft OA'] }
];

const PRACTICE_PROBLEMS = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Arrays', starter: 'class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // Write code here\n  }\n}' },
  { id: 2, title: 'Reverse Linked List', difficulty: 'Medium', category: 'Linked List', starter: 'class Solution {\n  public ListNode reverseList(ListNode head) {\n    // Write code here\n  }\n}' },
  { id: 3, title: 'Merge Intervals', difficulty: 'Medium', category: 'Arrays', starter: 'class Solution {\n  public int[][] merge(int[][] intervals) {\n    // Write code here\n  }\n}' },
];

const LEADERBOARD_DATA = [
  { name: 'Aditya R.', points: 4850, rank: 1, level: 12 },
  { name: 'Priya K.', points: 4100, rank: 2, level: 10 },
  { name: 'Sameer V.', points: 3980, rank: 3, level: 9 },
  { name: 'Neha S.', points: 3850, rank: 4, level: 9 },
  { name: 'Karthik M.', points: 3720, rank: 5, level: 8 },
];

// --- Shared Components ---

const GlassCard = ({ children, className = "", onClick }: any) => (
  <div 
    onClick={onClick}
    className={`glass rounded-3xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/10 active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, color = "indigo" }: any) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-${color}-500/30 text-${color}-400 bg-${color}-500/10 uppercase tracking-wider`}>
    {children}
  </span>
);

// --- AI Video Interview Module ---

const AIVideoInterview = ({ addPoints }: { addPoints: (p: number) => void }) => {
  const [mode, setMode] = useState<'Technical' | 'Behavioral'>('Technical');
  const [role, setRole] = useState('Java Backend Developer');
  const [status, setStatus] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [questions, setQuestions] = useState<{q: string, a?: string, feedback?: string}[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (status === 'interview') {
      startCamera();
      initSpeechRecognition();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [status]);

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setUserInput(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startInterview = async () => {
    setIsThinking(true);
    setStatus('interview');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a senior interviewer for a ${role} position. Mode: ${mode}. Generate 4 deep-dive questions for a candidate. Return as JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const qs = JSON.parse(response.text);
      setQuestions(qs.map((q: string) => ({ q })));
      speak(qs[0]);
    } catch (e) {
      setQuestions([{ q: "Tell me about a complex technical challenge you've overcome in your career." }]);
    }
    setIsThinking(false);
  };

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1.1;
    speechSynthesis.speak(utter);
  };

  const submitAnswer = async () => {
    if (!userInput.trim()) return;
    if (isRecording) toggleRecording();
    
    const currentQ = questions[currentIdx];
    setIsThinking(true);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Question: ${currentQ.q}\nAnswer: ${userInput}\nScore this answer out of 10 and provide feedback. Also evaluate candidate's communication style. JSON format: {score: number, feedback: string}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            }
          }
        }
      });
      const evalData = JSON.parse(response.text);
      const updated = [...questions];
      updated[currentIdx] = { ...currentQ, a: userInput, feedback: evalData.feedback };
      setQuestions(updated);
      setUserInput('');
      
      if (currentIdx < questions.length - 1) {
        const next = currentIdx + 1;
        setCurrentIdx(next);
        speak(questions[next].q);
      } else {
        setStatus('feedback');
        addPoints(250);
      }
    } catch (e) {
      console.error(e);
    }
    setIsThinking(false);
  };

  if (status === 'setup') {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pt-10">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border-4 border-indigo-500/30">
            <Video className="text-indigo-400 w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Video Interview Hub</h2>
          <p className="text-slate-400 text-lg font-medium">Professional grade simulation with real-time face tracking and AI analysis.</p>
        </div>

        <GlassCard className="grid md:grid-cols-2 gap-10 p-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interview Mode</label>
              <div className="flex bg-white/5 p-1 rounded-2xl">
                {(['Technical', 'Behavioral'] as const).map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === m ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-500'}`}
                  >
                    {m} Round
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Role</label>
                <input 
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all text-lg font-bold text-white"
                  placeholder="e.g. Full Stack Engineer @ Google"
                />
              </div>
            </div>
            
            <button 
              onClick={startInterview}
              disabled={isThinking}
              className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-indigo-600/20 disabled:opacity-50 text-white"
            >
              <Camera className="w-6 h-6" />
              <span>Enter Virtual Suite</span>
            </button>
          </div>

          <div className="bg-white/5 rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center space-y-4 text-center">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-indigo-500" />
             </div>
             <h4 className="font-bold text-white">System Check Ready</h4>
             <p className="text-sm text-slate-500">Camera and microphone access will be requested upon entry. AI will analyze your posture, speech, and technical accuracy.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (status === 'interview') {
    return (
      <div className="max-w-7xl mx-auto h-[85vh] flex flex-col lg:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Interviewer Pane */}
        <div className="flex-[1.2] glass rounded-[3rem] overflow-hidden flex flex-col relative border-indigo-500/20">
          <div className="p-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg ${isThinking ? 'animate-pulse' : ''}`}>
                    <Monitor className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-none">Senior AI Interviewer</h4>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1 inline-block">Professional Mode</span>
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recording Session</span>
               </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-6">
                <div className="inline-block px-4 py-1.5 glass border-indigo-500/30 rounded-full">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Current Question {currentIdx + 1}/{questions.length}</span>
                </div>
                <h3 className="text-3xl font-black text-white leading-tight min-h-[120px]">
                  {isThinking ? (
                    <span className="flex items-center space-x-2">
                      <span className="animate-bounce delay-75">.</span>
                      <span className="animate-bounce delay-150">.</span>
                      <span className="animate-bounce delay-300">.</span>
                    </span>
                  ) : questions[currentIdx]?.q}
                </h3>
              </div>
            </div>

            <div className="mt-auto space-y-6">
               <div className="flex flex-col space-y-4">
                 <div className="glass p-1 rounded-3xl flex items-center border-white/10 group focus-within:ring-2 ring-indigo-500 transition-all">
                    <textarea 
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      placeholder={isRecording ? "Listening to your answer..." : "Click record to start answering..."}
                      className="flex-1 bg-transparent p-5 outline-none font-medium text-lg text-white resize-none min-h-[100px]"
                    />
                    <div className="flex flex-col space-y-2 p-2 self-end">
                      <button 
                        onClick={submitAnswer}
                        disabled={isThinking || !userInput.trim()}
                        className="p-4 bg-indigo-600 rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all text-white shadow-lg"
                        title="Submit Answer"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                 </div>

                 {/* Central Recording Button */}
                 <div className="flex items-center justify-center pt-2">
                    <button 
                      onClick={toggleRecording}
                      className={`relative group p-6 rounded-full transition-all duration-500 flex items-center justify-center ${isRecording ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]'}`}
                    >
                      {isRecording ? <CircleStop className="w-10 h-10 text-white animate-pulse" /> : <Mic className="w-10 h-10 text-white" />}
                      <span className={`absolute -bottom-8 font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${isRecording ? 'text-red-400' : 'text-slate-500'}`}>
                        {isRecording ? "Stop Recording" : "Start Recorded Answer"}
                      </span>
                    </button>
                 </div>
               </div>
               <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6">Speak clearly and use technical keywords</p>
            </div>
          </div>
        </div>

        {/* Candidate Feed Pane */}
        <div className="lg:w-[450px] space-y-6 flex flex-col">
          <div className="relative glass rounded-[2.5rem] overflow-hidden flex-1 border-white/5 shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute top-6 left-6 flex space-x-2">
              <div className="px-3 py-1.5 glass backdrop-blur-md rounded-lg flex items-center space-x-2 border-white/10">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span className="text-[10px] font-black text-white uppercase tracking-tighter">HD Live</span>
              </div>
            </div>
            {isRecording && (
              <div className="absolute top-6 right-6 flex items-center space-x-2 bg-red-500/80 px-3 py-1 rounded-full animate-pulse">
                <Mic className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">On Air</span>
              </div>
            )}
            <div className="absolute bottom-6 right-6">
              <button className="p-3 glass rounded-xl border-white/10 hover:bg-white/10 transition-all">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <GlassCard className="p-6 space-y-4">
             <div className="flex items-center justify-between">
                <h5 className="font-bold text-white text-sm">Session Analytics</h5>
                <Badge color="indigo">Live Feed</Badge>
             </div>
             <div className="space-y-4">
               <div className="space-y-2">
                 <div className="flex justify-between text-xs">
                   <span className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Sentiment Score</span>
                   <span className="text-white font-black">92%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: '92%' }}></div>
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between text-xs">
                   <span className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Speech Clarity</span>
                   <span className="text-white font-black">88%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: '88%' }}></div>
                 </div>
               </div>
             </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/30">
          <Award className="text-yellow-500 w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black text-white">Post-Interview Brief</h2>
        <p className="text-slate-400 font-medium">Your specialized performance metrics have been compiled.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {questions.map((q, i) => (
          <GlassCard key={i} className="space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <span className="font-black text-indigo-400 text-sm">INTERROGATORY {i+1}</span>
              <Badge color="green">Analyzed</Badge>
            </div>
            <h5 className="font-bold text-white">{q.q}</h5>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                <span className="text-indigo-400 font-bold block mb-1 uppercase tracking-tighter text-[10px]">AI Evaluator:</span>
                {q.feedback}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-10">
        <button 
          onClick={() => setStatus('setup')}
          className="flex-1 py-5 bg-indigo-600 rounded-2xl font-black text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95"
        >
          Begin New Session
        </button>
        <button className="flex-1 py-5 glass border-white/10 rounded-2xl font-black text-white hover:bg-white/5 transition-all">
          Download PDF Report
        </button>
      </div>
    </div>
  );
};

// --- Main App Components ---

const AuthScreen = ({ onLogin }: { onLogin: (user: string) => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-fuchsia-600/20 blur-[120px] rounded-full"></div>
      </div>
      
      <div className="max-w-md w-full text-center space-y-10">
        <div className="relative inline-block animate-float">
          <div className="w-28 h-28 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/50">
            <ShieldCheck className="text-white w-14 h-14" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-[#020617] flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter leading-none text-white uppercase">
            PLACEMENT <br />
            <span className="gradient-text uppercase tracking-tighter">PREPARATION</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium px-4">
            The world's most advanced AI-driven video interview and full-stack learning platform.
          </p>
        </div>
        
        <div className="space-y-4 pt-6">
          <button 
            onClick={() => onLogin('Guest Candidate')}
            className="w-full py-5 px-8 glass rounded-2xl flex items-center justify-center space-x-4 border-white/20 hover:border-white/40 transition-all active:scale-95 group"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:rotate-12 transition-transform" alt="google" />
            <span className="font-bold text-lg text-white">Sign in with Google</span>
          </button>
          
          <button 
            onClick={() => onLogin('Guest Candidate')}
            className="w-full py-5 px-8 bg-indigo-600 rounded-2xl flex items-center justify-center space-x-4 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
          >
            <span className="font-bold text-lg text-white">Get Started Free</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, setSection }: { profile: UserProfile, setSection: (s: Section) => void }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white">Welcome back, {profile.name.split(' ')[0]}!</h2>
          <p className="text-slate-400 font-medium">You're on a {profile.streak} day learning streak. Keep it up!</p>
        </div>
        <div className="flex space-x-4">
          <GlassCard className="py-3 px-6 flex items-center space-x-3 border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="text-xl font-black text-white">{profile.streak}d</span>
          </GlassCard>
          <GlassCard className="py-3 px-6 flex items-center space-x-3 border-indigo-500/20">
            <Target className="w-5 h-5 text-indigo-400" />
            <span className="text-xl font-black text-white">Lvl {profile.level}</span>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard 
          className="lg:col-span-2 bg-indigo-600/20 border-indigo-500/30 flex items-center justify-between p-10 overflow-hidden relative group"
          onClick={() => setSection('interview')}
        >
          <div className="space-y-4 relative z-10">
            <Badge color="pink">New: Recorded Answer Hub</Badge>
            <h3 className="text-4xl font-black leading-tight text-white uppercase tracking-tighter">AI Video<br />Interview Suite</h3>
            <p className="text-slate-400 text-lg max-w-[320px]">Real-time evaluation with our senior engineer AI agent using live camera and voice transcription.</p>
            <button className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-black transition-all flex items-center space-x-2 text-white shadow-xl shadow-indigo-600/20">
               <Video className="w-5 h-5" />
               <span>Enter Suite</span>
            </button>
          </div>
          <div className="hidden sm:flex w-48 h-48 bg-indigo-500/30 rounded-[3rem] items-center justify-center group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0">
            <Camera className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="absolute -right-8 -top-8 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        </GlassCard>

        <GlassCard className="space-y-6">
           <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest">Placement Roadmap</h4>
           <div className="space-y-6">
              {[
                { label: 'Core Java Foundations', progress: 85, color: 'indigo' },
                { label: 'DSA - Arrays & Lists', progress: 40, color: 'purple' },
                { label: 'Spring Boot Basics', progress: 12, color: 'blue' },
              ].map(p => (
                <div key={p.label} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-white">{p.label}</span>
                    <span className="font-black text-indigo-400">{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-${p.color}-500 transition-all duration-1000`} style={{ width: `${p.progress}%` }}></div>
                  </div>
                </div>
              ))}
           </div>
           <button onClick={() => setSection('notes')} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all text-white border border-white/5">
             Continue Lesson Path
           </button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'notes', title: 'Knowledge Base', sub: 'Study Materials', icon: BookOpen, color: 'blue' },
          { id: 'problems', title: 'Coding Hub', sub: 'DSA Challenges', icon: Code, color: 'green' },
          { id: 'videos', title: 'Video Vault', sub: 'Specialized Courses', icon: Play, color: 'orange' },
          { id: 'leaderboard', title: 'Community', sub: 'Global Rank', icon: Trophy, color: 'yellow' },
        ].map(item => (
          <GlassCard key={item.id} onClick={() => setSection(item.id as any)} className="group hover:border-white/20">
            <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-6 h-6 text-${item.color}-400`} />
            </div>
            <h4 className="font-black text-lg text-white uppercase tracking-tighter">{item.title}</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{item.sub}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Sameer Varma',
    points: 2450,
    level: 5,
    streak: 12,
    badges: ['Java Master', 'Algorithm Hero'],
    solvedProblems: 84,
    lessonsCompleted: 32
  });

  const addPoints = (p: number) => {
    setProfile(prev => ({ ...prev, points: prev.points + p, level: Math.floor((prev.points + p) / 500) + 1 }));
  };

  if (!isLoggedIn) {
    return <AuthScreen onLogin={(name) => { setIsLoggedIn(true); setProfile(p => ({ ...p, name })); }} />;
  }

  const NavItem = ({ s, icon: Icon, label }: { s: Section, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveSection(s)}
      className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group ${activeSection === s ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      <div className={`${activeSection === s ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      {isSidebarOpen && <span className="font-bold text-sm tracking-wide uppercase">{label}</span>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] overflow-hidden text-white font-sans">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-600/5 blur-[120px] rounded-full"></div>
      </div>

      <aside className={`h-screen border-r border-white/5 glass sticky top-0 transition-all duration-500 z-50 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-24'} p-4`}>
        <div className="flex items-center space-x-4 px-4 py-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/50">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          {isSidebarOpen && <h1 className="font-black text-xl tracking-tighter italic gradient-text whitespace-nowrap overflow-hidden uppercase">PLACEMENT PREP</h1>}
        </div>

        <div className="flex-1 space-y-2 mt-4 px-2">
          <NavItem s="home" icon={Home} label="Dashboard" />
          <NavItem s="notes" icon={BookOpen} label="Knowledge" />
          <NavItem s="interview" icon={Video} label="Video Interview" />
          <NavItem s="problems" icon={Terminal} label="Practice Hub" />
          <NavItem s="videos" icon={Play} label="Lectures" />
          <NavItem s="leaderboard" icon={Trophy} label="Rankings" />
        </div>

        <div className="mt-auto px-2 pb-6 space-y-2">
          <NavItem s="profile" icon={User} label="Profile" />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-4 text-slate-500 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto no-scrollbar relative flex flex-col">
        <header className="sticky top-0 z-40 px-10 py-6 glass border-b border-white/5 flex items-center justify-between backdrop-blur-xl bg-[#020617]/40">
           <div className="flex items-center space-x-6 flex-1">
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input placeholder="Search concepts or patterns..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-indigo-500 transition-all font-medium text-white" />
              </div>
           </div>
           
           <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-3 glass px-4 py-2 rounded-2xl border-indigo-500/20">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-black text-sm text-white">{profile.points} XP</span>
              </div>
              <div className="flex items-center space-x-3">
                 <div className="text-right hidden lg:block">
                    <p className="text-sm font-black text-white">{profile.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lvl {profile.level} Candidate</p>
                 </div>
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white font-black text-sm tracking-tighter">PP</span>
                 </div>
              </div>
           </div>
        </header>

        <main className="p-10">
           {activeSection === 'home' && <Dashboard profile={profile} setSection={setActiveSection} />}
           {activeSection === 'interview' && <AIVideoInterview addPoints={addPoints} />}
           {activeSection === 'problems' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {PRACTICE_PROBLEMS.map(prob => (
                 <GlassCard key={prob.id} className="group hover:border-indigo-500/30">
                   <div className="flex justify-between items-start mb-4">
                     <Badge color={prob.difficulty === 'Easy' ? 'green' : 'orange'}>{prob.difficulty}</Badge>
                     <p className="text-xs font-black text-slate-500">{prob.category}</p>
                   </div>
                   <h4 className="text-xl font-bold mb-6 text-white uppercase tracking-tighter">{prob.title}</h4>
                   <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black transition-all text-white">Solve Challenge</button>
                 </GlassCard>
               ))}
             </div>
           )}
           {activeSection === 'notes' && (
             <div className="grid md:grid-cols-2 gap-10">
               {NOTES_CATEGORIES.map(cat => (
                 <div key={cat.id} className="space-y-6">
                   <h3 className="text-2xl font-black gradient-text uppercase tracking-tighter">{cat.title}</h3>
                   <div className="grid gap-4">
                     {cat.items.map(item => (
                       <GlassCard key={item} className="flex items-center justify-between group">
                         <span className="font-bold text-lg text-white">{item}</span>
                         <div className="flex space-x-2">
                           <button className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-4 h-4 text-white" /></button>
                           <ArrowRight className="w-5 h-5 text-indigo-500" />
                         </div>
                       </GlassCard>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           )}
           {activeSection === 'leaderboard' && (
              <div className="max-w-4xl mx-auto space-y-8">
                 <div className="text-center">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Global Leaderboard</h2>
                    <p className="text-slate-500 font-bold mt-2">Ranked by points and successful mock interviews</p>
                 </div>
                 <div className="glass rounded-[3rem] p-4 overflow-hidden shadow-2xl">
                    {LEADERBOARD_DATA.map((u, i) => (
                      <div key={u.name} className={`flex items-center justify-between p-6 rounded-3xl ${i === 2 ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-white/5'} transition-all`}>
                         <div className="flex items-center space-x-6">
                            <span className={`text-2xl font-black w-8 ${i < 3 ? 'text-yellow-500' : 'text-slate-600'}`}>{i+1}</span>
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner"><User className="w-7 h-7 text-slate-400" /></div>
                            <div>
                               <p className="text-xl font-bold text-white">{u.name}</p>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lvl {u.level} Aspirant</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-2xl font-black text-indigo-400">{u.points} XP</p>
                            <Badge color="green">TOP-100</Badge>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           )}
           {activeSection === 'videos' && (
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(v => (
                 <GlassCard key={v} className="p-0 overflow-hidden group">
                   <div className="h-48 bg-white/10 relative overflow-hidden">
                     <img src={`https://images.unsplash.com/photo-${1580000000000 + v}?w=500&q=80`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white fill-white" />
                     </div>
                   </div>
                   <div className="p-6">
                      <h4 className="font-bold text-lg text-white uppercase tracking-tighter">Advanced Concepts: Episode {v}</h4>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">45:00 • 4K UHD</span>
                        <ArrowRight className="w-5 h-5 text-indigo-500" />
                      </div>
                   </div>
                 </GlassCard>
               ))}
             </div>
           )}
           {activeSection === 'profile' && (
             <div className="max-w-5xl mx-auto flex flex-col items-center py-10">
                <div className="relative group">
                   <div className="w-48 h-48 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-[4rem] flex items-center justify-center shadow-2xl relative">
                      <User className="w-24 h-24 text-white" />
                      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-yellow-500 rounded-[1.5rem] border-8 border-[#020617] flex items-center justify-center">
                         <Star className="w-8 h-8 text-white fill-white" />
                      </div>
                   </div>
                </div>
                <h2 className="text-4xl font-black mt-10 text-white uppercase tracking-tighter">{profile.name}</h2>
                <p className="text-xl text-indigo-400 font-black uppercase tracking-widest mt-2">Associate SDE Aspirant</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-12">
                   <GlassCard className="text-center">
                      <p className="text-3xl font-black text-white">{profile.points}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Total Points</p>
                   </GlassCard>
                   <GlassCard className="text-center">
                      <p className="text-3xl font-black text-white">{profile.streak}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Daily Streak</p>
                   </GlassCard>
                   <GlassCard className="text-center">
                      <p className="text-3xl font-black text-white">{profile.solvedProblems}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Problems</p>
                   </GlassCard>
                   <GlassCard className="text-center">
                      <p className="text-3xl font-black text-white">{profile.level}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1">Skill Lvl</p>
                   </GlassCard>
                </div>
                
                <div className="w-full mt-10 grid md:grid-cols-2 gap-6">
                  <button className="flex items-center justify-between p-8 glass rounded-[2.5rem] hover:bg-white/10 transition-all text-white border-white/10">
                    <div className="flex items-center space-x-6">
                      <Award className="w-10 h-10 text-yellow-500" />
                      <span className="font-black text-2xl uppercase tracking-tighter">Achievements</span>
                    </div>
                    <ChevronRight className="w-8 h-8 text-slate-500" />
                  </button>
                  <button onClick={() => setIsLoggedIn(false)} className="flex items-center justify-between p-8 glass rounded-[2.5rem] hover:bg-red-500/10 text-red-400 border-red-500/20 transition-all">
                    <div className="flex items-center space-x-6">
                      <LogOut className="w-10 h-10" />
                      <span className="font-black text-2xl uppercase tracking-tighter">Logout</span>
                    </div>
                  </button>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
