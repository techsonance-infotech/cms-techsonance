'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ImportStep = 'upload' | 'preview' | 'validating' | 'importing' | 'complete';

export default function BulkImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
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
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }
    toast.success(`File "${file.name}" selected`);
    setStep('preview');
  };

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-3">
            <Upload className="h-7 w-7 text-[#f87941]" />
            Bulk Employee Import
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            Import employees from CSV, Excel, or migrate from existing HRMS systems.
          </p>
        </div>
        <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {['Upload', 'Preview', 'Validate', 'Import', 'Complete'].map((s, i) => {
          const isActive = i === ['upload', 'preview', 'validating', 'importing', 'complete'].indexOf(step);
          const isPast = i < ['upload', 'preview', 'validating', 'importing', 'complete'].indexOf(step);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border-2 transition-all ${
                isActive ? 'bg-[#f87941] border-[#f87941] text-white' :
                isPast ? 'bg-emerald-500 border-emerald-500 text-white' :
                'border-[#e6e4e6]/50 dark:border-[#2f3035]/50 text-slate-400'
              }`}>
                {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${isActive ? 'text-[#f87941]' : isPast ? 'text-emerald-500' : 'text-slate-400'}`}>
                {s}
              </span>
              {i < 4 && <div className="w-8 h-0.5 bg-[#e6e4e6]/30 dark:bg-[#2f3035]/30" />}
            </div>
          );
        })}
      </div>

      {/* Upload Zone */}
      {step === 'upload' && (
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
          <CardContent className="p-8">
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
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-16 h-16 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="h-8 w-8 text-[#f87941]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Drop your file here or click to browse</h3>
              <p className="text-sm text-slate-500 dark:text-[#b1b1b1]">
                Supports <Badge variant="outline" className="ml-1">.csv</Badge>
                <Badge variant="outline" className="ml-1">.xlsx</Badge>
                <Badge variant="outline" className="ml-1">.xls</Badge>
              </p>
              <p className="text-xs text-slate-400 mt-2">Max 5000 rows per import</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'CSV Import', desc: 'Standard comma-separated values', icon: FileSpreadsheet },
                { label: 'Excel Import', desc: 'Microsoft Excel workbooks', icon: FileSpreadsheet },
                { label: 'HRMS Migration', desc: 'Import from other HRMS platforms', icon: Upload },
              ].map((option) => (
                <Card key={option.label} className="bg-slate-50 dark:bg-slate-900/50 border border-[#e6e4e6]/20 dark:border-[#2f3035]/20 cursor-pointer hover:border-[#f87941]/30 transition-all">
                  <CardContent className="p-4 text-center">
                    <option.icon className="h-6 w-6 text-[#f87941] mx-auto mb-2" />
                    <p className="text-sm font-bold">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#f87941] mb-4" />
            <h3 className="text-lg font-bold mb-2">Processing File...</h3>
            <p className="text-sm text-slate-500 dark:text-[#b1b1b1]">
              Preview and validation will appear here once the import pipeline is fully connected.
            </p>
            <Button onClick={() => setStep('upload')} variant="outline" className="mt-4">
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
