'use client';

import { useState, useEffect, useRef } from 'react';
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
  Smile,
  Loader2
} from 'lucide-react';

export default function CRMComposerPage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);

  // SMTP Settings State
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [useCustomSmtp, setUseCustomSmtp] = useState(false);

  // Recipient details
  const [recipients, setRecipients] = useState<string[]>(['sarah.jenkins@example.com']);
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
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toneLoading, setToneLoading] = useState(false);

  // Load SMTP configurations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('custom_smtp_settings');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setSmtpHost(config.host || '');
        setSmtpPort(String(config.port || '587'));
        setSmtpSecure(!!config.secure);
        setSmtpUser(config.auth?.user || '');
        setSmtpPass(config.auth?.pass || '');
        setUseCustomSmtp(true);
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Keep editor content synchronized with templates or AI generation
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== emailBody) {
      editorRef.current.innerHTML = emailBody;
    }
  }, [emailBody]);

  const handleSaveSmtp = () => {
    if (useCustomSmtp) {
      if (!smtpHost || !smtpUser || !smtpPass) {
        toast.error('SMTP Host, User, and Password are required for custom relay.');
        return;
      }
      const config = {
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      };
      localStorage.setItem('custom_smtp_settings', JSON.stringify(config));
      toast.success('Custom SMTP credentials loaded to local session memory.');
    } else {
      localStorage.removeItem('custom_smtp_settings');
      toast.success('Switched to default corporate relay SMTP settings.');
    }
    setShowSmtpModal(false);
  };

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
      setSubject('Revised Infrastructure Proposal - Skyline Ventures');
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I hope this email finds you well. Following our productive roadmap discussion yesterday afternoon, I have put together a revised proposal outlining our seat licensing and rollout parameters.</p>
<p>We've successfully updated our implementation schedule to start Phase 1 on December 1st, and the technical team is ready. I have attached the updated grand total and product specs below for your review.</p>
<p>Please let me know if these terms align with your procurement guidelines, or if we should schedule a brief alignment call tomorrow morning.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Invoice Reminder') {
      setSubject('Gentle Invoice Reminder: #INV-2026-991');
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I hope you are doing well. This is a gentle reminder that invoice <strong>#INV-2026-991</strong> is scheduled for payment next Tuesday, May 26th.</p>
<p>I've attached a copy of the receipt and billing details for your finance team's records. Let me know if there are any details I can clarify.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Meeting Invitation') {
      setSubject('Invitation: Executive Roadmap Roundtable');
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>I would love to invite you to our upcoming Executive Roadmap Roundtable next Wednesday at 11:00 AM.</p>
<p>We will be discussing our upcoming AI-driven forecasting engines and cloud migration suites. A calendar invitation has been generated for your convenience.</p>
<p>Warmly,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Contract Agreement') {
      setSubject('SOW Agreement: Enterprise CRM Integration');
      setEmailBody(
        `<p>Dear Sarah,</p>
<p>Please find attached the final Statement of Work (SOW) for our enterprise CRM integration project.</p>
<p>Once you review the milestones and service level deliverables, please sign the digital contract envelope to initiate technical setup.</p>
<p>Warm regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Cold Outreach') {
      setSubject('Automate your Lead Pipeline - TechSonance CRM');
      setEmailBody(
        `<p>Hi Sarah,</p>
<p>I noticed your team handles incoming customer requests across multiple channels. Our AI-driven CRM consolidates form, email, and chat inquiries in real-time.</p>
<p>Are you open to a short 10-minute discovery call next Tuesday to see a live simulation?</p>
<p>Cheers,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    } else if (templateName === 'Client Onboarding') {
      setSubject('Welcome to TechSonance CRM Onboarding');
      setEmailBody(
        `<p>Hi Sarah,</p>
<p>Welcome to the onboarding phase! We have initialized your secure tenant workspace under ID: <strong>dc98ef2f-c32a-460f-965b-6d6f209721c7</strong>.</p>
<p>Please log in using the credentials shared below and proceed with cloud database initialization.</p>
<p>Best regards,</p>
<p><strong>Alex Rivera</strong><br/><span style="color: #64748b; font-size: 12px;">Senior Account Manager | Nexus ERP</span></p>`
      );
    }
    toast.success(`${templateName} template loaded.`);
  };

  const handleImproveTone = async () => {
    setToneLoading(true);
    const toastId = toast.loading('AI Sales Copilot is refining email tone...', { id: 'tone-loading' });
    try {
      const token = localStorage.getItem('session_token');
      const currentBody = editorRef.current?.innerHTML || emailBody;
      
      const optimizePrompt = `Optimize and tone-adjust this email. 
Ensure warmth and friendliness density is ${toneFriendly}/100, professional vocabulary is ${toneProfessional}/100, and urgency density is ${toneUrgent}/100.
Original Email Content:
"${currentBody.replace(/<[^>]*>/g, '')}"`;

      const targetRecipient = recipients[0] || newRecipient.trim() || 'Client';
      const res = await fetch('/api/crm/ai-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: optimizePrompt,
          tone: toneFriendly > 70 ? 'Casual' : 'Professional',
          category: 'Tone Adjustment',
          recipientName: targetRecipient
        })
      });

      if (res.ok) {
        const json = await res.json();
        setEmailBody(`<p>${json.data.body.replace(/\n/g, '<br/>')}</p>`);
        toast.success('Email tone successfully optimized by AI!', { id: 'tone-loading' });
      } else {
        toast.error('AI tone optimizer encountered an error.', { id: 'tone-loading' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Network failure connecting to AI Sales Copilot.', { id: 'tone-loading' });
    } finally {
      setToneLoading(false);
    }
  };

  const handleGenerateFromPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please specify a prompt instruction for the AI');
      return;
    }
    setAiLoading(true);
    const toastId = toast.loading('AI is crafting a contextual draft...', { id: 'ai-prompt-loading' });
    try {
      const token = localStorage.getItem('session_token');
      const targetRecipient = recipients[0] || newRecipient.trim() || 'Client';
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
          recipientName: targetRecipient
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSubject(json.data.subject);
        setEmailBody(`<p>${json.data.body.replace(/\n/g, '<br/>')}</p>`);
        setAiPrompt('');
        toast.success('AI Draft successfully generated!', { id: 'ai-prompt-loading' });
      } else {
        toast.error('Failed to generate AI email.', { id: 'ai-prompt-loading' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error generating AI email.', { id: 'ai-prompt-loading' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    let activeRecipients = [...recipients];
    if (activeRecipients.length === 0 && newRecipient.trim()) {
      activeRecipients = [newRecipient.trim()];
      setRecipients(activeRecipients);
      setNewRecipient('');
    }

    if (activeRecipients.length === 0) {
      toast.error('Please specify at least one recipient email address.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = activeRecipients.filter(r => !emailRegex.test(r));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email address format: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      setSending(true);
      const toastId = toast.loading('Dispatching message through SMTP...', { id: 'email-sending' });
      
      let smtpConfig = null;
      if (useCustomSmtp) {
        smtpConfig = {
          host: smtpHost,
          port: Number(smtpPort) || 587,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        };
      }

      const token = localStorage.getItem('session_token');
      const targetEmail = activeRecipients[0];

      const currentBody = editorRef.current?.innerHTML || emailBody;
      const res = await fetch('/api/crm/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: targetEmail,
          subject,
          html: currentBody,
          smtpConfig
        })
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        toast.success(data.message || `Message successfully sent to ${targetEmail}`, { id: 'email-sending' });
        router.push('/dashboard/inbox');
      } else {
        toast.error(data.message || 'SMTP delivery failure. Check configuration.', { id: 'email-sending' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during SMTP delivery.', { id: 'email-sending' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-115px)] overflow-hidden bg-background text-foreground rounded-2xl border border-border">
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
            <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">New Message</h2>
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
                <option value="Contract Agreement">Contract Agreement</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Client Onboarding">Client Onboarding</option>
              </select>
            </div>

            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => setShowSmtpModal(true)} 
              className="h-8 w-8 text-muted-foreground rounded-lg border-border hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleSend}
              disabled={sending}
              className="bg-primary hover:bg-primary/95 text-white px-5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all border-none"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
              {!sending && <Send className="h-3.5 w-3.5" />}
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
                placeholder={recipients.length === 0 ? "recipient@example.com (Press Enter)" : ""}
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
          <div 
            ref={editorRef}
            className="min-h-[300px] text-xs leading-relaxed focus:outline-none text-foreground"
            contentEditable
            suppressContentEditableWarning
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

      {/* Right AI Sidebar Panel */}
      <aside className="w-80 bg-card p-6 overflow-y-auto shrink-0 hidden lg:block border-l border-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
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
            disabled={toneLoading}
            className="w-full mt-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
          >
            {toneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Optimize Tone'}
            {!toneLoading && <ChevronRight className="h-4.5 w-4.5" />}
          </Button>
        </div>

        {/* AI Quick Templates */}
        <div className="py-6 space-y-3 border-b border-border">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested AI Templates</h4>
          
          <button 
            onClick={() => setAiPrompt("Write a polite follow-up reminder to Sarah asking if they had a chance to review our revised infrastructure SOW.")}
            className="w-full text-left p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all flex items-start gap-3 shadow-sm group"
          >
            <span className="p-2 bg-primary/10 rounded-xl text-primary"><Clock className="h-4.5 w-4.5" /></span>
            <div>
              <p className="text-xs font-bold group-hover:text-primary transition-colors">Nudge Decision Makers</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Prompt: Ask Sarah for review</p>
            </div>
          </button>

          <button 
            onClick={() => setAiPrompt("Draft a Q4 enterprise proposal email outlining milestones, Grand SOW budgets, and expected kick-off timelines.")}
            className="w-full text-left p-3.5 rounded-2xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all flex items-start gap-3 shadow-sm group"
          >
            <span className="p-2 bg-primary/10 rounded-xl text-primary"><Smile className="h-4.5 w-4.5" /></span>
            <div>
              <p className="text-xs font-bold group-hover:text-primary transition-colors">Q4 Project Proposal</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Prompt: Outline CRM SOW SOW</p>
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
              placeholder="Ask Sales Copilot: 'Ask Sarah for a call next Monday morning...'"
              className="w-full bg-accent border border-border rounded-2xl p-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24 placeholder:text-muted-foreground text-foreground"
            />
            <Button 
              size="icon"
              onClick={handleGenerateFromPrompt}
              disabled={aiLoading}
              className="absolute bottom-2.5 right-2.5 p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors h-7 w-7 flex items-center justify-center border-none"
            >
              {aiLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* SMTP Configuration Dialog Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-5">
            <button 
              onClick={() => setShowSmtpModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" /> SMTP Relay Configurations
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Customize SMTP relays or switch back to default corporate credentials.</p>
            </div>

            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <input 
                type="checkbox" 
                id="smtpOverride"
                checked={useCustomSmtp} 
                onChange={(e) => setUseCustomSmtp(e.target.checked)}
                className="accent-primary h-3.5 w-3.5 rounded-sm border-gray-300"
              />
              <label htmlFor="smtpOverride" className="text-xs font-bold text-foreground cursor-pointer select-none">
                Enable Custom SMTP Configurations
              </label>
            </div>

            {useCustomSmtp && (
              <div className="space-y-3.5 animate-in slideInFromTop duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP Host Server</label>
                  <Input 
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP Port</label>
                    <Input 
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="bg-accent border-border text-xs rounded-xl h-9"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox" 
                      id="smtpSecure"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="accent-primary h-3.5 w-3.5 rounded-sm border-gray-300"
                    />
                    <label htmlFor="smtpSecure" className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none">
                      SSL/TLS Secure
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP User Email</label>
                  <Input 
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="sales@company.com"
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP Password / Token</label>
                  <Input 
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-3">
              <Button variant="ghost" onClick={() => setShowSmtpModal(false)} className="text-xs font-semibold hover:bg-accent rounded-xl px-4">
                Cancel
              </Button>
              <Button onClick={handleSaveSmtp} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none">
                Save & Load Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
