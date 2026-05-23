'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft,
  DollarSign, 
  Calendar, 
  FileText, 
  Video, 
  Check, 
  MoreVertical, 
  Plus, 
  TrendingUp, 
  User, 
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Briefcase
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'mail' | 'call' | 'doc';
  title: string;
  detail: string;
  time: string;
}

interface Product {
  id: string;
  name: string;
  quantity: string;
  unitPrice: number;
  discount: string;
  total: number;
}

export default function CRMDealDetailPage() {
  const router = useRouter();

  // Deal States
  const [dealTitle, setDealTitle] = useState('Enterprise Expansion');
  const [dealCompany, setDealCompany] = useState('Skyline Ventures');
  const [dealValue, setDealValue] = useState(450000.00);
  const [currentStep, setCurrentStep] = useState(3); // 1-5 (Qualification, Discovery, Proposal, Negotiation, Closed)

  const [activities, setActivities] = useState<Activity[]>([
    { id: '1', type: 'mail', title: 'Email sent to Sarah Chen (CTO)', detail: '"Subject: Revised Infrastructure Proposal - Skyline Ventures. Hi Sarah, following our call yesterday, I\'ve attached the updated..."', time: '2 hours ago' },
    { id: '2', type: 'call', title: 'Outgoing call to Michael Scott (VP Sales)', detail: '12 minute duration. Discussed regional rollout constraints and seat licensing tiers. Michael confirmed they are ready to sign once IT security clears the portal.', time: 'Yesterday' },
    { id: '3', type: 'doc', title: 'Document Modified: Main_Service_Agreement_v3.pdf', detail: 'Contract revisions and seat counts mapped to final pricing parameters.', time: '3 days ago' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Cloud Infrastructure Tier 3', quantity: '12 Months', unitPrice: 25000.00, discount: '10%', total: 270000.00 },
    { id: '2', name: 'Managed Security Services', quantity: '1 Year', unitPrice: 120000.00, discount: '—', total: 120000.00 },
    { id: '3', name: 'Implementation & Training', quantity: '1 Flat Fee', unitPrice: 60000.00, discount: '—', total: 60000.00 }
  ]);

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    const steps = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed'];
    toast.success(`Pipeline shifted to ${steps[stepNumber - 1]} stage`);
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(),
      name: 'Custom Add-on Integration Module',
      quantity: '1 License',
      unitPrice: 15000.00,
      discount: '—',
      total: 15000.00
    };
    setProducts(prev => [...prev, newProduct]);
    setDealValue(prev => prev + 15000.00);
    toast.success('Custom integration module added to contract');
  };

  const handleGenerateQuote = () => {
    toast.loading('Compiling grand total and generating PDF invoice draft...', { id: 'quote-loading' });
    setTimeout(() => {
      toast.success('High-fidelity PDF quote generated and stored in client vault!', { id: 'quote-loading' });
    }, 900);
  };

  const handleScheduleMeeting = () => {
    toast.success('Google Meet invite dispatched to Sarah Chen & Michael Scott');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-900 scrollbar-hide">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span onClick={() => router.push('/dashboard/inbox')} className="cursor-pointer hover:text-indigo-600 transition-colors">CRM</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span onClick={() => router.push('/dashboard/inbox')} className="cursor-pointer hover:text-indigo-600 transition-colors">Deals</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-extrabold">{dealTitle}</span>
      </div>

      {/* Deal Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            {dealCompany}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{dealTitle}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500 font-medium text-xs">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              {dealValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Expected Close: Oct 24, 2024
            </span>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] font-bold">
              High Priority
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleGenerateQuote}
            variant="outline"
            className="border-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-indigo-600" />
            Generate Quote
          </Button>
          <Button 
            onClick={handleScheduleMeeting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <Video className="h-4 w-4" />
            Schedule Meeting
          </Button>
          <Button size="icon" variant="outline" className="h-9 w-9 border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50">
            <MoreVertical className="h-4.5 w-4.5" />
          </Button>
        </div>
      </section>

      {/* Stage Progress Tracker */}
      <section className="bg-slate-100 border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between relative px-8 flex-wrap md:flex-nowrap gap-6 md:gap-0">
          {/* Connector lines */}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-200 -translate-y-1/2 z-0 hidden md:block"></div>
          
          {/* Active Connector Progress */}
          <div 
            className="absolute top-1/2 left-[10%] h-0.5 bg-indigo-600 -translate-y-1/2 z-0 hidden md:block transition-all"
            style={{ width: `${(currentStep - 1) * 20}%` }}
          ></div>

          {/* Steps */}
          {[
            { step: 1, label: 'Qualification' },
            { step: 2, label: 'Discovery' },
            { step: 3, label: 'Proposal' },
            { step: 4, label: 'Negotiation' },
            { step: 5, label: 'Closed' }
          ].map((item) => {
            const isCompleted = item.step < currentStep;
            const isActive = item.step === currentStep;
            return (
              <div 
                key={item.step} 
                onClick={() => handleStepClick(item.step)}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ring-4 ring-slate-100 ${
                  isCompleted 
                    ? 'bg-indigo-600 text-white' 
                    : isActive 
                      ? 'bg-white border-2 border-indigo-600 text-indigo-600 font-extrabold scale-110' 
                      : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                }`}>
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : item.step}
                </div>
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid Bento Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Timeline and Associated Products */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Activity Timeline</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="h-8 border-slate-200 text-[10px] font-bold px-3 py-1 rounded-xl">Filter</Button>
                <Button variant="outline" className="h-8 border-slate-200 text-[10px] font-bold px-3 py-1 rounded-xl">Search</Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {activities.map((a, idx) => (
                <div key={a.id} className="relative pl-8">
                  {idx < activities.length - 1 && (
                    <div className="absolute left-3 top-2 bottom-0 w-px bg-slate-200"></div>
                  )}
                  
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-slate-50 border border-slate-250 flex items-center justify-center shadow-sm">
                    {a.type === 'mail' && <Mail className="h-3 w-3 text-indigo-600" />}
                    {a.type === 'call' && <Phone className="h-3 w-3 text-emerald-600" />}
                    {a.type === 'doc' && <FileText className="h-3 w-3 text-amber-600" />}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800 text-xs">{a.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{a.time}</span>
                    </div>
                    {a.detail && (
                      <p className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 border border-slate-150 p-3 rounded-xl leading-relaxed">
                        {a.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-200 bg-slate-50/50 text-center">
              <Button variant="link" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold">Load older activity</Button>
            </div>
          </div>

          {/* Associated Products Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Products & Services</h2>
              <Button 
                onClick={handleAddProduct}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold p-0 h-auto flex items-center gap-1"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Unit Price</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{product.name}</td>
                      <td className="px-6 py-4">{product.quantity}</td>
                      <td className="px-6 py-4">${product.unitPrice.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {product.discount !== '—' ? (
                          <span className="text-emerald-600 font-bold">{product.discount}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">${product.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-250">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider">Grand Total:</td>
                    <td className="px-6 py-4 text-right font-extrabold text-indigo-600 text-base">
                      ${dealValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Sidebar: Intelligence & Stakeholders */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* AI Probability Score */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="h-16 w-16 text-indigo-600" />
            </div>
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Deal Intelligence</h3>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold text-indigo-600 leading-none">84%</span>
              <div className="pb-1">
                <span className="text-emerald-600 font-bold flex items-center text-xs gap-0.5">
                  <TrendingUp className="h-4 w-4" /> +12%
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Probability to Close</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2.5">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                <span className="text-slate-500 font-semibold">Key Momentum:</span>
                <span className="text-emerald-600 font-bold uppercase text-[10px]">Positive sentiment peak</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                <span className="text-slate-500 font-semibold">Competitive Risk:</span>
                <span className="text-amber-600 font-bold uppercase text-[10px]">Medium alert</span>
              </div>
            </div>
          </div>

          {/* Stakeholder Map */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stakeholder Map</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {[
                { 
                  name: 'Sarah Chen', 
                  role: 'CTO, Skyline Ventures', 
                  badge: 'Decision Maker', 
                  badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXQWAZBVdtJ2CuXtugrAhusbbysmeDkmx30m6CvM7erocn5ezHM_WiYt2kcpTvpqbMi-dFTyh5AE8nesE195KLDkuk_kDkz1DJmqeb-FGKwbJ8X8H1IwSgXRoGEjaqWCQkV0grFxI_dDG2la7FyXbL7F29cUlPI0JXQCrYpizTwMQPkbaIboLnnDjDh7gb0vg2TAQTgwzyaSgs5vUMYgiDBWMmD1gX-WDvkZ0hgkbhTCI4Rol9QH1aOYz-AWwvB54Nzukibvl7jONZ' 
                },
                { 
                  name: 'Michael Scott', 
                  role: 'VP Sales, Skyline Ventures', 
                  badge: 'Champion', 
                  badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-150',
                  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhwo8DReGVznbd_1HCwnAHLy4pPUZacmzMtO3Def6gS3VdsgWHdtaSqwP0q70yTt7yDthupvX1SzUiZ88YWs9AVns3y6RSOk8rA46gJSbgAO_DRxaB60eaWgS-Pws3fufgLdxdQwY9v-R6Jx6hM_hMqDkk60UFyv9KPbxhp8i6BwEyC0-yW5DxAB1lNs1yjqijQq4CbzvhmOtiC7Ew-t5cT8Bb-6jar8UbzzVGhW0FsPCxTG2rjA9LmYSJzUEqbixcyf5m82DSvSRP' 
                },
                { 
                  name: 'David Miller', 
                  role: 'Legal Counsel', 
                  badge: 'Gatekeeper', 
                  badgeColor: 'bg-amber-50 text-amber-700 border-amber-150',
                  avatar: '' 
                }
              ].map((person, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {person.avatar ? (
                    <img 
                      src={person.avatar} 
                      alt={person.name} 
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800">{person.name}</span>
                      <Badge className={`${person.badgeColor} border text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                        {person.badge}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{person.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Competitive Landscape</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                  <span className="text-slate-700">CloudScale Pro</span>
                  <span className="text-red-600 uppercase text-[9px]">Threat: High (85%)</span>
                </div>
                <Progress value={85} className="h-1.5 bg-slate-100 [&>div]:bg-red-500 rounded-full" />
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
                  Sarah mentioned they are offering a 20% discount on implementation fees.
                </p>
              </div>
              
              <div className="h-px bg-slate-100"></div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                  <span className="text-slate-700">Nexus Core (Old Vendor)</span>
                  <span className="text-indigo-500 uppercase text-[9px]">Threat: Low (25%)</span>
                </div>
                <Progress value={25} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600 rounded-full" />
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
                  Client is unhappy with their legacy dashboard performance metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
