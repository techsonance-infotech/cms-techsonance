'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Trash2, Download, FilePlus, Loader2, FileArchive, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EmployeeDocument {
  id: number;
  document_type: string;
  name: string;
  file_url: string;
  uploaded_at: string;
}

interface EmployeeDocumentsProps {
  employeeId: number;
  isAdmin: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume/CV' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'id_proof', label: 'Identity Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'certificate', label: 'Certification' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'other', label: 'Other Document' },
];

export function EmployeeDocuments({ employeeId, isAdmin }: EmployeeDocumentsProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [docType, setDocType] = useState('resume');
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/employees/documents?employeeId=${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      if (!docName) {
        setDocName(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!docName.trim()) {
      toast.error('Please provide a document name');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('session_token');
      
      // Step 1: Upload to Storage
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('kind', 'employee_document');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.data.url;

      // Step 2: Create db record
      const dbRes = await fetch('/api/employees/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId,
          documentType: docType,
          name: docName.trim(),
          fileUrl
        })
      });

      if (!dbRes.ok) throw new Error('Failed to save document record');

      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/employees/documents?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      toast.error('Error deleting document');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setDocType('resume');
    setDocName('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Vault</CardTitle>
          <CardDescription>Loading documents...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Document Vault
            </CardTitle>
            <CardDescription>Securely store and manage employee documents</CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
              setUploadDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a new document to the employee's secure vault (Max 10MB)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={docType} onValueChange={setDocType} disabled={uploading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input 
                      placeholder="e.g. Q1 2026 Bonus Letter" 
                      value={docName} 
                      onChange={(e) => setDocName(e.target.value)}
                      disabled={uploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File Selection</Label>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                        {selectedFile ? <span className="truncate max-w-[200px]">{selectedFile.name}</span> : 'Select File (PDF, JPG, PNG)'}
                      </Button>
                      {selectedFile && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(null)} disabled={uploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={uploading || !selectedFile || !docName}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload File'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <FilePlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAdmin ? "Click 'Upload Document' to add their first file." : "No files have been made available yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-col p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {doc.document_type.replace('_', ' ')}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-3 w-3" />
                      View
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
