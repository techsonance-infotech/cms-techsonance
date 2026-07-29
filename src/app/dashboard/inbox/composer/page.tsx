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

  const handleGenerateFromPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please specify a prompt instruction for the AI');
      return;
    }
    toast.loading('AI is crafting a contextual draft...', { id: 'ai-prompt-loading' });
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/ai-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: toneFriendly > 70 ? 'Casual' : 'Professional',
          category: activeTemplate.includes('Reminder') ? 'Payment Reminder' : activeTemplate.includes('Roundtable') ? 'Proposal' : 'Cold Outreach',
          recipientName: recipients[0] || 'Client'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSubject(json.data.subject);
        setEmailBody(`<p>${json.data.body.replace(/\n/g, '<br/>')}</p><p><strong>CTA:</strong> ${json.data.cta}</p><p><em>Spam Score check: ${json.data.spamScore}</em></p>`);
        setAiPrompt('');
        toast.success('AI Draft Generated', { id: 'ai-prompt-loading' });
      } else {
        toast.error('Failed to generate AI email', { id: 'ai-prompt-loading' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error generating AI email', { id: 'ai-prompt-loading' });
    }
  };

  const handleSend = () => {
    toast.success('Email dispatched successfully through corporate relay');
    router.push('/dashboard/inbox');
  };

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-background text-foreground border-t border-border">
      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-card overflow-hidden border-r border-border">
        {/* Composer Header / Control Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => router.push('/dashboard/inbox')} 
              className="h-8 w-8 text-muted-foreground rounded-lg hover:bg-accent"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <h2 className="text-base font-bold tracking-tight">New Message</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-accent/30 border border-border rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Template:</span>
              <select 
                value={activeTemplate} 
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer font-semibold py-0.5 text-foreground"
              >
                <option value="Professional Follow-up">Professional Follow-up</option>
                <option value="Invoice Reminder">Invoice Reminder</option>
                <option value="Meeting Invitation">Meeting Invitation</option>
              </select>
            </div>
            
            <Button 
              onClick={handleSend}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all border-none"
            >
              Send
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Recipient Fields */}
        <div className="px-6 py-3 space-y-3 border-b border-border bg-accent/10 shrink-0">
          <div className="grid grid-cols-[60px,1fr] items-center">
            <label className="text-xs font-bold text-muted-foreground uppercase">To</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {recipients.map(name => (
                <div 
                  key={name} 
                  className="bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5 flex items-center gap-1.5 text-xs text-primary font-semibold shadow-sm"
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
                placeholder={recipients.length === 0 ? "Enter recipient name..." : ""}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 p-0 text-xs h-7 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-[60px,1fr] items-center">
            <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 p-0 text-xs h-7 font-semibold text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Rich Text Editor Simulation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="min-h-[300px] text-xs leading-relaxed focus:outline-none text-foreground"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEmailBody(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: emailBody }}
          />
        </div>

        {/* Editor Toolbar (Bottom Sticky) */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Bold className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Italic className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Underline className="h-4 w-4" /></Button>
            <span className="h-4 w-[1px] bg-border mx-1.5" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><List className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><ListOrdered className="h-4 w-4" /></Button>
            <span className="h-4 w-[1px] bg-border mx-1.5" />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><LinkIcon className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><ImageIcon className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground font-semibold">Saved locally at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </main>

      {/* Right AI Sidebar Panel (320px) */}
      <aside className="w-80 bg-card p-6 overflow-y-auto shrink-0 hidden lg:block">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Sales Copilot</h3>
            <p className="text-[10px] text-muted-foreground">Contextual Tone Optimizer</p>
          </div>
        </div>

        {/* Tone Tuning Sliders */}
        <div className="space-y-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Warmth & Friendliness</span>
              <span>{toneFriendly}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={toneFriendly} 
              onChange={(e) => setToneFriendly(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-accent rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Professional Vocabulary</span>
              <span>{toneProfessional}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={toneProfessional} 
              onChange={(e) => setToneProfessional(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-accent rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Urgency & Call-to-action</span>
              <span>{toneUrgent}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={toneUrgent} 
              onChange={(e) => setToneUrgent(Number(e.target.value))}
              className="w-full accent-primary h-1 bg-accent rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <Button 
            onClick={handleImproveTone}
            className="w-full mt-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          >
            Optimize Tone
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* AI Quick Templates */}
        <div className="py-6 space-y-3 border-b border-border">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested AI Templates</h4>
          
          <button className="w-full text-left p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all flex items-start gap-3 shadow-sm group">
            <span className="p-2 bg-primary/10 rounded-xl text-primary"><Clock className="h-4.5 w-4.5" /></span>
            <div>
              <p className="text-xs font-bold group-hover:text-primary transition-colors">Nudge Decision Makers</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Polite reminder for review</p>
            </div>
          </button>

          <button className="w-full text-left p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all flex items-start gap-3 shadow-sm group">
            <span className="p-2 bg-primary/10 rounded-xl text-primary"><Smile className="h-4.5 w-4.5" /></span>
            <div>
              <p className="text-xs font-bold group-hover:text-primary transition-colors">Q4 Project Proposal</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Outline implementation SOW</p>
            </div>
          </button>
        </div>

        {/* Context Warning */}
        <div className="py-6 space-y-4">
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 flex items-start gap-3 shadow-sm">
            <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Contextual Insight</p>
              <p className="text-[10px] text-primary/80 leading-relaxed">
                We detected that Sarah Chen viewed the grand total proposal 3 hours ago. Leverage this timing with an active follow-up prompt.
              </p>
            </div>
          </div>

          {/* AI Custom Prompt Area */}
          <div className="space-y-3 relative">
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask Sales Copilot to write: 'Ask Sarah for a call next Monday morning...'"
              className="w-full bg-accent border border-border rounded-2xl p-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24 placeholder:text-muted-foreground text-foreground"
            />
            <Button 
              size="icon"
              onClick={handleGenerateFromPrompt}
              className="absolute bottom-2.5 right-2.5 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors h-7 w-7 flex items-center justify-center border-none"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
