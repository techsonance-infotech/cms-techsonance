'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';
import {
  Sparkles, CheckCircle2, Circle, Clock, FileSignature, FileText, Upload,
  Send, User, ShieldCheck, HelpCircle, MapPin, Laptop, CreditCard, Check
} from 'lucide-react';

interface PageProps {
  params: Promise<{ employeeId: string }>;
}

export default function CandidatePortalPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.employeeId;
  const [workflow, setWorkflow] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);

  // Forms Draft States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [govtIdType, setGovtIdType] = useState('Passport');
  const [govtIdNo, setGovtIdNo] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  // Signature state
  const [signature, setSignature] = useState('');
  const [policiesChecked, setPoliciesChecked] = useState(false);
  
  // Custom memo chat state
  const [memoText, setMemoText] = useState('');
  const [memos, setMemos] = useState<any[]>([]);

  // Document uploader states
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflowDetails();
  }, [employeeId]);

  const fetchWorkflowDetails = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      
      // Fetch workflow details
      const res = await fetch(`/api/onboarding/workflow?employeeId=${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load candidate portal');
      const data = await res.json();
      setWorkflow(data.workflow);

      // Load draft data if exists
      const draft = data.workflow?.draft_data || {};
      setFirstName(draft.firstName || '');
      setLastName(draft.lastName || '');
      setEmail(draft.email || '');
      setPhone(draft.phone || '');
      setGovtIdType(draft.govtIdType || 'Passport');
      setGovtIdNo(draft.govtIdNo || '');
      setBankAccount(draft.bankAccount || '');
      setBankIfsc(draft.bankIfsc || '');
      setBankName(draft.bankName || '');
      setSignature(draft.signature || '');
      setPoliciesChecked(draft.policiesChecked || false);
      setMemos(draft.memos || []);

      // Fetch employee profile details
      const empRes = await fetch(`/api/employees?id=${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setCandidate(empData);
        if (!draft.firstName) {
          setFirstName(empData.firstName || '');
          setLastName(empData.lastName || '');
          setEmail(empData.email || '');
          setPhone(empData.phone || '');
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification key expired');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (quiet: boolean = false) => {
    if (!workflow) return;
    try {
      setSavingDraft(true);
      const token = getStoredSessionToken();

      const draftPayload = {
        firstName,
        lastName,
        email,
        phone,
        govtIdType,
        govtIdNo,
        bankAccount,
        bankIfsc,
        bankName,
        signature,
        policiesChecked,
        memos
      };

      const res = await fetch('/api/onboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflow.id,
          draftData: draftPayload,
          action: 'SAVE_DRAFT',
          comments: 'Candidate portal draft auto-saved'
        })
      });

      if (res.ok) {
        if (!quiet) toast.success('Progress saved as draft successfully!');
      } else {
        toast.error('Failed to commit draft logs');
      }
    } catch {
      toast.error('Network save error');
    } finally {
      setSavingDraft(false);
    }
  };

  // Upload file simulator inside candidate portal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const mimeType = file.type;
    
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                    fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                    
    const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
    
    if (!isImage && !isPdf && !isDocx) {
      toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.');
      return;
    }
    
    const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > fileLimit) {
      toast.error(`File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`);
      return;
    }

    try {
      setUploadingField(fieldKey);
      const token = getStoredSessionToken();
      const payload = new FormData();
      payload.append('file', file);
      payload.append('kind', 'employee_document');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });

      if (!res.ok) throw new Error('File upload failed');
      const data = await res.json();
      const docUrl = data.data?.url || data.url;

      // Update draft document links
      const currentDraft = workflow?.draft_data || {};
      const updatedDraft = {
        ...currentDraft,
        [fieldKey]: docUrl,
        uploadedAt: new Date().toLocaleDateString()
      };

      // Commit draft
      const workflowRes = await fetch('/api/onboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflow.id,
          draftData: updatedDraft,
          action: 'UPLOAD_DOCUMENT',
          comments: `Uploaded doc: ${fieldKey}`
        })
      });

      if (workflowRes.ok) {
        setWorkflow((prev: any) => ({
          ...prev,
          draft_data: updatedDraft
        }));
        toast.success(`${file.name} uploaded and saved to draft vault!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Document upload error');
    } finally {
      setUploadingField(null);
    }
  };

  const handlePostMemo = () => {
    if (!memoText.trim()) return;
    const nextMemos = [
      ...memos,
      {
        author: 'Candidate',
        text: memoText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      }
    ];
    setMemos(nextMemos);
    setMemoText('');
    
    // Save draft immediately containing the memo
    setTimeout(() => {
      handleSaveDraft(true);
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center items-center gap-2">
        <span className="h-8 w-8 border-4 border-[#f87941] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Booting Candidate Self-Service Dashboard...</p>
      </div>
    );
  }

  const STAGES = [
    'Offer Acceptance',
    'Pre-Onboarding',
    'Document Collection',
    'Background Verification',
    'IT Provisioning',
    'Employee Activation'
  ];

  const currentStageIndex = STAGES.indexOf(workflow?.current_stage || 'Offer Acceptance');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white">
        <div>
          <Badge className="bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/30 font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider mb-2">
            Welcome onboard
          </Badge>
          <h1 className="text-2xl font-black tracking-tight">Onboarding Self-Service Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Hello, {firstName || candidate?.firstName}. Complete your verification tasks to activate your workspace profile.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          <Button
            size="sm"
            onClick={() => handleSaveDraft()}
            disabled={savingDraft}
            className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold flex items-center gap-2 shadow-lg"
          >
            {savingDraft ? <span className="h-3 w-3 border-2 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Save Draft Session
          </Button>
          <span className="text-[10px] text-slate-400 font-medium">Session ID: {workflow?.id || 'Pending'}</span>
        </div>
      </div>

      {/* Visual stage progress tracker */}
      <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
        <CardContent className="pt-6">
          <div className="relative flex justify-between items-center w-full">
            {/* Background line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
            
            {/* Active connection line */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-[#f87941] -translate-y-1/2 z-0 transition-all duration-700" 
              style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
            />

            {STAGES.map((stage, i) => {
              const isCompleted = i < currentStageIndex;
              const isActive = i === currentStageIndex;
              return (
                <div key={stage} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`h-8 w-8 rounded-full border-4 flex items-center justify-center font-bold text-xs transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-[#f87941] border-[#f87941] text-white shadow-md' 
                      : isActive 
                        ? 'bg-white dark:bg-slate-950 border-[#f87941] text-[#f87941] ring-4 ring-[#f87941]/20' 
                        : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 hidden sm:block ${isActive ? 'text-[#f87941]' : 'text-slate-400'}`}>{stage}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Tasks and Details Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Step 1: Personal Profile forms */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/10 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <User className="h-4 w-4 text-[#f87941]" />
                1. General Profile & Bank Accounts Details
              </CardTitle>
              <CardDescription>Verify names, IDs, and financial channels</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. John" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Doe" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">National ID Type</Label>
                  <select value={govtIdType} onChange={e => setGovtIdType(e.target.value)} className="w-full border rounded-lg p-2.5 bg-transparent text-xs mt-1 border-input outline-none">
                    <option value="Passport">Passport</option>
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="PAN Card">PAN Card (Income Tax)</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Personal ID Number</Label>
                  <Input value={govtIdNo} onChange={e => setGovtIdNo(e.target.value)} placeholder="e.g. E1234567" className="mt-1" />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-[#f87941]" /> Bank Remittance Information
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Bank Name</Label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">IFSC Code</Label>
                    <Input value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} placeholder="e.g. HDFC0001234" className="mt-1" />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Bank Account Number</Label>
                    <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="e.g. 5010023456789" className="mt-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Digital offer acceptance letter signature */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/10 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <FileSignature className="h-4 w-4 text-[#f87941]" />
                2. Digital Offer Letter Signature Acceptance
              </CardTitle>
              <CardDescription>Review terms and sign contract agreement</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50 font-serif text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed shadow-inner max-h-36 overflow-y-auto">
                <p className="font-bold border-b pb-1 mb-2 text-slate-800 dark:text-slate-200">OFFER CONTRACT POLICIES & COMPLIANCE</p>
                <p>Upon digital acceptance, the recruit confirms agreement to the 90 days notice period, 3 months probation, remote work/confidentiality handbooks, and intellectual property terms specified on the corporate letterhead agreement.</p>
              </div>

              <div>
                <Label className="text-xs">Type your Full Name to Digital Sign Agreement</Label>
                <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="e.g. John Doe" className="mt-1.5 italic font-serif text-lg tracking-wider" />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Policies acknowledgement checkbox */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/10 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-[#f87941]" />
                3. Corporate Policy & Acceptable Use Acknowledgement
              </CardTitle>
              <CardDescription>Accept default safety and NDA guidelines</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 p-3.5 border rounded-2xl bg-[#f87941]/5 border-[#f87941]/20">
                <input 
                  type="checkbox" 
                  id="chk-policies" 
                  checked={policiesChecked} 
                  onChange={e => setPoliciesChecked(e.target.checked)} 
                  className="mt-1 h-4 w-4 cursor-pointer accent-[#f87941]" 
                />
                <div>
                  <Label htmlFor="chk-policies" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    I acknowledge that I have read and agree to all company policies
                  </Label>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    This includes the Information Security Policy, Code of Conduct, remote work guides, and Data Protection policies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Document Collection & Chat */}
        <div className="space-y-6">
          {/* Document vault upload panel */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/10 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Upload className="h-4 w-4 text-[#f87941]" />
                4. Document Vault Collection
              </CardTitle>
              <CardDescription>Upload PNG, JPG, or PDF proofs</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Doc 1: Photo ID */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Government Photo ID card</span>
                  {workflow?.draft_data?.docPhotoId ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px]">UPLOADED</Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[9px]">PENDING</Badge>
                  )}
                </div>
                <Input type="file" onChange={e => handleFileUpload(e, 'docPhotoId')} disabled={uploadingField !== null} className="text-[10px]" />
              </div>

              {/* Doc 2: Relieving document */}
              <div className="space-y-1.5 border-t pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Relieving & Salary slips</span>
                  {workflow?.draft_data?.docRelieving ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px]">UPLOADED</Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[9px]">PENDING</Badge>
                  )}
                </div>
                <Input type="file" onChange={e => handleFileUpload(e, 'docRelieving')} disabled={uploadingField !== null} className="text-[10px]" />
              </div>

              {/* Doc 3: Cancelled Cheque */}
              <div className="space-y-1.5 border-t pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Cancelled Cheque / Bank proof</span>
                  {workflow?.draft_data?.docBank ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px]">UPLOADED</Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[9px]">PENDING</Badge>
                  )}
                </div>
                <Input type="file" onChange={e => handleFileUpload(e, 'docBank')} disabled={uploadingField !== null} className="text-[10px]" />
              </div>

              {uploadingField && (
                <div className="text-[10px] text-[#f87941] flex items-center gap-1 mt-2 font-semibold">
                  <span className="h-3 w-3 border-2 border-t-transparent border-[#f87941] rounded-full animate-spin" />
                  Uploading and executing OCR extract checks...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help & HR communication console */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/10 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <HelpCircle className="h-4 w-4 text-[#f87941]" />
                HR Communications
              </CardTitle>
              <CardDescription>Log support questions with operations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 max-h-36 overflow-y-auto border-b pb-3">
                {memos.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">No messages logged yet.</p>
                ) : (
                  memos.map((m, index) => (
                    <div key={index} className="text-xs bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border">
                      <div className="flex justify-between font-bold text-[10px] text-slate-400">
                        <span>{m.author}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="mt-1 text-slate-700 dark:text-slate-300 leading-normal">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input value={memoText} onChange={e => setMemoText(e.target.value)} placeholder="Type a message to HR..." className="text-xs bg-transparent" />
                <Button size="icon" onClick={handlePostMemo} className="bg-[#f87941] hover:bg-[#e06634] text-white shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
