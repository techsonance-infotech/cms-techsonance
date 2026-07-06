'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ZoomIn, ZoomOut, Maximize2, Download, Plus, ChevronDown, Users } from 'lucide-react';
import { toast } from 'sonner';

interface OrgNode {
  id: number;
  employeeId: number;
  parentEmployeeId: number | null;
  positionTitle: string | null;
  level: number;
  sortOrder: number;
  employee?: {
    id: number;
    employeeId: string;
    designation: string;
    department: string;
    status: string;
  };
  userName?: string;
  children: OrgNode[];
}

export default function OrgChartPage() {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Will be connected to org_chart API once tables are created
    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-3">
            <Network className="h-7 w-7 text-[#f87941]" />
            Organization Chart
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            Interactive organizational hierarchy with drag-and-drop restructuring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="h-8 w-8 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="h-8 w-8 p-0">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Org Chart Canvas */}
      <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 min-h-[600px]">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Network className="h-10 w-10 text-[#f87941]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Organization Chart</h3>
            <p className="text-sm text-slate-500 dark:text-[#b1b1b1] max-w-md">
              Run the SQL migration to create the <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">org_chart</code> table, 
              then the interactive drag-and-drop tree will render here.
            </p>
            <Badge variant="outline" className="mt-4 text-[#f87941] border-[#f87941]/30">
              Phase 5 — Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
