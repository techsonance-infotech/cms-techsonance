// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InvoiceDialog({ open, onOpenChange, onSuccess }: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      // Pre-fill values
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setClientId('');
      setProjectId('');
      setAmount('');
      setTax('0');
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days from now
      setPaymentTerms('Net 30');
      setNotes('');

      // Fetch clients and projects
      const fetchData = async () => {
        setFetchingData(true);
        const token = localStorage.getItem('session_token');
        try {
          const [clientsRes, projectsRes] = await Promise.all([
            fetch('/api/clients?limit=100', {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }),
            fetch('/api/projects?limit=100', {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }),
          ]);

          if (clientsRes.ok) {
            const data = await clientsRes.json();
            setClients(Array.isArray(data) ? data : data.data || []);
          }
          if (projectsRes.ok) {
            const data = await projectsRes.json();
            setProjects(Array.isArray(data) ? data : data.data || []);
          }
        } catch (error) {
          console.error('Failed to fetch clients/projects for dialog:', error);
          toast.error('Failed to load clients and projects options');
        } finally {
          setFetchingData(false);
        }
      };

      void fetchData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !clientId || !amount || !dueDate) {
      toast.error('Please fill in Invoice #, Client, Amount, and Due Date');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('session_token');
    const parsedAmount = parseFloat(amount);
    const parsedTax = parseFloat(tax || '0');
    const totalAmount = parsedAmount + parsedTax;

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          invoiceNumber,
          clientId: parseInt(clientId, 10),
          projectId: projectId && projectId !== 'none' ? parseInt(projectId, 10) : null,
          amount: parsedAmount,
          tax: parsedTax,
          totalAmount,
          dueDate,
          paymentTerms,
          notes,
          status: 'draft',
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || resData.message || 'Failed to create invoice');
      }

      toast.success('Invoice created successfully as draft!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Generate a new multi-tenant corporate client invoice ledger record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {fetchingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#f87941]" />
              <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.companyName || client.contactPerson}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects
                        .filter((p) => !clientId || p.clientId?.toString() === clientId)
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Base Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tax">Tax/GST (₹)</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t text-sm font-semibold flex justify-between items-center text-slate-800 dark:text-slate-200">
                <span>Calculated Total Amount:</span>
                <span className="text-[#f87941] text-lg font-black">
                  ₹{(parseFloat(amount || '0') + parseFloat(tax || '0')).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Memo</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter client instructions, bank details, or internal memos..."
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || fetchingData}
              className="bg-gradient-to-r from-[#F87941] to-[#F4662B] text-white hover:from-[#F4662B] hover:to-[#E95B1F]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
