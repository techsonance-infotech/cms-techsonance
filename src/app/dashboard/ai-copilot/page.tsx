'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Send, Sparkles, Brain, Cpu, TrendingUp, 
  AlertTriangle, ArrowRight, UserPlus, Upload, 
  Search, ShieldAlert, Zap, BookOpen, GraduationCap 
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! I am your **HR AI Copilot**. How can I help you optimize your workforce, parse resumes, check skill gaps, or audit compliance metrics today?', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'predictions' | 'parser'>('chat');

  // Parser State
  const [parsing, setParsing] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<any>(null);

  // Predictions State
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionsData, setPredictionsData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text: textToSend, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setSending(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'chat', query: textToSend })
      });

      if (res.ok) {
        const json = await res.json();
        const aiMsg: Message = {
          sender: 'ai',
          text: json.answer || 'Sorry, I did not understand that query.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        toast.error('AI assistant failed to process request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error contacting AI service');
    } finally {
      setSending(false);
    }
  };

  const runPredictionScan = async () => {
    setPredictionsLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'attrition_prediction' })
      });
      if (res.ok) {
        const json = await res.json();
        setPredictionsData(json.metrics);
        toast.success('Workforce predictive scan completed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const handleUploadResume = async () => {
    setParsing(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'parse_resume' })
      });
      if (res.ok) {
        const json = await res.json();
        setParsedProfile(json.extractedData);
        toast.success('Resume parsed and skills indexed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6 text-slate-900 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <Bot className="h-8 w-8 text-[#f87941]" />
              HR AI Copilot & Intel Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1">Central command for resume parsing, NL search queries, burnout prediction, and compliance analytics.</p>
          </div>
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <Cpu className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Gemini 1.5 Pro Integrated
          </Badge>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex gap-2 border-b pb-2.5 text-xs font-bold text-slate-500">
        {[
          { id: 'chat', label: 'AI Record Assistant & NL Search', icon: Search },
          { id: 'predictions', label: 'Workforce Predictors & Sentiment', icon: Brain },
          { id: 'parser', label: 'CV Resume Parsing Hub', icon: Upload }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#f87941]/15 text-[#f87941]' 
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side Main Action Panels */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* TAB 1: CO-PILOT CHAT ASSISTANT */}
          {activeTab === 'chat' && (
            <Card className="flex flex-col h-[600px] shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20 pb-4">
                <CardTitle className="text-md flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-400" /> Natural Language HR Query Assistant</CardTitle>
                <CardDescription>Search records, benchmark salary arrays, and retrieve profiles using chat commands.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[350px]">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-sm leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-[#f87941] text-white rounded-tr-none' 
                        : 'bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none text-slate-700 dark:text-slate-350'
                    }`}>
                      <p className="whitespace-pre-line font-medium">{m.text}</p>
                      <span className="block text-[8px] text-right mt-1.5 opacity-60 font-semibold">{m.timestamp}</span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-zinc-900 border rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2 text-slate-400 font-bold">
                      <Cpu className="h-4 w-4 animate-spin text-[#f87941]" />
                      Analyzing workspace database...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="p-4 border-t bg-slate-50/50 dark:bg-zinc-900/20 flex gap-2">
                <Input
                  placeholder="e.g. Show React Developers or Check Salary benchmarks..."
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(inputVal)}
                  className="bg-white dark:bg-[#1E1F22] border-border h-10 text-xs"
                />
                <Button onClick={() => handleSend(inputVal)} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-10 px-4 flex items-center gap-1">
                  <Send className="h-4 w-4" /> Send
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 2: PREDICTIVE SUITE */}
          {activeTab === 'predictions' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
                <CardTitle className="text-md">AI Workforce Predictive Predictors</CardTitle>
                <CardDescription>Predict attrition tendencies, burnout risks, and evaluate employee sentiment indices.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                <div className="flex justify-between items-center bg-[#f87941]/5 p-4 rounded-xl border border-[#f87941]/10">
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">Run Attrition & Sentiment Risk Scans</h5>
                    <p className="text-[10px] text-slate-400">Processes weekly hours logged, attendance check-ins, and leave requests.</p>
                  </div>
                  <Button onClick={runPredictionScan} disabled={predictionsLoading} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 flex items-center gap-1.5">
                    {predictionsLoading ? <Cpu className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Start Analytics Scan
                  </Button>
                </div>

                {predictionsData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div className="p-4 border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Calculated Attrition Risk</span>
                      <p className="text-lg font-black text-emerald-500">{predictionsData.attritionRisk}</p>
                    </div>
                    <div className="p-4 border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Active Burnout Warnings</span>
                      <p className="text-lg font-black text-rose-500">{predictionsData.burnoutAlerts}</p>
                    </div>
                    <div className="p-4 border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Employee Sentiment Score</span>
                      <p className="text-lg font-black text-indigo-400">{predictionsData.sentimentIndex}</p>
                    </div>
                    <div className="p-4 border border-slate-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Attendance Anomalies today</span>
                      <p className="text-lg font-black text-[#f87941]">{predictionsData.anomaliesCount}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 3: RESUME PARSING HUB */}
          {activeTab === 'parser' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
                <CardTitle className="text-md">CV Resume Extraction & Indexing Engine</CardTitle>
                <CardDescription>Drag and drop PDF/Docx files to extract names, experiences, education, and tag skillsets.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-xs">
                
                <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-900/20 hover:border-[#f87941]/50 cursor-pointer transition-all duration-300">
                  <div className="p-4 rounded-full bg-[#f87941]/10 text-[#f87941] mb-4">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Select Candidate Resume</h4>
                  <p className="text-[10px] text-slate-400 mb-4 max-w-sm">Supports PDF, DOCX, and text formats. OCR processing is activated automatically.</p>
                  <Button onClick={handleUploadResume} disabled={parsing} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {parsing ? <Cpu className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Simulate Upload & Parser Extraction
                  </Button>
                </div>

                {parsedProfile && (
                  <Card className="border border-slate-100 dark:border-zinc-850 shadow-md animate-fadeIn">
                    <CardHeader className="pb-2 border-b bg-slate-50/40 dark:bg-zinc-900/10">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> Extracted Structured Profile</h4>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px]">Name</span>
                        <p className="text-slate-800 dark:text-slate-200">{parsedProfile.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px]">Email & Contact</span>
                        <p className="text-slate-800 dark:text-slate-200">{parsedProfile.email} | {parsedProfile.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px]">Education</span>
                        <p className="text-slate-800 dark:text-slate-200">{parsedProfile.education}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px]">Indexed Experience</span>
                        <p className="text-slate-800 dark:text-slate-200">{parsedProfile.experience}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-slate-400 text-[10px] block mb-1">Skill Extraction Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedProfile.skills.map((s: string) => (
                            <Badge key={s} className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/20 font-bold px-2 py-0.5 text-[9px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Side Column: Fast Suggestions Cards */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Quick Queries Prompts */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
              <CardTitle className="text-md flex items-center gap-1.5"><Brain className="h-4.5 w-4.5 text-[#f87941]" /> Natural Language Triggers</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold space-y-2">
              <button 
                onClick={() => {
                  setActiveTab('chat');
                  handleSend('Show React Developers');
                }} 
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-zinc-850 hover:border-[#f87941]/30 hover:bg-slate-50 dark:hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>🔍 Search React Developers in Surat</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
              </button>

              <button 
                onClick={() => {
                  setActiveTab('chat');
                  handleSend('Average salary benchmarking');
                }} 
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-zinc-850 hover:border-[#f87941]/30 hover:bg-slate-50 dark:hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>📊 Audit salary benchmarking</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
              </button>
            </CardContent>
          </Card>

          {/* Skill Gap Analysis */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
              <CardTitle className="text-md flex items-center gap-1.5"><GraduationCap className="h-5 w-5 text-[#f87941]" /> Skill Gap & Learning recommendations</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs font-semibold space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Core capabilities score</span>
                  <span className="text-emerald-500 font-bold">68% Competence</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[68%]"></div>
                </div>
              </div>

              <div className="p-3.5 border border-dashed rounded-xl bg-slate-50 dark:bg-zinc-900/30 text-[10px] space-y-2">
                <div className="font-bold text-[#f87941] flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Gap Alert: Kubernetes & GraphQL missing
                </div>
                <p className="text-slate-400 leading-relaxed font-semibold">Initiate training module "Modern GraphQL Microservices" next week.</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
