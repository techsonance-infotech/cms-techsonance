'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Heart,
  History,
  TrendingUp,
  Video,
  FileText,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  Layers,
  Cloud,
  Send,
  MessageCircle,
  PenTool,
  Bold,
  Italic,
  List,
  Link2,
  Image as ImageIcon,
  AtSign,
  ArrowLeft
} from 'lucide-react';

interface Note {
  id: string;
  author: string;
  role: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

export default function CRMContactProfilePage() {
  const router = useRouter();
  const { id } = useParams();

  // Selected contact details (default is Sarah Jenkins based on design mockup)
  const [contactName, setContactName] = useState('Sarah Jenkins');
  const [contactRole, setContactRole] = useState('VP of Strategic Operations');
  const [contactCompany, setContactCompany] = useState('Global Tech Solutions');
  const [healthScore, setHealthScore] = useState(94);
  const [email, setEmail] = useState('s.jenkins@globaltech.com');
  const [phone, setPhone] = useState('+1 (555) 902-1244');
  const [location, setLocation] = useState('San Francisco, CA');

  // Interactive notes section
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      author: 'Marc Sterling',
      role: 'Account Manager',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9g0QmXe-ewSTf12gjnLzUO3zYD6aD56vl6Ncef9fKKisp2gJg8y26K-sL42-cSPgfQHLCmahHJatxEllzczDNYiRyMAMbqfFeYKW67VIrfahXMwKB07qikINPeY9oVgO7_Izol0ataKh12foBZkr10mJWlipD8lQ3cfCRKS2BLA3rhcqYZJjkdsxGjnolScxQS_Pt0wSgxo9nElBNgke7Em2lFgpOPMWkkqSWnKqrR3KjrRul--gJVqgjTasOpLR4C2fsYwE3EumG',
      text: 'Sarah mentioned they are looking to migrate away from their legacy on-premise system by Q1 2025. We need to prepare a comprehensive ROI sheet comparing Cloud vs On-Prem costs. @Elena can you assist with the infrastructure cost breakdown?',
      time: 'Jun 14, 10:15 AM',
      likes: 3
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  const [activeDeals, setActiveDeals] = useState([
    { id: '1', name: 'Enterprise Migration 2024', status: 'In Negotiation', value: '$124,500.00', progress: 75, closeDate: 'Jul 15, 2024' },
    { id: '2', name: 'API Add-on Integration', status: 'Proposal', value: '$12,000.00', progress: 30, closeDate: 'Aug 02, 2024' }
  ]);

  const [tickets, setTickets] = useState([
    { id: 'TKT-8842', title: 'Login latency issues', priority: 'High', status: 'Open' },
    { id: 'TKT-8711', title: 'API Documentation error', priority: 'Med', status: 'Resolved' },
    { id: 'TKT-8600', title: 'New dashboard request', priority: 'Low', status: 'Closed' }
  ]);

  const handlePostNote = () => {
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: Math.random().toString(),
      author: 'Alex Rivera',
      role: 'Senior Account Manager',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ5NIkGx_9O574nzRodANGOLpK8EMD2JlnBI41NNDBfy7ScYafQvDrcRqB7ADuMWr2z9G2c9dCeIK9inf1TM-Ag6-f3bxwzenD1pNu-1FuI9ChnCRvHUatTu6tzkiQPp1HGseOuR6AqdLSJakOomDuOvZFwImtYTpQeVw3N6KKebggfCQxI2E15BhxSn8Jl2kXL3YDABRma6d267NPh3SnIsU1P-tQ0-iL5LAkGTeb8QKbZxksQ-edPZ_8XLonYjWWRAbkTjWJpV6B',
      text: newNoteText,
      time: 'Just now',
      likes: 0
    };

    setNotes(prev => [newNote, ...prev]);
    setNewNoteText('');
    toast.success('Note saved successfully');
  };

