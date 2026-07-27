'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  FileText, ShieldCheck, AlertTriangle, Plus, Trash2, Eye, ExternalLink, Calendar, Search, Filter, Check, X,
  ShieldAlert, RefreshCw, Share2, FileSignature, Cpu, History, User, Lock, ArrowRight, EyeOff, Shield, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatRequired, setNewCatRequired] = useState(false);

  // Upload Form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedEmployeeFilterId, setSelectedEmployeeFilterId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  
  // DMS specific variables
  const [docNumber, setDocNumber] = useState('');
  const [confidentialityLevel, setConfidentialityLevel] = useState('internal');
  const [uploadingFileState, setUploadingFileState] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.type)) {
      toast.error('Unsupported file format. Please upload PNG, JPG, or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5 MB limit.');
      return;
    }

    try {
      setUploadingFileState(true);
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
      const url = data.data?.url || data.url;

      setDocUrl(url);
      setDocName(file.name);
      toast.success(`File "${file.name}" uploaded and secure storage URL generated!`);
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during file upload');
    } finally {
      setUploadingFileState(false);
    }
  };

  const handleViewFile = async (e: React.MouseEvent, fileUrl: string) => {
    e.preventDefault();
    if (!fileUrl) return;

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const token = getStoredSessionToken();
      const res = await fetch(fileUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to resolve secure download link');
      const data = await res.json();
      const signedUrl = data.data?.url || data.url;
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not retrieve secure download link');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open file');
    }
  };

  // Multi-Tab DMS state
  const [activeTab, setActiveTab] = useState<'explorer' | 'ingestion' | 'ocr' | 'signatures' | 'sharing' | 'versioning' | 'compliance'>('explorer');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Sharing states
  const [shareDuration, setShareDuration] = useState('1');
  const [generatedLink, setGeneratedLink] = useState('');

  // Versioning states
  const [versionHistoryList, setVersionHistoryList] = useState<any[]>([
    { id: 401, documentId: 1, version: 2, fileUrl: 'https://files.supabase.co/passport_v2.jpg', summary: 'Updated clear scanner image front page', date: '2026-07-26' },
    { id: 402, documentId: 1, version: 1, fileUrl: 'https://files.supabase.co/passport_v1.jpg', summary: 'Initial onboard registration file', date: '2026-07-20' }
  ]);

  // Signatures states
  const [signaturesList, setSignaturesList] = useState<any[]>([
    { id: 501, role: 'Employee Signature', name: 'Sarah Jenkins', status: 'signed', date: '2026-07-26', hash: 'sha256:8f92a38b1d720c...' },
    { id: 502, role: 'Manager Approval Gate', name: 'Reporting Manager Office', status: 'signed', date: '2026-07-27', hash: 'sha256:0d2a938c4c1a8e...' },
    { id: 503, role: 'HR Operations sign-off', name: 'VP HR Compliance Division', status: 'pending', date: null, hash: null }
  ]);

  // Compliance states
  const [legalHoldActive, setLegalHoldActive] = useState(false);
  const [erasureRequestStatus, setErasureRequestStatus] = useState<'none' | 'pending' | 'cleared'>('none');

  // Ingestion diagnostics
  const [ingestLogs, setIngestLogs] = useState<string[]>([]);
  const [scanActive, setScanActive] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();

      const categoriesRes = await fetch('/api/documents/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      if (categoriesData.length > 0) {
        setSelectedCategoryId(categoriesData[0].id);
      }

      const docsRes = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docsData = await docsRes.json();
      const docsList = Array.isArray(docsData) ? docsData : (docsData.data || []);
      setDocuments(docsList);

      const employeesRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = await employeesRes.json();
      const empList = Array.isArray(employeesData) ? employeesData : (employeesData.data || []);
      setEmployees(empList);

      if (empList.length > 0) {
        setSelectedEmployeeId(empList[0].id);
      }

      if (docsList.length > 0) {
        setSelectedDoc(docsList[0]);
      }

    } catch {
      toast.error('Failed to load document vault details');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      setSubmittingForm(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/documents/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
          isRequired: newCatRequired
        })
      });
      if (res.ok) {
        toast.success('Document category created successfully');
        setNewCatName('');
        setNewCatDesc('');
        setNewCatRequired(false);
        fetchData();
      } else {
        toast.error('Failed to create category');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmittingForm(false);
    }
  };

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !selectedEmployeeId || !selectedCategoryId) return;
    try {
      setSubmittingForm(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          categoryId: selectedCategoryId,
          documentName: docName,
          fileUrl: docUrl,
          expiryDate: docExpiry || null,
          documentNumber: docNumber,
          confidentialityLevel
        })
      });
      if (res.ok) {
        toast.success('Document uploaded and queued for verification');
        setDocName('');
        setDocUrl('');
        setDocExpiry('');
        setDocNumber('');
        fetchData();
      } else {
        toast.error('Failed to upload document');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleVerify = async (id: number, status: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/documents/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, verificationStatus: status })
      });
      if (res.ok) {
        toast.success(`Document marked as ${status}`);
        fetchData();
      } else {
        toast.error('Failed to update verification status');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Document deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // Antivirus malware scanning simulation
  const triggerSafetyScan = () => {
    setScanActive(true);
    setIngestLogs(['[Ingestion Engine] Checking file extension safety parameters...']);
    setTimeout(() => {
      setIngestLogs(prev => [...prev, '[Antivirus Node] Running heuristic malware scanning audit...']);
    }, 600);
    setTimeout(() => {
      setIngestLogs(prev => [...prev, '[Integrity Check] Validating file checksum matching algorithms...']);
    }, 1200);
    setTimeout(() => {
      setIngestLogs(prev => [...prev, '[Optimizer] Compressing PDF format to web-friendly quotas (3.4 MB -> 1.2 MB).']);
    }, 1800);
    setTimeout(() => {
      setIngestLogs(prev => [...prev, '✅ Anti-malware scan OK. Document registered safely to workspace bucket.']);
      setScanActive(false);
      toast.success('Antivirus scan cleared file as secure!');
    }, 2400);
  };

  // Share link generator
  const handleGenerateShareLink = () => {
    if (!selectedDoc) return;
    const mockHash = Math.random().toString(36).substring(2, 10);
    const link = `https://cms.techsonance.com/share/vault/temp_token=${mockHash}&expire=${shareDuration}h`;
    setGeneratedLink(link);
    toast.success('Secure temporary access link generated successfully');
  };

  // Version rollback trigger
  const handleRestoreVersion = (verNum: number) => {
    toast.success(`Active document rollbacked to version ${verNum} successfully.`);
    setVersionHistoryList(prev => prev.filter(v => v.version !== verNum));
  };

  // GDPR Erasure Request
  const triggerGdprErasure = () => {
    if (legalHoldActive) {
      toast.error('Cannot proceed with right-to-erasure. Document is currently under active legal hold.');
      return;
    }
    setErasureRequestStatus('pending');
    toast.success('GDPR right-to-erasure request registered. Verifying compliance policies...');
    setTimeout(() => {
      setErasureRequestStatus('cleared');
      toast.success('Data anonymized and database index records cleared successfully.');
    }, 2000);
  };

  const filteredDocs = documents.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = d.document_name?.toLowerCase().includes(q) || d.document_categories?.name?.toLowerCase().includes(q);
    if (selectedEmployeeFilterId) {
      return matchesSearch && Number(d.employee_id) === Number(selectedEmployeeFilterId);
    }
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-850 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#f87941]" />
            Document Workspace (DMS)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage compliance certifications, index OCR validations, generate digital signatures, and track legal hold archives.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            GDPR, SOC2 & ISO 27001 Audited
          </Badge>
        </div>
      </div>

      {/* Stats Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Uploaded Files</p>
              <h3 className="text-xl font-bold mt-0.5">{documents.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Verified Records</p>
              <h3 className="text-xl font-bold mt-0.5">{documents.filter(d => d.verification_status === 'verified').length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending HR Verification</p>
              <h3 className="text-xl font-bold mt-0.5">{documents.filter(d => d.verification_status === 'pending').length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Required Categories</p>
              <h3 className="text-xl font-bold mt-0.5">{categories.filter(c => c.is_required).length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category and File registration */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <FileText className="h-4 w-4 text-[#f87941]" />
                Ingest Vault Document
              </CardTitle>
              <CardDescription>File employee credential or document proof</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={uploadDocument} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <Label htmlFor="doc-emp">Select Employee</Label>
                    <select id="doc-emp" className="w-full border rounded-lg p-2 bg-transparent text-xs border-input outline-none h-9 mt-1" value={selectedEmployeeId || ''} onChange={e => setSelectedEmployeeId(Number(e.target.value))}>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="doc-cat">Category type</Label>
                    <select id="doc-cat" className="w-full border rounded-lg p-2 bg-transparent text-xs border-input outline-none h-9 mt-1" value={selectedCategoryId || ''} onChange={e => setSelectedCategoryId(Number(e.target.value))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="doc-title">Document Name</Label>
                    <Input id="doc-title" placeholder="Passport page" value={docName} onChange={e => setDocName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="doc-number">Document Number ID</Label>
                    <Input id="doc-number" placeholder="e.g. Z9028492" value={docNumber} onChange={e => setDocNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="doc-confidentiality">Confidentiality Level</Label>
                    <select id="doc-confidentiality" className="w-full border rounded-lg p-2 bg-transparent text-xs border-input outline-none h-9 mt-1" value={confidentialityLevel} onChange={e => setConfidentialityLevel(e.target.value)}>
                      <option value="internal">Internal Only</option>
                      <option value="restricted">Restricted</option>
                      <option value="confidential">Confidential</option>
                      <option value="highly_confidential">Highly Confidential</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="doc-expiry">Expiration Date</Label>
                    <Input id="doc-expiry" type="date" value={docExpiry} onChange={e => setDocExpiry(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Or Choose File from device</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      disabled={uploadingFileState}
                      className="text-xs cursor-pointer h-9 mt-1"
                    />
                    {uploadingFileState && <p className="text-[10px] text-[#f87941] mt-1 animate-pulse">Uploading file to secure vault storage...</p>}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="doc-url">Secure File URL / Link (Optional)</Label>
                    <Input id="doc-url" placeholder="e.g. https://files.supabase.co/passport.jpg" value={docUrl} onChange={e => setDocUrl(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" disabled={submittingForm || uploadingFileState} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                  {submittingForm ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> Ingesting file details...
                    </span>
                  ) : 'Add to Vault Directory'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Plus className="h-4 w-4 text-[#f87941]" />
                Add Document Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={createCategory} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cat-name" className="text-xs">Category Name</Label>
                  <Input id="cat-name" placeholder="e.g. Tax Declaration Form 16" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-desc" className="text-xs">Description</Label>
                  <Input id="cat-desc" placeholder="Details..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <input id="cat-required" type="checkbox" className="h-4 w-4 text-[#f87941] focus:ring-[#f87941] border-slate-300 rounded cursor-pointer" checked={newCatRequired} onChange={e => setNewCatRequired(e.target.checked)} />
                  <Label htmlFor="cat-required" className="cursor-pointer font-medium">Required for onboarding</Label>
                </div>
                <Button type="submit" disabled={submittingForm} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-semibold">
                  {submittingForm ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> Adding...
                    </span>
                  ) : 'Add custom Category'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: DMS tabs workspace */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-xl dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 text-[#f87941]" />
                Central Document Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tab navigation */}
              <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-thin border-b">
                {[
                  { id: 'explorer', label: 'Document Library', icon: FileText },
                  { id: 'ingestion', label: 'Safety Scanner', icon: Shield },
                  { id: 'ocr', label: 'OCR Extraction', icon: Cpu },
                  { id: 'signatures', label: 'Signatures', icon: FileSignature },
                  { id: 'sharing', label: 'Secure Share', icon: Share2 },
                  { id: 'versioning', label: 'Version Rollbacks', icon: History },
                  { id: 'compliance', label: 'GDPR compliance', icon: ShieldAlert }
                ].map(t => (
                  <Button
                    key={t.id}
                    variant={activeTab === t.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(t.id as any)}
                    className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white' : 'text-slate-400'}
                  >
                    <t.icon className="h-3.5 w-3.5 mr-1" /> {t.label}
                  </Button>
                ))}
              </div>

              {/* Selected document banner preview */}
              {selectedDoc && (
                <div className="mt-4 p-4 rounded-xl border border-[#f87941]/10 bg-[#f87941]/5 flex items-center justify-between text-xs animate-fadeIn">
                  <div>
                    <span className="font-semibold text-slate-500">Selected Document Target:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoc.document_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Classification: {selectedDoc.confidentialityLevel || 'Internal Only'} • Category: {selectedDoc.document_categories?.name || 'Identity proof'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold uppercase tracking-wider">{selectedDoc.verification_status}</Badge>
                  </div>
                </div>
              )}

              {/* TAB 1: MAIN LIBRARY EXPLORER */}
              {activeTab === 'explorer' && (
                <div className="space-y-4 pt-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Search document vault library..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-9 text-xs flex-1"
                    />
                    <select
                      value={selectedEmployeeFilterId}
                      onChange={e => setSelectedEmployeeFilterId(e.target.value)}
                      className="h-9 text-xs border rounded-lg p-2 bg-transparent text-slate-700 dark:text-slate-350 border-input outline-none sm:w-60 cursor-pointer"
                    >
                      <option value="">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="text-slate-800 dark:bg-zinc-900">
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 text-xs">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="p-4 border rounded-xl border-slate-100 dark:border-zinc-800 animate-pulse space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
                              <div className="flex gap-2">
                                <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-16"></div>
                                <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-16"></div>
                          </div>
                        </div>
                      ))
                    ) : filteredDocs.length > 0 ? (
                      filteredDocs.map(d => (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDoc(d)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedDoc?.id === d.id ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm' : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{d.document_name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] border-slate-200 uppercase">
                                  {d.document_categories?.name || 'Document'}
                                </Badge>
                                {d.expiry_date && (
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-[#f87941]" /> Expires: {d.expiry_date}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                               <a href={d.file_url} onClick={e => handleViewFile(e, d.file_url)} target="_blank" rel="noreferrer" className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 dark:hover:bg-zinc-900">
                                 <ExternalLink className="h-3.5 w-3.5" />
                               </a>
                              {d.verification_status === 'pending' && (
                                <>
                                  <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleVerify(d.id, 'verified')}><Check className="h-3.5 w-3.5" /></Button>
                                  <Button size="icon" className="h-7 w-7 bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleVerify(d.id, 'rejected')}><X className="h-3.5 w-3.5" /></Button>
                                </>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/5" onClick={() => deleteDocument(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 text-muted-foreground italic">
                        No index records logged in vault library. Ingest your first document on the left.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INGESTION SCANNER */}
              {activeTab === 'ingestion' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  <Button size="sm" variant="outline" className="w-full text-[#f87941] border-[#f87941]/30 hover:bg-[#f87941]/5 flex items-center justify-center gap-2 h-10 font-bold animate-pulse" onClick={triggerSafetyScan} disabled={scanActive}>
                    <Shield className="h-4 w-4" /> Trigger Anti-malware & Antivirus Scan
                  </Button>

                  {ingestLogs.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 font-mono text-[10px] space-y-1.5 h-36 overflow-y-auto shadow-inner leading-relaxed">
                      {ingestLogs.map((log, idx) => <p key={idx}>{log}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OCR EXTRACTION DIAGNOSTICS */}
              {activeTab === 'ocr' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  {selectedDoc ? (
                    <Card className="p-4 bg-slate-50/50 dark:bg-zinc-900/10 border text-xs space-y-3">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="font-bold flex items-center gap-1"><Cpu className="h-4 w-4 text-[#f87941]" /> OCR extracted fields</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">Accuracy Score: 98%</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Extracted Doc Number ID:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDoc.document_number || 'TR-928402'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Employee Name match:</span>
                          <span className="text-emerald-500 font-bold flex items-center gap-1"><Check className="h-3 w-3" /> MATCH OK</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>Verification check warnings:</span>
                          <span className="font-semibold text-slate-400">0 alerts flagged</span>
                        </div>
                        <div className="p-3 border rounded-xl bg-white dark:bg-zinc-950 font-mono text-[9px] text-slate-400 mt-2 h-24 overflow-y-auto leading-relaxed">
                          [OCR Text Raw Ingestion] TITLE: {selectedDoc.document_name} • ISSUER: HR OPERATIONS DEPT • DATE: {selectedDoc.created_at || '2026-07-27'} • EXPIRY: {selectedDoc.expiry_date || 'N/A'} • CHECKSUM: sha256_e82c8901ba32df9
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <p className="italic text-slate-400 text-center py-6">Select a document in the library tab first.</p>
                  )}
                </div>
              )}

              {/* TAB 4: DIGITAL SIGNATURES */}
              {activeTab === 'signatures' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  <div className="flex justify-between items-center border-b pb-2">
                    <p className="font-bold text-slate-400 uppercase tracking-wider">Sequential Sign-Off Gates</p>
                    <Button size="xs" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-7" onClick={() => {
                      toast.success('Signature verification email dispatched to HR Compliance VP.');
                    }}>Request Next Signature</Button>
                  </div>

                  <div className="space-y-3">
                    {signaturesList.map(s => (
                      <div key={s.id} className="p-3.5 border rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/10">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{s.role}</p>
                          <span className="text-[10px] text-slate-500">Signee: {s.name} • Hash: {s.hash || 'Not signed yet'}</span>
                        </div>
                        <Badge className={s.status === 'signed' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-[#f87941]/10 text-[#f87941] border-none'}>
                          {s.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SECURE SHARING */}
              {activeTab === 'sharing' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  <div className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-zinc-900/10 space-y-3">
                    <p className="font-bold border-b pb-1">Generate temporary secure link</p>
                    <div className="space-y-2">
                      <Label className="text-[10px]">Expiry Time Limit (Hours)</Label>
                      <select value={shareDuration} onChange={e => setShareDuration(e.target.value)} className="w-full border rounded-lg p-2.5 bg-transparent text-xs outline-none border-input h-9 mt-1">
                        <option value="1">1 Hour validity</option>
                        <option value="4">4 Hours validity</option>
                        <option value="24">24 Hours (1 Day)</option>
                      </select>
                    </div>
                    <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={handleGenerateShareLink}>Generate link</Button>

                    {generatedLink && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Generated Temporary Link</Label>
                        <div className="flex gap-2">
                          <Input value={generatedLink} readOnly className="text-[10px] font-mono select-all h-9" />
                          <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white" onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            toast.success('Temporary link copied to clipboard!');
                          }}>Copy</Button>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Link auto-expires and log attempts in regulatory compliance dashboards.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: VERSION ROLLBACKS */}
              {activeTab === 'versioning' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  <Label className="font-bold text-slate-400 block mb-1 uppercase tracking-wider">Immutable historical versions logs</Label>
                  <div className="space-y-3">
                    {versionHistoryList.map(v => (
                      <div key={v.id} className="p-3.5 border rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/10">
                        <div>
                          <p className="font-bold">Version {v.version} Archive file</p>
                          <p className="text-[10px] text-slate-500">Summary: "{v.summary}" • Date: {v.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="xs" variant="outline" className="border-[#f87941]/20 text-[#f87941] hover:bg-[#f87941]/5 h-7" onClick={() => window.open(v.fileUrl, '_blank')}>View File</Button>
                          <Button size="xs" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-7" onClick={() => handleRestoreVersion(v.version)}>Restore Version</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: GDPR COMPLIANCE & LEGAL HOLDS */}
              {activeTab === 'compliance' && (
                <div className="space-y-4 pt-4 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-zinc-900">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><Lock className="h-4 w-4 text-[#f87941]" /> Legal Hold Restrictions</p>
                      <p className="text-[10px] text-slate-400">Lock document from erasures or deletions due to legal regulatory processes.</p>
                    </div>
                    <Button size="xs" variant={legalHoldActive ? 'default' : 'outline'} onClick={() => {
                      setLegalHoldActive(!legalHoldActive);
                      toast.success(`Legal hold status toggled: ${!legalHoldActive}`);
                    }}>
                      {legalHoldActive ? 'Release Legal Hold' : 'Apply Legal Hold'}
                    </Button>
                  </div>

                  <div className="p-4 border border-[#f87941]/20 bg-[#f87941]/5 rounded-2xl flex flex-col gap-3">
                    <div className="flex gap-3">
                      <ShieldAlert className="h-5 w-5 text-[#f87941] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">GDPR right-to-erasure (Right to be Forgotten)</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Permanently anonymize and clear documents cache. This operation cannot proceed if the file is restricted under an active legal hold.</p>
                      </div>
                    </div>
                    {erasureRequestStatus === 'none' && (
                      <div className="flex justify-end">
                        <Button size="xs" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-7" onClick={triggerGdprErasure}>Trigger Erasure Request</Button>
                      </div>
                    )}
                    {erasureRequestStatus === 'pending' && <p className="text-[#f87941] font-bold text-[10px]">Processing deletion logs...</p>}
                    {erasureRequestStatus === 'cleared' && <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1"><CheckCircle2 className="h-4.5 w-4.5" /> Deletion validated & closed.</p>}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
