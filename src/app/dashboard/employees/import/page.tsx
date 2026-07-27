'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, XCircle,
  Loader2, Play, Users, Clipboard, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export default function BulkImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState({ successCount: 0, failedCount: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVContent(text);
    };
    reader.readAsText(file);
  };

  const processCSVContent = (text: string) => {
    try {
      const lines = text.split('\n');
      if (lines.length < 2) {
        toast.error('The selected file appears to be empty or lacks column headers.');
        return;
      }

      // Map raw headers to camelCase fields
      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const mapping: Record<string, string> = {
        'First Name': 'firstName',
        'Last Name': 'lastName',
        'Email': 'email',
        'Employee ID': 'employeeId',
        'Department': 'department',
        'Designation': 'designation',
        'Date of Joining': 'dateOfJoining',
        'Date of Birth': 'dateOfBirth',
        'Salary': 'salary',
        'Employment Type': 'employmentType',
        'CTC': 'ctc'
      };

      const headers = rawHeaders.map(h => mapping[h] || h.replace(/\s+/g, ''));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle basic quoted fields split
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || '';
        });
        rows.push(obj);
      }

      if (rows.length === 0) {
        toast.error('No rows could be parsed from the input content.');
        return;
      }

      setParsedData(rows);
      setStep('preview');
      toast.success(`Parsed ${rows.length} rows successfully!`);
    } catch (err: any) {
      toast.error(`CSV Parsing error: ${err.message}`);
    }
  };

  const handleTextPaste = () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV text first');
      return;
    }
    processCSVContent(csvText);
  };

  const downloadCSVTemplate = () => {
    const headers = "First Name,Last Name,Email,Employee ID,Department,Designation,Date of Joining,Date of Birth,Salary\n";
    const sampleRow = "John,Doe,john.doe@example.com,TS-1002,Engineering,Software Engineer,2026-01-15,1995-08-20,75000\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employee_import_template.csv');
    a.click();
  };

  const validateRow = (row: any) => {
    const errors: string[] = [];
    if (!row.firstName) errors.push('First Name is required');
    if (!row.lastName) errors.push('Last Name is required');
    if (!row.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('Invalid email format');
    }
    if (!row.employeeId) errors.push('Employee ID is required');
    if (!row.department) errors.push('Department is required');
    if (!row.designation) errors.push('Designation is required');
    if (!row.dateOfJoining) errors.push('Date of Joining is required');
    return errors;
  };

  const executeBulkImport = async () => {
    // Client-side block if validations fail
    const hasClientErrors = parsedData.some(row => validateRow(row).length > 0);
    if (hasClientErrors) {
      toast.error('Please fix all formatting and required validation issues before importing.');
      return;
    }

    try {
      setStep('importing');
      const token = getStoredSessionToken();
      const res = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ records: parsedData })
      });

      if (res.ok) {
        const result = await res.json();
        setReports(result.reports || []);
        setImportSummary({
          successCount: result.successCount || 0,
          failedCount: result.failedCount || 0
        });
        setStep('complete');
        toast.success('Bulk employee import process completed.');
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Server error during import');
      }
    } catch (err: any) {
      toast.error(`Import execution failed: ${err.message}`);
      setStep('preview');
    }
  };

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc] max-w-[1600px] mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Upload className="h-8 w-8 text-[#f87941]" />
            Bulk Employee Import Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Import workforce records in batch via CSV template drops or direct clipboard raw values pasting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={downloadCSVTemplate} className="bg-transparent hover:bg-slate-800 text-[#f87941] border border-[#f87941]/30 font-bold flex items-center gap-2 text-xs">
            <Download className="h-4 w-4" /> Download CSV Template
          </Button>
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            Batch SSL Isolation Active
          </Badge>
        </div>
      </div>

      {/* Progress Steps Header Indicators */}
      <div className="flex items-center gap-4 border-b pb-4 border-slate-200 dark:border-zinc-800">
        {['Upload Files', 'Preview Mapping', 'Executing Import', 'Import Logs'].map((s, i) => {
          const isActive = i === ['upload', 'preview', 'importing', 'complete'].indexOf(step);
          const isPast = i < ['upload', 'preview', 'importing', 'complete'].indexOf(step);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 transition-all ${
                isActive ? 'bg-[#f87941] border-[#f87941] text-white' :
                isPast ? 'bg-emerald-500 border-emerald-500 text-white' :
                'border-[#e6e4e6]/50 dark:border-[#2f3035]/50 text-slate-400'
              }`}>
                {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-[#f87941]' : isPast ? 'text-emerald-500' : 'text-slate-400'}`}>
                {s}
              </span>
              {i < 3 && <div className="w-8 h-0.5 bg-[#e6e4e6]/30 dark:bg-[#2f3035]/30" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload / Input */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
              <CardContent className="p-6">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                    dragActive
                      ? 'border-[#f87941] bg-[#f87941]/5'
                      : 'border-[#e6e4e6]/50 dark:border-[#2f3035]/50 hover:border-[#f87941]/50 hover:bg-[#f87941]/5'
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div className="w-14 h-14 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="h-7 w-7 text-[#f87941]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Drop your CSV template file here or click to browse</h3>
                  <p className="text-xs text-slate-500 dark:text-[#b1b1b1]">
                    Importing up to <Badge variant="outline">5000 rows</Badge> in a single transaction sequence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
                <CardTitle className="text-md flex items-center gap-2"><Clipboard className="h-4.5 w-4.5 text-[#f87941]" /> Paste Raw CSV text</CardTitle>
                <CardDescription>Pasting CSV string data direct from spreadsheet tables.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <textarea
                  className="w-full h-36 border rounded-lg p-2.5 bg-transparent text-xs border-input outline-none font-mono"
                  placeholder="First Name,Last Name,Email,Employee ID,Department,Designation,Date of Joining&#10;Alice,Smith,alice@example.com,TS-1002,HR,HR Manager,2026-02-10"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9" onClick={handleTextPaste}>
                  Parse pasted raw CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Preview Mapping */}
      {step === 'preview' && (
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg animate-fadeIn">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-md">Map Workforce Upload Records Preview</CardTitle>
              <CardDescription>Please review the parsed rows and fix highlighting validation issues before executing batch profile insertions.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-xs h-9 font-semibold" onClick={() => setStep('upload')}>Back</Button>
              <Button className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 flex items-center gap-2 text-xs" onClick={executeBulkImport}>
                <Play className="h-3.5 w-3.5" /> Execute Bulk Import
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/30">
                  <th className="p-3">#</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Dept & Title</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3">Validation Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, idx) => {
                  const errors = validateRow(row);
                  return (
                    <tr key={idx} className="border-b hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 border-slate-100 dark:border-zinc-800">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold">{row.firstName || ''} {row.lastName || ''}</td>
                      <td className="p-3 font-mono">{row.email || 'N/A'}</td>
                      <td className="p-3 font-mono font-bold text-slate-500">{row.employeeId || 'N/A'}</td>
                      <td className="p-3">{row.designation || 'Staff'} ({row.department || 'N/A'})</td>
                      <td className="p-3 font-mono">{row.dateOfJoining || 'N/A'}</td>
                      <td className="p-3">
                        {errors.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {errors.map((err, errIdx) => (
                              <Badge key={errIdx} className="bg-rose-500/10 text-rose-500 border-none font-bold uppercase tracking-wider text-[8px] flex items-center gap-1 w-max">
                                <AlertTriangle className="h-2.5 w-2.5" /> {err}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Validated
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing execution progress */}
      {step === 'importing' && (
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg text-center py-20 animate-fadeIn">
          <CardContent className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#f87941] mx-auto" />
            <h3 className="text-xl font-bold">Executing Bulk Import Transaction Pipeline...</h3>
            <p className="text-sm text-slate-500 dark:text-[#b1b1b1]">
              Registering user credentials, mapping legacy reference IDs, and inserting employees into target tables.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import Summary & Reports */}
      {step === 'complete' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-[#1E1F22] border border-slate-100 dark:border-zinc-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-emerald-500">{importSummary.successCount}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-[#b1b1b1]">Successfully Imported Profiles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1E1F22] border border-slate-100 dark:border-zinc-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-rose-500">{importSummary.failedCount}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-[#b1b1b1]">Failed Records Count</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1E1F22] border border-slate-100 dark:border-zinc-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-500">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-500">{importSummary.successCount + importSummary.failedCount}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-[#b1b1b1]">Total Processed Rows</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Table */}
          <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-md">Bulk Import Transaction Execution Logs</CardTitle>
                <CardDescription>Forensic row execution reporting detail.</CardDescription>
              </div>
              <Button onClick={() => setStep('upload')} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                Upload Another File
              </Button>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/30">
                    <th className="p-3">Row #</th>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Result Status</th>
                    <th className="p-3">Logs Message Details</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 border-slate-100 dark:border-zinc-800">
                      <td className="p-3 font-semibold text-slate-400">{r.row}</td>
                      <td className="p-3 font-bold font-mono text-slate-500">{r.employeeId}</td>
                      <td className="p-3 font-mono">{r.email}</td>
                      <td className="p-3">
                        <Badge className={`uppercase font-bold text-[8px] tracking-wide border-none ${r.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className={`p-3 font-semibold ${r.status === 'success' ? 'text-slate-500' : 'text-rose-500 font-bold'}`}>
                        {r.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
