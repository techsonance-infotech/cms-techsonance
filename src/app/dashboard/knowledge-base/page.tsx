'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  BookOpen, Search, Plus, Sparkles, FileText, 
  HelpCircle, MessageSquare, History, Edit, 
  ShieldAlert, RefreshCw, FolderClosed, Eye, Trash2
} from 'lucide-react';

type DocType = 'Policy' | 'Article' | 'FAQ' | 'Announcement' | 'SOP';

export default function KnowledgeBasePortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<DocType>('Policy');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [versionLogs, setVersionLogs] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState<DocType>('Article');
  const [category, setCategory] = useState('General');
  const [changeSummary, setChangeSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/knowledge-base', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load knowledge documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchVersionHistory = async (docId: string) => {
    try {
      setLoadingVersions(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/knowledge-base/versions?docId=${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setVersionLogs(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Please specify both title and document text.');
      return;
    }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          type: docType,
          category
        })
      });

      if (res.ok) {
        toast.success('Document published successfully.');
        setIsCreateOpen(false);
        setTitle('');
        setContent('');
        fetchDocuments();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || errJson.message || 'Failed to publish document.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error publishing knowledge document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !title || !content) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/knowledge-base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          docId: selectedDoc.id,
          title,
          content,
          category,
          changeSummary
        })
      });

      if (res.ok) {
        toast.success('Document updated & version logged.');
        setIsEditing(false);
        setIsViewOpen(false);
        fetchDocuments();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || errJson.message || 'Failed to update document.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving document updates.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/knowledge-base?id=${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Document "${docTitle}" deleted.`);
        fetchDocuments();
        setIsViewOpen(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || errJson.message || 'Failed to delete document.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting document.');
    }
  };

  const handleAiRefineContent = () => {
    if (!title) {
      toast.error('Please enter a Title to generate context.');
      return;
    }
    toast.loading('AI is structuring corporate standard draft...', { id: 'ai-refine' });
    setTimeout(() => {
      setContent(
        `[CONFIDENTIAL - CORPORATE STANDARD]\n\nDOCUMENT TITLE: ${title}\n\n1. SCOPE & PURPOSE\nThis SOP establishes standard parameters to regulate operations, guarantee information security parameters, and ensure compliance requirements.\n\n2. EXPECTATIONS & KEY PROCESS STEPS\n- Standard inputs must be processed sequentially.\n- Daily compliance checks must be validated and logged.\n- Outliers must be reported to the departmental manager.`
      );
      toast.success('Content generated!', { id: 'ai-refine' });
    }, 650);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesTab = doc.type === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const categoriesList = ['All', 'HR', 'Tech', 'Security', 'Finance', 'Operations'];

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0">
        <PageHeader 
          title="Knowledge Base & SOPs"
          description="Access corporate policies, release protocols, Standard Operating Procedures, and FAQs."
          actions={[
            <Button 
              key="refresh" 
              variant="outline" 
              onClick={fetchDocuments}
              className="border-border text-foreground font-bold hover:bg-accent flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>,
            <Button 
              key="add" 
              onClick={() => {
                setDocType(activeTab);
                setIsCreateOpen(true);
              }}
              className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Document
            </Button>
          ]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Knowledge Base' }]}
        />
      </div>

      {/* Control filters */}
      <div className="shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center bg-accent/20 p-4 rounded-2xl border border-border/60 mt-4">
        {/* Document type triggers */}
        <div className="flex bg-accent/40 border border-border/80 rounded-xl p-1 shadow-xs overflow-x-auto w-full md:w-auto scrollbar-hide">
          {(['Policy', 'Article', 'FAQ', 'Announcement', 'SOP'] as const).map(tabType => {
            const count = documents.filter(d => d.type === tabType).length;
            return (
              <button 
                key={tabType}
                onClick={() => setActiveTab(tabType)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tabType 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tabType}s ({count})
              </button>
            );
          })}
        </div>

        {/* Searching & Categories filter */}
        <div className="flex gap-3 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card border-border text-xs rounded-xl h-9"
            />
          </div>

          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="bg-card border border-border text-xs rounded-xl p-2 h-9 text-foreground cursor-pointer font-bold shrink-0"
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat} category</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable list Workspace */}
      <div className="flex-1 overflow-y-auto pr-1 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredDocs.map((doc) => (
            <Card 
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setTitle(doc.title);
                setContent(doc.content);
                setCategory(doc.category);
                setChangeSummary('');
                setIsEditing(false);
                setIsViewOpen(true);
                fetchVersionHistory(doc.id);
              }}
              className="border-none shadow-xs hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer bg-card flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                    {doc.category}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-extrabold border-border text-muted-foreground">
                    Ver: {doc.version}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-black line-clamp-2 leading-snug">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {doc.content}
                </p>
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>By: {doc.created_by ? `${doc.created_by.first_name} ${doc.created_by.last_name}` : 'Corporate'}</span>
                  <span>{new Date(doc.updated_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDocs.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3">
              <FolderClosed className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground italic">No matching documents found under {activeTab}s.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Document Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              Publish Knowledge Document
            </DialogTitle>
            <DialogDescription>Define corporate reference guidelines, policies, or procedures.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDocument} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocType)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="Policy">Policy</option>
                  <option value="Article">Article</option>
                  <option value="FAQ">FAQ</option>
                  <option value="Announcement">Announcement</option>
                  <option value="SOP">SOP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="General">General</option>
                  <option value="HR">HR</option>
                  <option value="Tech">Tech</option>
                  <option value="Security">Security</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Title *</label>
              <Input 
                placeholder="e.g. Standard Coding Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase">Content *</label>
                <Button type="button" size="xs" variant="outline" className="text-primary hover:text-primary/95 text-[10px] font-black flex items-center gap-1" onClick={handleAiRefineContent}>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" /> AI Assistant Draft
                </Button>
              </div>
              <Textarea 
                placeholder="Define content parameters..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none text-xs bg-accent/30 border-border rounded-xl h-48"
                required
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View / Edit & Version History Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <span>{title}</span>
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-primary text-white border-none font-bold text-xs uppercase px-3 py-1">
                      {selectedDoc.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-bold border-border">
                      Version: {selectedDoc.version}
                    </Badge>
                  </div>
                </div>
                <DialogDescription>
                  Review latest revisions or edit standard parameters. Version history is logged below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUpdateDocument} className="space-y-6 pt-3">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Document Title</label>
                      <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-accent/30 border-border text-xs rounded-xl"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Content Text</label>
                        <Button type="button" size="xs" variant="outline" className="text-primary hover:text-primary/95 text-[10px] font-black flex items-center gap-1" onClick={handleAiRefineContent}>
                          <Sparkles className="h-3 w-3 text-primary" /> AI Refine
                        </Button>
                      </div>
                      <Textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="resize-none text-xs bg-accent/30 border-border rounded-xl h-48"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Change Summary *</label>
                      <Input 
                        placeholder="Define what was changed (e.g. updated 2FA clause)"
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        className="bg-accent/30 border-border text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-accent/30 p-5 rounded-2xl border border-border/40 text-xs font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.content}
                  </div>
                )}

                {/* Audit trail version log */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-primary" /> Version Revision History
                  </h4>
                  
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {loadingVersions ? (
                      <p className="text-[10px] text-muted-foreground italic">Loading revisions list...</p>
                    ) : (
                      versionLogs.map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-xs p-2.5 border border-border/30 rounded-xl bg-accent/10">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">v{log.version} - {log.change_summary}</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                              Edited by: {log.changed_by ? `${log.changed_by.first_name} ${log.changed_by.last_name}` : 'Corporate'}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-extrabold border-border shrink-0">
                            {new Date(log.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Revisions'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => handleDeleteDocument(selectedDoc.id, selectedDoc.title)}
                        className="text-destructive hover:bg-destructive/10 font-bold text-xs flex items-center gap-1.5 mr-auto"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
                        Close
                      </Button>
                      <Button type="button" onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/95 text-white font-bold border-none flex items-center gap-1.5">
                        <Edit className="h-4 w-4" /> Edit Parameters
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