  const handleLikeNote = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, likes: n.likes + 1 } : n));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-900 scrollbar-hide">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span onClick={() => router.push('/dashboard/inbox')} className="cursor-pointer hover:text-indigo-600 transition-colors">CRM</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span onClick={() => router.push('/dashboard/inbox')} className="cursor-pointer hover:text-indigo-600 transition-colors">Contacts</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-extrabold">{contactName}</span>
      </div>

      {/* Profile Header Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-sm">
        {/* Abstract Gradient Background */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/40 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuPNbhbZ5_LkS3mTx0J5VMF6j03B1DDpzSHQMOoP5s65eBjQmwvtodQdJOQZQELTIiAoYtQz7_QgEgCWpxTJ16lib6FIjBu2Ptl2_P-Kftr7G9XJB1oHkqm4Mmy2zCthfYARlyDyvoG3RkjWAlBVyJkQ5R5NjmYriA4iVeryCix6AMCgnx3BOwIJmzhueDYPy-fL5nRRrlfBOOEJm9qTuZQFHdknzdjRhDbuPCiyLshmrL61GcVUlYSUIP-cjjf9Gqbvs4ppbmjOgf" 
                alt={contactName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center shadow" title="Active"></div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">{contactName}</h1>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full px-2.5 py-0.5 font-bold uppercase text-[9px]">
                Key Decision Maker
              </Badge>
            </div>
            
            <p className="text-sm text-slate-500">
              {contactRole} at <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">{contactCompany}</span>
            </p>
            
            <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{location}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button size="icon" variant="outline" className="h-9 w-9 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl">
                <Globe className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl">
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-end gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-right w-full md:w-48 shadow-sm">
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health Score</span>
                <Heart className="h-3.5 w-3.5 fill-emerald-500 stroke-none" />
              </div>
              <div className="text-3xl font-bold text-indigo-600 leading-none">
                {healthScore}<span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Positive Sentiment Peak</p>
            </div>
            
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]">
              <PenTool className="h-4 w-4" />
              Update Profile Details
            </Button>
          </div>
        </div>
      </section>

      {/* 360 Degree View Bento Grid */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        
        {/* Interaction History (7 Columns) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-[400px] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold tracking-tight text-slate-800">Interaction History</h3>
            </div>
            <Button variant="link" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold p-0 h-auto">View All</Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
            {/* Timeline Item */}
            <div className="flex gap-4 relative">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 z-10">
                  <Video className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 w-0.5 bg-slate-200 my-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Product Roadmap Review</span>
                  <span className="text-[10px] text-slate-400">Today, 2:45 PM</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Discussed Q3 expansion modules. Sarah expressed high interest in the AI-driven forecasting tool.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Badge variant="secondary" className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-bold py-0.5 px-2 rounded-full">
                    Meeting
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-150 text-[9px] font-bold py-0.5 px-2 rounded-full">
                    Recording Available
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timeline Item */}
            <div className="flex gap-4 relative">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 z-10">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 w-0.5 bg-slate-200 my-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Contract Proposal Sent</span>
                  <span className="text-[10px] text-slate-400">Yesterday</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sent revised pricing for 500 seat license. Awaiting procurement feedback.
                </p>
              </div>
            </div>

            {/* Timeline Item */}
            <div className="flex gap-4 relative">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 z-10">
                  <Phone className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Follow-up Call</span>
                  <span className="text-[10px] text-slate-400">Jun 12, 2024</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Quick check-in regarding integration issues. Solved on call.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Deals (5 Columns) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-[400px] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold tracking-tight text-slate-800">Active Deals</h3>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {activeDeals.map(deal => (
              <div 
                key={deal.id}
                onClick={() => router.push('/dashboard/inbox/deal/skyline-ventures')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/10 cursor-pointer transition-all shadow-sm group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate w-32">
                    {deal.name}
                  </h4>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-250/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {deal.status}
                  </Badge>
                </div>
                <div className="text-base font-bold text-slate-800">{deal.value}</div>
                <div className="flex items-center gap-2 mt-3">
                  <Progress value={deal.progress} className="h-1 flex-1 bg-slate-200 [&>div]:bg-indigo-600 rounded-full" />
                  <span className="text-[9px] text-slate-400 font-bold shrink-0">{deal.progress}%</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-semibold">Expected Close: {deal.closeDate}</p>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-xs flex items-center justify-center gap-2 py-2 mt-4 hover:bg-slate-50">
            <Plus className="h-4 w-4" />
            Create New Deal
          </Button>
        </div>

        {/* Support Tickets (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold tracking-tight text-slate-800">Support Tickets</h3>
            </div>
            
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-2 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate w-36">{ticket.title}</p>
                    <span className="text-[9px] text-slate-400 font-bold">{ticket.id} • {ticket.priority}</span>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    ticket.status === 'Open' 
                      ? 'bg-red-50 text-red-700 border border-red-150' 
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase History (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold tracking-tight text-slate-800">Purchase History</h3>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">Standard ERP Subscription</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Annual Billing • Oct 2023</p>
                </div>
                <span className="font-extrabold text-xs text-slate-800">$48,000</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                  <Cloud className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">Extra Cloud Storage (5TB)</p>
                  <p className="text-[9px] text-slate-400 font-semibold">One-time • Jan 2024</p>
                </div>
                <span className="font-extrabold text-xs text-slate-800">$2,400</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-150 flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">LTV Total</span>
            <span className="text-base font-extrabold text-indigo-600">$152,900.00</span>
          </div>
        </div>

        {/* AI Sentiment Insights (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 bg-indigo-600 text-white rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between h-48 lg:h-auto">
          <div className="absolute -top-4 -right-4 opacity-10">
            <MessageCircle className="h-32 w-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4.5 w-4.5" />
              <h3 className="text-xs font-bold tracking-wider uppercase">AI Relationship Insight</h3>
            </div>
            <p className="text-[11px] leading-relaxed italic opacity-90">
              "Sarah shows high receptivity to AI product updates. Frequency of interaction has increased by 40% this month. Recommend scheduling a VIP dinner at the upcoming TechSummit."
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2.5 mt-4">
            <div className="flex -space-x-1.5">
              <div className="w-5 h-5 rounded-full border border-indigo-600 bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">S</div>
              <div className="w-5 h-5 rounded-full border border-indigo-600 bg-amber-500 flex items-center justify-center text-[8px] font-bold text-white">M</div>
              <div className="w-5 h-5 rounded-full border border-indigo-600 bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">E</div>
            </div>
            <span className="text-[9px] font-medium opacity-80">Positive sentiment across 3 active channels</span>
          </div>
        </div>
      </div>

      {/* Internal Team Collaboration Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold tracking-tight text-slate-800">Team Collaboration Notes</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwp1nbkvOy72948aJIZrBsuay1BiV5zvEXrY6-DeUQDoJmzzMpyyvP-_fF8pa7yduEcihCnOREPSTSI0kY4GUcZCcvoBKZcDMyYcJ9P8Mqp9ucuFkGDWVzvW8y380ZLUnWDMvOt9bknqknkGsKwGuBMJZqeKjbdCkVCR1y8f2ekXr0d19yNhHj-Ue5zGYEjuW_3MKWdcZNHxon09xZ2lmYiyJnn21LqcP1yiOb3QFkvvCLBs0wetpWo7MENMw7QruNkVltYH-pcyuP" 
                alt="Marc" 
                className="h-7 w-7 rounded-full border-2 border-white"
              />
              <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+2</div>
            </div>
            <span className="text-[10px] text-slate-400 italic font-semibold">Last edited 2h ago</span>
          </div>
        </div>

        {/* Note Composer */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600 transition-all shadow-sm mb-6">
          <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><Bold className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><Italic className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><List className="h-4 w-4" /></Button>
            <div className="w-px h-5 bg-slate-200 mx-1 align-middle self-center"></div>
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><Link2 className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><ImageIcon className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7.5 w-7.5 text-slate-400 hover:text-slate-600 rounded-lg"><AtSign className="h-4 w-4" /></Button>
          </div>
          <textarea 
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="w-full h-28 p-4 border-none focus:ring-0 text-sm focus:outline-none resize-none placeholder:text-slate-400 font-sans"
            placeholder="Tag a team member with @ to collaborate on growth strategies..."
          />
          <div className="bg-slate-50/50 p-2.5 flex justify-end gap-2 border-t border-slate-100">
            <Button 
              onClick={handlePostNote}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
            >
              Save Collaboration Note
            </Button>
          </div>
        </div>

        {/* Note feeds */}
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="flex gap-4">
              <img 
                src={note.avatar} 
                alt={note.author} 
                className="h-10 w-10 rounded-xl object-cover border border-slate-150 shadow-sm shrink-0"
              />
              <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    {note.author} <span className="text-[10px] font-normal text-slate-400">• {note.role}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{note.time}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{note.text}</p>
                <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-400">
                  <button 
                    onClick={() => handleLikeNote(note.id)}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    <Heart className="h-3.5 w-3.5 fill-slate-400 stroke-none hover:fill-indigo-600" />
                    <span>{note.likes}</span>
                  </button>
                  <button className="hover:text-indigo-600 transition-colors">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
