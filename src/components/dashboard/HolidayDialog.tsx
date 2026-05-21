// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { companyHolidaySchema } from '@/server/validation/settings';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';
import { z } from 'zod';

type HolidayFormValues = z.infer<typeof companyHolidaySchema>;

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: any | null; // CompanyHoliday type
  onSuccess: () => void;
}

export function HolidayDialog({ open, onOpenChange, holiday, onSuccess }: HolidayDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(companyHolidaySchema),
    defaultValues: {
      date: '',
      reason: '',
      year: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (holiday) {
      form.reset({
        date: holiday.date,
        reason: holiday.reason,
        year: holiday.year,
      });
    } else {
      form.reset({
        date: '',
        reason: '',
        year: new Date().getFullYear(),
      });
    }
  }, [holiday, form, open]);

  const onSubmit = async (values: HolidayFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const url = holiday 
        ? `/api/company-holidays?id=${holiday.id}` 
        : '/api/company-holidays';
      const method = holiday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          year: parseInt(values.date.split('-')[0]),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save holiday');
      }

      toast.success(holiday ? 'Holiday updated successfully' : 'Holiday added successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            {holiday ? 'Edit Company Holiday' : 'Add Company Holiday'}
          </DialogTitle>
          <DialogDescription>
            {holiday ? 'Update the details for this company holiday.' : 'Enter the details for the new company holiday.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Holiday Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-200" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Reason / Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Independence Day" 
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-200" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-12"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="rounded-xl h-12 bg-blue-600 hover:bg-blue-700 px-8"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {holiday ? 'Update Holiday' : 'Save Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
