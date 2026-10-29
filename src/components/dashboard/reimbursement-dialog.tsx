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
import { Checkbox } from '@/components/ui/checkbox';
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

export const EXPENSE_CATEGORIES = [
  { id: 'Travel', name: 'Business Travel & Flights' },
  { id: 'Fuel', name: 'Fuel & Mileage Allowance' },
  { id: 'Food', name: 'Meals & Dining' },
  { id: 'Internet', name: 'Broadband & Home Internet' },
  { id: 'Mobile', name: 'Mobile Phone & Cellular Data' },
  { id: 'Medical', name: 'Medical & Health Expenses' },
  { id: 'Training', name: 'Professional Training & Courses' },
  { id: 'Certification', name: 'Skill Certification Fees' },
  { id: 'Relocation', name: 'Employee Relocation Expenses' },
  { id: 'Office Supplies', name: 'Office Supplies & Stationery' },
  { id: 'Project Expenses', name: 'Project Software & Cloud Tools' },
  { id: 'Client Expenses', name: 'Client Hospitality & Meetings' },
  { id: 'Accommodation', name: 'Hotel & Lodging' },
  { id: 'Entertainment', name: 'Team Outing & Entertainment' },
  { id: 'Remote Work Allowance', name: 'Remote Work & Home Office Setup' },
  { id: 'Custom', name: 'Custom Expense Category' }
];

interface ReimbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUser?: any;
}

export function ReimbursementDialog({ open, onOpenChange, onSuccess, currentUser }: ReimbursementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingRoster, setFetchingRoster] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [category, setCategory] = useState('Travel');
  const [title, setTitle] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [gstinVatNumber, setGstinVatNumber] = useState('');
  const [projectName, setProjectName] = useState('General Corporate');
  const [isBillable, setIsBillable] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      // Pre-fill defaults
      setSelectedUserId(currentUser?.id?.toString() || '');
      setCategory('Travel');
      setTitle('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setTaxAmount('0');
      setCurrency('INR');
      setGstinVatNumber('');
      setProjectName('General Corporate');
      setIsBillable(false);
      setMerchantName('');
      setNotes('');

      // Fetch employee roster
      const fetchRoster = async () => {
        setFetchingRoster(true);
        const token = localStorage.getItem('session_token');
        try {
          const res = await fetch('/api/reimbursements/operations', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            if (data.employeeRoster) {
              setRoster(data.employeeRoster);
              // If current user is in roster, select them, else select first
              const userInRoster = data.employeeRoster.find((r: any) => r.id?.toString() === currentUser?.id?.toString());
              if (userInRoster) {
                setSelectedUserId(userInRoster.id.toString());
              } else if (data.employeeRoster.length > 0 && !selectedUserId) {
                setSelectedUserId(data.employeeRoster[0].id.toString());
              }
            }
          }
        } catch (error) {
          console.error('Failed to load roster:', error);
          toast.error('Failed to load employee directory');
        } finally {
          setFetchingRoster(false);
        }
      };

      void fetchRoster();
    }
  }, [open, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !title.trim() || !amount || !expenseDate) {
      toast.error('Please fill in Employee, Title, Amount, and Expense Date');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('session_token');

    try {
      const response = await fetch('/api/reimbursements/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: selectedUserId,
          category,
          title: title.trim(),
          expenseDate,
          amount: parseFloat(amount),
          currency,
          taxAmount: parseFloat(taxAmount || '0'),
          gstinVatNumber,
          projectName,
          isBillable,
          merchantName,
          notes: notes.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit expense claim');
      }

      toast.success(resData.message || 'Expense claim submitted successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error submitting expense claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense Claim</DialogTitle>
          <DialogDescription>
            Record and submit a new corporate expense claim for reimbursement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {fetchingRoster ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#f87941]" />
              <span className="ml-2 text-sm text-muted-foreground">Loading employee roster...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} ({emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Expense Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Expense Title / Description *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Client Dinner at Hyatt, AWS Hosting charges..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expenseDate">Expense Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="projectName">Project Allocation</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Enterprise SaaS Portal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount *</Label>
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
                  <Label htmlFor="taxAmount">Tax/VAT Amount</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="INR" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="merchantName">Merchant Name</Label>
                  <Input
                    id="merchantName"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Hilton, AWS, Uber..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gstinVatNumber">Tax ID / GSTIN</Label>
                  <Input
                    id="gstinVatNumber"
                    value={gstinVatNumber}
                    onChange={(e) => setGstinVatNumber(e.target.value)}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="isBillable"
                  checked={isBillable}
                  onCheckedChange={(checked) => setIsBillable(!!checked)}
                />
                <Label htmlFor="isBillable" className="cursor-pointer font-medium text-sm">
                  This expense is billable to the client project
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide any additional justifications, audit logs, or details..."
                  rows={2}
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
              disabled={loading || fetchingRoster}
              className="bg-gradient-to-r from-[#F87941] to-[#F4662B] text-white hover:from-[#F4662B] hover:to-[#E95B1F]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
