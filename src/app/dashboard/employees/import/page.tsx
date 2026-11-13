'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, XCircle,
  Loader2, Play, Users, Clipboard, AlertTriangle, ShieldCheck,
  CreditCard, Landmark, PhoneCall, Building2, Calendar
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
      // Split lines respecting both CRLF and LF
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error('The selected file appears to be empty or lacks column headers.');
        return;
      }

      // Comprehensive mapping from popular spreadsheet header names to internal keys
      const mapping: Record<string, string> = {
        'first name': 'firstName',
        'firstname': 'firstName',
        'last name': 'lastName',
        'lastname': 'lastName',
        'email': 'email',
        'email address': 'email',
        'phone': 'phone',
        'phone number': 'phone',
        'mobile': 'phone',
        'contact number': 'phone',
        'employee id': 'employeeId',
        'employeeid': 'employeeId',
        'emp id': 'employeeId',
        'department': 'department',
        'dept': 'department',
        'designation': 'designation',
        'role': 'designation',
        'job title': 'designation',
        'date of joining': 'dateOfJoining',
        'joining date': 'dateOfJoining',
        'doj': 'dateOfJoining',
        'date of birth': 'dateOfBirth',
        'dob': 'dateOfBirth',
        'birth date': 'dateOfBirth',
        'salary': 'salary',
        'monthly salary': 'salary',
        'ctc': 'ctc',
        'annual ctc': 'ctc',
        'employment type': 'employmentType',
        'type': 'employmentType',
        'gender': 'gender',
        'blood group': 'bloodGroup',
        'bloodgroup': 'bloodGroup',
        'marital status': 'maritalStatus',
        'nationality': 'nationality',
        'work location': 'workLocation',
        'location': 'workLocation',
        'branch': 'workLocation',
        'work shift': 'workShift',
        'shift': 'workShift',
        'probation months': 'probationPeriod',
        'probation period': 'probationPeriod',
        'probation': 'probationPeriod',
        'notice period days': 'noticePeriod',
        'notice period': 'noticePeriod',
        'notice': 'noticePeriod',
        'bank name': 'bankName',
        'account number': 'bankAccountNumber',
        'bank account number': 'bankAccountNumber',
        'account no': 'bankAccountNumber',
        'ifsc code': 'ifscCode',
        'ifsc': 'ifscCode',
        'pan number': 'panNumber',
        'pan': 'panNumber',
        'aadhaar number': 'aadhaarNumber',
        'aadhaar': 'aadhaarNumber',
        'aadhar number': 'aadhaarNumber',
        'pf number': 'pfNumber',
        'uan number': 'uanNumber',
        'uan': 'uanNumber',
        'esi number': 'esiNumber',
        'emergency contact name': 'emergencyContactName',
        'emergency name': 'emergencyContactName',
        'emergency contact phone': 'emergencyContactPhone',
        'emergency phone': 'emergencyContactPhone',
        'emergency relationship': 'emergencyContactRelationship',
        'emergency relation': 'emergencyContactRelationship',
        'emergency contact address': 'emergencyContactAddress',
        'emergency address': 'emergencyContactAddress',
        'reporting manager': 'reportingManager',
        'manager email': 'reportingManager',
        'manager': 'reportingManager'
      };

      // Helper to parse CSV line with quoted commas
      const parseCSVLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const rawHeaders = parseCSVLine(lines[0]);
      const mappedKeys = rawHeaders.map(h => {
        const clean = h.trim().toLowerCase();
        return mapping[clean] || h.trim().replace(/\s+/g, '');
      });

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCSVLine(line);
        const obj: any = {};
        mappedKeys.forEach((key, idx) => {
          obj[key] = values[idx] !== undefined ? values[idx] : '';
        });
        rows.push(obj);
      }

      if (rows.length === 0) {
        toast.error('No rows could be parsed from the input content.');
        return;
      }

      setParsedData(rows);
      setStep('preview');
      toast.success(`Successfully parsed ${rows.length} employee record(s)!`);
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

  // Download Quick (9 columns) Template
  const downloadQuickTemplate = () => {
    const headers = "First Name,Last Name,Email,Employee ID,Department,Designation,Date of Joining,Date of Birth,Salary\n";
    const sampleRow = "John,Doe,john.doe@example.com,TS-1002,Engineering,Software Engineer,15-01-2026,20-08-1995,75000\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employee_import_quick_template.csv');
    a.click();
    toast.success('Quick Template downloaded.');
  };

  // Download Comprehensive Master HR Template (29 columns)
  const downloadMasterTemplate = () => {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Employee ID',
      'Department', 'Designation', 'Date of Joining', 'Date of Birth',
      'Gender', 'Blood Group', 'Marital Status', 'Employment Type',
      'Work Location', 'Work Shift', 'Probation Months', 'Notice Period Days',
      'Annual CTC', 'Monthly Salary', 'Bank Name', 'Account Number', 'IFSC Code',
      'PAN Number', 'Aadhaar Number', 'PF Number', 'UAN Number',
      'Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Relationship'
    ].join(',') + '\n';

    const sampleRow = [
      'John', 'Doe', 'john.doe@example.com', '9876543210', 'TS-1002',
      'Engineering', 'Software Engineer', '15-01-2026', '20-08-1995',
      'Male', 'O+', 'Single', 'Full Time',
      'Hyderabad', 'General Shift', '3', '90',
      '900000', '75000', 'HDFC Bank', '5010022334455', 'HDFC0001234',
      'ABCDE1234F', '123456789012', 'MH/12345/678', '100987654321',
      'Jane Doe', '9876543211', 'Spouse'
    ].join(',') + '\n';

    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employee_master_full_template.csv');
    a.click();
    toast.success('Comprehensive Master HR Template downloaded.');
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
    const hasClientErrors = parsedData.some(row => validateRow(row).length > 0);
    if (hasClientErrors) {
      toast.error('Please fix all highlighted validation issues before proceeding.');
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
        toast.success(`Bulk import completed: ${result.successCount} succeeded, ${result.failedCount} failed.`);
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Upload className="h-8 w-8 text-[#f87941]" />
            Bulk Employee Import Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Import workforce records in batch. Fully aligned with statutory KYC, banking accounts, work shifts, and emergency contacts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            onClick={downloadQuickTemplate} 
            variant="outline" 
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-2 text-xs h-9"
          >
            <Download className="h-4 w-4 text-slate-400" /> Quick Template (9 cols)
          </Button>
          <Button 
            onClick={downloadMasterTemplate} 
            className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold flex items-center gap-2 text-xs h-9 shadow-md shadow-[#f87941]/20"
          >
            <Download className="h-4 w-4" /> Full Master Template (29 cols)
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Active ISO / DD-MM-YYYY Parser
          </Badge>
        </div>
      </div>

      {/* Progress Steps Header Indicators */}
      <div className="flex items-center gap-4 border-b pb-4 border-slate-200 dark:border-zinc-800">
        {['Upload / Drop File', 'Preview & Field Mapping', 'Executing Pipeline', 'Execution Logs'].map((s, i) => {
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
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
              <CardContent className="p-6">
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
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
                  <div className="w-16 h-16 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="h-8 w-8 text-[#f87941]" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Drop your CSV / Excel Export file here or click to browse</h3>
                  <p className="text-xs text-slate-500 dark:text-[#b1b1b1] mb-3">
                    Supports both Quick 9-column sheets and Comprehensive 29-column Master HR templates.
                  </p>
                  <Badge variant="outline" className="text-[11px] font-mono border-orange-500/30 text-orange-500">
                    Accepts dates as DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Template Format Guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Auto Bank Sync</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Includes Bank Name, Account No, and IFSC to auto-create primary bank accounts.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Statutory & KYC</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PAN, Aadhaar, PF, UAN, and ESI numbers are automatically mapped and stored.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Emergency Contacts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Contact names, relationships, and emergency phone numbers are auto-linked.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20">
                <CardTitle className="text-md flex items-center gap-2">
                  <Clipboard className="h-4.5 w-4.5 text-[#f87941]" /> Paste Raw CSV Text
                </CardTitle>
                <CardDescription>Paste comma-separated values directly from any Excel table or sheet.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <textarea
                  className="w-full h-48 border rounded-lg p-2.5 bg-transparent text-xs border-input outline-none font-mono"
                  placeholder="First Name,Last Name,Email,Employee ID,Department,Designation,Date of Joining,Salary&#10;John,Doe,john.doe@example.com,TS-1002,Engineering,Software Engineer,15-01-2026,75000"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9" onClick={handleTextPaste}>
                  Parse Pasted CSV Content
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
              <CardTitle className="text-md">Map Workforce Upload Records Preview ({parsedData.length} records)</CardTitle>
              <CardDescription>Review parsed employee records and verified data columns before committing to the database.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-xs h-9 font-semibold" onClick={() => setStep('upload')}>
                Upload Different File
              </Button>
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
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Contact (Email & Phone)</th>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Department & Role</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3">KYC & Banking Sync</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, idx) => {
                  const errors = validateRow(row);
                  const hasBank = !!(row.bankName && row.bankAccountNumber);
                  const hasKyc = !!(row.panNumber || row.aadhaarNumber);
                  const hasEmergency = !!(row.emergencyContactName && row.emergencyContactPhone);

                  return (
                    <tr key={idx} className="border-b hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 border-slate-100 dark:border-zinc-800">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {row.firstName || ''} {row.lastName || ''}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {row.gender && <span className="capitalize">{row.gender}</span>}
                          {row.maritalStatus && <span>• {row.maritalStatus}</span>}
                          {row.bloodGroup && <span>• Blood: {row.bloodGroup}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs">{row.email || 'N/A'}</div>
                        {row.phone && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.phone}</div>}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#f87941]">{row.employeeId || 'N/A'}</td>
                      <td className="p-3">
                        <div className="font-semibold">{row.designation || 'Staff'}</div>
                        <div className="text-[10px] text-slate-400">{row.department || 'N/A'} {row.workLocation ? `(${row.workLocation})` : ''}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <div>{row.dateOfJoining || 'N/A'}</div>
                        {row.salary && <div className="text-[10px] text-emerald-500 font-bold mt-0.5">₹{row.salary}/mo</div>}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {hasBank && (
                            <Badge className="bg-blue-500/10 text-blue-500 border-none font-semibold text-[9px] px-1.5 py-0.5">
                              Bank ✓
                            </Badge>
                          )}
                          {hasKyc && (
                            <Badge className="bg-purple-500/10 text-purple-500 border-none font-semibold text-[9px] px-1.5 py-0.5">
                              KYC ✓
                            </Badge>
                          )}
                          {hasEmergency && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-semibold text-[9px] px-1.5 py-0.5">
                              Emergency ✓
                            </Badge>
                          )}
                          {!hasBank && !hasKyc && !hasEmergency && (
                            <span className="text-[10px] text-slate-400 italic">Basic Only</span>
                          )}
                        </div>
                      </td>
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
              Registering authentication credentials, syncing statutory records, mapping bank accounts & emergency contacts.
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
                <CardDescription>Individual row outcome status and database execution messages.</CardDescription>
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
                    <th className="p-3">Execution Message</th>
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
