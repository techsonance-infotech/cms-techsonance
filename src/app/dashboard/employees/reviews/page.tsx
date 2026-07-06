'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Calendar, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-3">
            <Star className="h-7 w-7 text-[#f87941]" />
            Reviews & Appraisals
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            Manage performance review cycles, appraisals, and growth tracking.
          </p>
        </div>
        <Button className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)]">
          <Plus className="h-4 w-4" /> New Review Cycle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Cycles', value: '0', icon: Calendar, color: 'text-blue-500' },
          { label: 'Pending Reviews', value: '0', icon: Clock, color: 'text-amber-500' },
          { label: 'Completed', value: '0', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Overdue', value: '0', icon: AlertTriangle, color: 'text-red-500' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-[#b1b1b1]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder */}
      <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mb-4">
            <Star className="h-10 w-10 text-[#f87941]" />
          </div>
          <h3 className="text-lg font-bold mb-2">Performance Review Engine</h3>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] max-w-md">
            Create review cycles, assign reviewers, track goals (KPIs, KRAs, OKRs), and manage
            quarterly, half-yearly, yearly, 360°, peer, and self-reviews.
          </p>
          <Badge variant="outline" className="mt-4 text-[#f87941] border-[#f87941]/30">
            Phase 5 — Coming Soon
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
