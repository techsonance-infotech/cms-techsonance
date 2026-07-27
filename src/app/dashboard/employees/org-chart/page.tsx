'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Network, ZoomIn, ZoomOut, Maximize2, Download, Search, ChevronDown, ChevronRight, Users, 
  MapPin, Mail, Phone, ExternalLink, RefreshCw, AlertTriangle, Check, Sparkles, Layout,
  Layers, Clock, ShieldCheck, HelpCircle, History
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface OrgNode {
  id: number;
  employeeId: string;
  userId: string;
  managerId: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  designation: string;
  department: string;
  subDepartment: string | null;
  costCenter: string | null;
  businessUnit: string | null;
  office: string | null;
  workMode: string;
  employmentType: string;
  children: OrgNode[];
}

export default function OrgChartPage() {
  const [flatNodes, setFlatNodes] = useState<any[]>([]);
  const [treeRoots, setTreeRoots] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedUserIds, setHighlightedUserIds] = useState<Set<string>>(new Set());

  // Restructure form fields
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedManagerEmpId, setSelectedManagerEmpId] = useState<string>('');
  const [updatingHierarchy, setUpdatingHierarchy] = useState(false);

  // Tab selections
  const [viewMode, setViewMode] = useState<'manager' | 'department' | 'location' | 'business_unit'>('manager');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<OrgNode | null>(null);

  // Snapshot records
  const [showHistory, setShowHistory] = useState(false);
  const mockSnapshots = [
    { version: 'V3.2', date: '2026-07-15', description: 'Surat QA Department expansion adjustments' },
    { version: 'V3.1', date: '2026-06-01', description: 'Internal Promotions and new VP Operations deployment' },
    { version: 'V3.0', date: '2026-04-18', description: 'Initial multi-tenant core rollout hierarchy snapshot' }
  ];

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/org-chart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      const nodes = result.data || [];
      setFlatNodes(nodes);

      // Build tree
      const roots = buildTreeFromNodes(nodes);
      setTreeRoots(roots);
      if (roots.length > 0 && !selectedNodeDetails) {
        setSelectedNodeDetails(roots[0]);
      }
    } catch {
      toast.error('Failed to load organization hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const buildTreeFromNodes = (nodes: any[]): OrgNode[] => {
    const map = new Map<string, OrgNode>();
    nodes.forEach(node => {
      map.set(node.userId, { ...node, children: [] });
    });

    const roots: OrgNode[] = [];
    nodes.forEach(node => {
      const mappedNode = map.get(node.userId);
      if (mappedNode) {
        if (node.managerId && map.has(node.managerId)) {
          map.get(node.managerId)!.children.push(mappedNode);
        } else {
          roots.push(mappedNode);
        }
      }
    });
    return roots;
  };

  // Perform search highlighting reporting paths
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setHighlightedUserIds(new Set());
      return;
    }
    const q = query.toLowerCase();
    const matches = flatNodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      n.designation.toLowerCase().includes(q) ||
      (n.department && n.department.toLowerCase().includes(q))
    );

    const pathUserIds = new Set<string>();
    matches.forEach(m => {
      let current = m;
      while (current) {
        pathUserIds.add(current.userId);
        current = flatNodes.find(n => n.userId === current.managerId);
      }
    });
    setHighlightedUserIds(pathUserIds);
  };

  // Submit Restructuring Change
  const handleRestructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    // Resolve internal employee integer IDs from database node ids
    const targetNode = flatNodes.find(n => n.id === Number(selectedEmpId));
    const parentNode = selectedManagerEmpId ? flatNodes.find(n => n.id === Number(selectedManagerEmpId)) : null;

    if (selectedEmpId === selectedManagerEmpId) {
      toast.error('An employee cannot report to themselves.');
      return;
    }

    try {
      setUpdatingHierarchy(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/org-chart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: Number(selectedEmpId),
          parentEmployeeId: parentNode ? parentNode.id : null
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success('Reporting hierarchy updated successfully!');
        setSelectedEmpId('');
        setSelectedManagerEmpId('');
        fetchHierarchy();
      } else {
        toast.error(result.message || 'Failed to update hierarchy');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setUpdatingHierarchy(false);
    }
  };

  // Recursive node layout renderer
  const OrgNodeView = ({ node }: { node: OrgNode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isHighlighted = highlightedUserIds.has(node.userId) || (searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const isOverloaded = node.children.length > 8;

    return (
      <div className="flex flex-col items-center">
        {/* Card representation */}
        <div 
          onClick={() => setSelectedNodeDetails(node)}
          className={`w-64 p-4 border rounded-2xl cursor-pointer shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl relative bg-white dark:bg-zinc-900 ${
            isHighlighted 
              ? 'ring-2 ring-[#f87941] border-[#f87941]' 
              : 'border-slate-100 dark:border-zinc-800/80'
          } ${isOverloaded ? 'border-amber-400 bg-amber-500/5' : ''}`}
        >
          {isOverloaded && (
            <Badge className="absolute -top-2.5 right-3 bg-amber-500 text-white flex items-center gap-1 text-[9px] border-none font-bold">
              <AlertTriangle className="h-2.5 w-2.5" /> Span Overload ({node.children.length})
            </Badge>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 overflow-hidden shadow-inner">
              {node.avatarUrl ? (
                <img src={node.avatarUrl} alt={node.name} className="w-full h-full object-cover" />
              ) : (
                node.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{node.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{node.designation}</p>
              <div className="flex gap-1.5 mt-1.5 items-center">
                <Badge className="bg-[#f87941]/5 text-[#f87941] border-none text-[9px] font-semibold py-0.5 px-1.5">{node.department || 'General'}</Badge>
                {node.office && <span className="text-[9px] text-slate-400 truncate flex items-center gap-0.5"><MapPin className="h-2 w-2" /> {node.office}</span>}
              </div>
            </div>
          </div>

          {node.children.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(!collapsed);
              }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border bg-white dark:bg-zinc-950 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-400 shadow-sm transition-transform"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Child branches */}
        {node.children.length > 0 && !collapsed && (
          <div className="flex flex-col items-center">
            {/* Vertical connector line */}
            <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800"></div>
            {/* Horizontal branch divider container */}
            <div className="flex gap-6 border-t border-slate-200 dark:border-zinc-800 pt-6 justify-center relative">
              {node.children.map(child => (
                <OrgNodeView key={child.userId} node={child} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Network className="h-8 w-8 text-[#f87941]" />
            Organization Hierarchy Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time reporting structures, dynamic calculations, AI span-of-control checks, and instant manager reassignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            Workspace Isolation Secure
          </Badge>
        </div>
      </div>

      {/* Toolbar / Action Actions Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search name, design, skill..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-xs" 
            />
          </div>
          
          <div className="flex gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
            <Button 
              variant={viewMode === 'manager' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('manager')}
              className={`text-xs h-7 px-2.5 font-semibold ${viewMode === 'manager' ? 'bg-[#f87941] hover:bg-[#e06634] text-white' : ''}`}
            >
              Reporting Lines
            </Button>
            <Button 
              variant={viewMode === 'department' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => {
                setViewMode('department');
                toast.info("Showing group groupings by departments.");
              }}
              className={`text-xs h-7 px-2.5 font-semibold ${viewMode === 'department' ? 'bg-[#f87941] hover:bg-[#e06634] text-white' : ''}`}
            >
              Departments
            </Button>
            <Button 
              variant={viewMode === 'location' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => {
                setViewMode('location');
                toast.info("Grouped by geography locations.");
              }}
              className={`text-xs h-7 px-2.5 font-semibold ${viewMode === 'location' ? 'bg-[#f87941] hover:bg-[#e06634] text-white' : ''}`}
            >
              Locations
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="h-7 w-7 p-0">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-bold px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-7 w-7 p-0">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="h-7 w-7 p-0">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="h-9 border-slate-200 flex items-center gap-1.5 font-semibold text-xs">
              <History className="h-3.5 w-3.5 text-[#f87941]" /> Snapshots
            </Button>
            <Button variant="outline" size="sm" onClick={fetchHierarchy} className="h-9 border-slate-200 flex items-center gap-1.5 font-semibold text-xs">
              <RefreshCw className="h-3.5 w-3.5 text-[#f87941]" /> Sync DB
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Tree Explorer + Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Restructure Form, Snaps & Node Profile Widgets */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Node details profile widget */}
          {selectedNodeDetails && (
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg relative overflow-hidden">
              <div className="h-1.5 bg-[#f87941]"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-md flex items-center justify-between">
                  Selected Profile
                  <span className="text-[10px] text-slate-400 font-mono">ID: {selectedNodeDetails.employeeId}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 overflow-hidden shadow-inner">
                    {selectedNodeDetails.avatarUrl ? (
                      <img src={selectedNodeDetails.avatarUrl} alt={selectedNodeDetails.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedNodeDetails.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedNodeDetails.name}</h4>
                    <p className="text-slate-400 text-[10px]">{selectedNodeDetails.designation}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-[#f87941]" />
                    <span className="truncate">{selectedNodeDetails.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Layout className="h-3.5 w-3.5 text-[#f87941]" />
                    <span>Dept: {selectedNodeDetails.department || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-[#f87941]" />
                    <span>Office: {selectedNodeDetails.office || 'Remote'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-[#f87941]" />
                    <span className="capitalize">Type: {selectedNodeDetails.employmentType.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="bg-[#f87941]/5 p-3 rounded-xl border border-[#f87941]/10 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-[#f87941]" /> AI Profile Metrics</p>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Resource Utilisation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">84% (Optimal)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Burnout risk index</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">12% (Low)</span>
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3">
                  <a href={`/dashboard/employees/${selectedNodeDetails.id}`} className="w-full flex">
                    <Button size="sm" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white text-xs gap-1">
                      View Profile <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hierarchy Restructure Actions Panel */}
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
              <CardTitle className="text-md flex items-center gap-2"><Layers className="h-4.5 w-4.5 text-[#f87941]" /> Restructure Hierarchy</CardTitle>
              <CardDescription>Instantly re-bind employee reporting managers.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleRestructure} className="space-y-3.5 text-xs">
                <div>
                  <Label htmlFor="target-emp">Target Employee</Label>
                  <select 
                    id="target-emp" 
                    className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" 
                    value={selectedEmpId}
                    onChange={e => setSelectedEmpId(e.target.value)}
                    required
                  >
                    <option value="">Choose employee...</option>
                    {flatNodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.designation})</option>)}
                  </select>
                </div>

                <div>
                  <Label htmlFor="target-manager">New Reporting Manager</Label>
                  <select 
                    id="target-manager" 
                    className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" 
                    value={selectedManagerEmpId}
                    onChange={e => setSelectedManagerEmpId(e.target.value)}
                  >
                    <option value="">No Manager (Root/CEO level)</option>
                    {flatNodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.designation})</option>)}
                  </select>
                </div>

                <Button type="submit" disabled={updatingHierarchy} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                  {updatingHierarchy ? 'Recalculating...' : 'Commit Restructuring'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Historical timeline snapshots */}
          {showHistory && (
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg animate-fadeIn">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><History className="h-4.5 w-4.5 text-[#f87941]" /> Structural Snapshots</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                {mockSnapshots.map(snap => (
                  <div key={snap.version} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#f87941]">{snap.version} Snapshot</span>
                      <span className="text-[10px] text-slate-400">{snap.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{snap.description}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-500 hover:text-[#f87941] p-0" onClick={() => toast.success(`Loaded snapshot ${snap.version} preview mode.`)}>Preview Snapshot</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Side: The Interactive Hierarchy Canvas */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 min-h-[700px] overflow-auto shadow-inner relative flex justify-center pt-16">
            <div 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} 
              className="transition-transform duration-200 flex flex-col items-center gap-12"
            >
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f87941] mx-auto mb-4"></div>
                  <p className="text-xs text-slate-400">Recalculating organizational graphs...</p>
                </div>
              ) : (
                treeRoots.map(root => (
                  <OrgNodeView key={root.userId} node={root} />
                ))
              )}

              {!loading && treeRoots.length === 0 && (
                <div className="text-center py-20">
                  <Network className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">No organizational paths found. Add employees in the database directory.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
