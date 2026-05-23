'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Send, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Paperclip, 
  Info, 
  ChevronRight, 
  ArrowLeft,
  Settings,
  HelpCircle,
  Clock,
  ArrowRight,
  Smile
} from 'lucide-react';

export default function CRMComposerPage() {
  const router = useRouter();

  // Recipient details
  const [recipients, setRecipients] = useState<string[]>(['Sarah Jenkins']);
  const [newRecipient, setNewRecipient] = useState('');
  const [subject, setSubject] = useState('Revised Infrastructure Proposal - Skyline Ventures');
  const [emailBody, setEmailBody] = useState(
    `<p>Dear Sarah,</p>
<p>I hope this email finds you well. Following our productive roadmap discussion yesterday afternoon, I have put together a revised proposal outlining our seat licensing and rollout parameters.</p>
<p>We've successfully updated our implementation schedule to start Phase 1 on December 1st, and the technical team is ready. I have attached the updated grand total and product specs below for your review.</p>
<p>Please let me know if these terms align with your procurement guidelines, or if we should schedule a brief alignment call tomorrow morning.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
  );

  const [activeTemplate, setActiveTemplate] = useState('Professional Follow-up');
  const [toneFriendly, setToneFriendly] = useState(50);
  const [toneProfessional, setToneProfessional] = useState(85);
  const [toneUrgent, setToneUrgent] = useState(30);

  const [aiPrompt, setAiPrompt] = useState('');

  const handleRemoveRecipient = (name: string) => {
    setRecipients(prev => prev.filter(r => r !== name));
  };

  const handleAddRecipient = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newRecipient.trim()) {
      setRecipients(prev => [...prev, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setActiveTemplate(templateName);
    
    if (templateName === 'Professional Follow-up') {
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I hope this email finds you well. Following our productive roadmap discussion yesterday afternoon, I have put together a revised proposal outlining our seat licensing and rollout parameters.</p>
<p>We've successfully updated our implementation schedule to start Phase 1 on December 1st, and the technical team is ready. I have attached the updated grand total and product specs below for your review.</p>
<p>Please let me know if these terms align with your procurement guidelines, or if we should schedule a brief alignment call tomorrow morning.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Invoice Reminder') {
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I hope you are doing well. This is a gentle reminder that invoice <strong>#INV-2026-991</strong> is scheduled for payment next Tuesday, May 26th.</p>
<p>I've attached a copy of the receipt and billing details for your finance team's records. Let me know if there are any details I can clarify.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Meeting Invitation') {
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I would love to invite you to our upcoming Executive Roadmap Roundtable next Wednesday at 11:00 AM.</p>
<p>We will be discussing our upcoming AI-driven forecasting engines and cloud migration suites. A calendar invitation has been generated for your convenience.</p>
<p>Warmly,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    }
    toast.success(`${templateName} template loaded`);
  };

  const handleImproveTone = () => {
    toast.loading('AI Assistant is analyzing tone constraints...', { id: 'tone-loading' });
    setTimeout(() => {
      let refined = emailBody;
      if (toneFriendly > 75) {
        refined = refined.replace('Dear Sarah,', 'Hi Sarah! Hope you are having a wonderful week! 😊');
      }
      if (toneUrgent > 60) {
        refined = refined + '<p><em>Note: As discussed, our Q4 implementation slots are filling quickly. Let\'s finalize today to lock in our December 1st date.</em></p>';
      }
      setEmailBody(refined);
      toast.success('Tone updated dynamically based on sliders!', { id: 'tone-loading' });
    }, 800);
  };

  const handleGenerateFromPrompt = () => {
    if (!aiPrompt.trim()) {
      toast.error('Please specify a prompt instruction for the AI');
      return;
    }
    toast.loading('AI is crafting a contextual draft...', { id: 'ai-prompt-loading' });
    setTimeout(() => {
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>Regarding your prompt instruction: <em>"${aiPrompt}"</em>.</p>
<p>I wanted to follow up and confirm we have updated our servers to support the high-density inventory calculations you requested. All items will be completed according to our SLA guarantees.</p>
<p>Looking forward to your thoughts!</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
      setAiPrompt('');
      toast.success('AI Draft Generated', { id: 'ai-prompt-loading' });
    }, 1000);
  };

  const handleSend = () => {
    toast.success('Email dispatched successfully through corporate relay');
    router.push('/dashboard/inbox');
  };

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-slate-50 text-slate-900">
      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200">
        {/* Composer Header / Control Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => router.push('/dashboard/inbox')} 
              className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <h2 className="text-base font-bold tracking-tight text-slate-800">New Message</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Template:</span>
              <select 
                value={activeTemplate} 
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer font-semibold text-slate-700 py-0.5"
              >
                <option value="Professional Follow-up">Professional Follow-up</option>
                <option value="Invoice Reminder">Invoice Reminder</option>
                <option value="Meeting Invitation">Meeting Invitation</option>
              </select>
            </div>
            
            <Button 
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
            >
              Send
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Recipient Fields */}
        <div className="px-6 py-3 space-y-3 border-b border-slate-150 bg-slate-50/50 shrink-0">
          <div className="grid grid-cols-[60px,1fr] items-center">
            <label className="text-xs font-bold text-slate-400 uppercase">To</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {recipients.map(name => (
                <div 
                  key={name} 
                  className="bg-indigo-50 border border-indigo-150 rounded-full px-2.5 py-0.5 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold shadow-sm"
                >
                  <span>{name}</span>
                  <X 
                    onClick={() => handleRemoveRecipient(name)} 
                    className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors" 
                  />
                </div>
              ))}
              <Input 
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={handleAddRecipient}
                placeholder={recipients.length === 0 ? "Add recipient and press Enter..." : "Add CC..."}
                className="bg-transparent border-none focus:ring-0 text-xs flex-1 min-w-[150px] h-7 p-0 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="h-px bg-slate-200/50"></div>
          <div className="grid grid-cols-[60px,1fr] items-center">
            <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line" 
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 placeholder:text-slate-300 h-8 p-0"
            />
          </div>
        </div>

        {/* Rich Text Editor Body */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Formatting tools */}
          <div className="flex items-center gap-1 p-1 border border-slate-200 rounded-xl mb-4 bg-slate-50/50 w-fit shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Bold className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Italic className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Underline className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <List className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg hover:bg-slate-100">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Composition Area */}
          <div className="flex-1 overflow-y-auto">
            <textarea 
              value={emailBody.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n').trim()}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full h-full bg-transparent border-none text-slate-800 text-sm focus:ring-0 focus:outline-none p-2 leading-relaxed resize-none font-sans"
              placeholder="Write your email body here..."
            />
          </div>
        </div>
      </main>

      {/* AI Assistant Sidebar */}
      <aside className="w-80 bg-white flex flex-col p-6 border-l border-slate-200 overflow-y-auto shrink-0 gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-slate-800">AI Assistant Panel</h3>
        </div>

        {/* Tone sliders */}
        <div className="space-y-4 bg-slate-50/50 border border-slate-150 p-4 rounded-2xl">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dynamic Tone Tuning</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                <span>Professional</span>
                <span>{toneProfessional}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={toneProfessional}
                onChange={(e) => setToneProfessional(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                <span>Friendly / Warm</span>
                <span>{toneFriendly}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={toneFriendly}
                onChange={(e) => setToneFriendly(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                <span>Urgency</span>
                <span>{toneUrgent}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={toneUrgent}
                onChange={(e) => setToneUrgent(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <Button 
            onClick={handleImproveTone}
            className="w-full mt-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Apply Tone Optimizations
          </Button>
        </div>

        {/* Action cards */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">AI Operations</h4>
          <button className="w-full text-left p-3.5 rounded-2xl border border-slate-150 bg-white hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer transition-all flex items-start gap-3 shadow-sm group">
            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Clock className="h-4.5 w-4.5" /></span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-slate-800">Summarize Previous Threads</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Extract core alignment outcomes from recent WhatsApp messages.</p>
            </div>
          </button>
          
          <button className="w-full text-left p-3.5 rounded-2xl border border-slate-150 bg-white hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer transition-all flex items-start gap-3 shadow-sm group">
            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Smile className="h-4.5 w-4.5" /></span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-slate-800">Generate Standard Follow-up</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Let AI frame automated schedules and delivery trackers.</p>
            </div>
          </button>
        </div>

        {/* AI Context Card */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3 shadow-sm">
          <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Contextual Insight</p>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Sarah Connor typically responds best to data-driven bullet lists sent before 10 AM. She has a high engagement momentum of <span className="text-emerald-600 font-bold">92%</span>.
            </p>
          </div>
        </div>

        {/* Input prompt area */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="relative">
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask AI to write a paragraph..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 placeholder:text-slate-400"
            />
            <Button 
              onClick={handleGenerateFromPrompt}
              className="absolute bottom-2.5 right-2.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors h-7 w-7 flex items-center justify-center"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
