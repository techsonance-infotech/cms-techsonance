'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Laptop, CheckCircle2, AlertTriangle, Plus, ClipboardList, RefreshCw, PenTool, Monitor, Trash2, KeyRound, Wrench,
  Search, Check, X, ShieldAlert, Cpu, Award, DollarSign, Calendar, Globe, Server, FileText, Smartphone, Users, Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function AssetTrackerPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Asset category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New Asset inventory form
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [newAssetCategoryId, setNewAssetCategoryId] = useState<number | null>(null);
  const [newAssetModel, setNewAssetModel] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('available');

  // Extended ALM specs
  const [newAssetCost, setNewAssetCost] = useState('120000');
  const [newAssetMac, setNewAssetMac] = useState('');
  const [newAssetImei, setNewAssetImei] = useState('');
  const [newAssetLifespan, setNewAssetLifespan] = useState('5');

  // Active Workspace tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'procurement' | 'checkout' | 'transfers' | 'warranty' | 'repairs' | 'licences' | 'mdm' | 'access' | 'audits' | 'recovery' | 'depreciation'>('inventory');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected asset for quick actions
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // MDM Remote Lockout logs
  const [mdmLogs, setMdmLogs] = useState<string[]>([]);
  const [wipeActive, setWipeActive] = useState(false);

  // Check out parameters
  const [checkoutEmployeeId, setCheckoutEmployeeId] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('Mint');
  const [checkoutAccessories, setCheckoutAccessories] = useState({ charger: true, bag: true, mouse: false, dongle: false });
  const [checkoutReturnDate, setCheckoutReturnDate] = useState('');

  // Repairs ledger parameters
  const [repairType, setRepairType] = useState('corrective');
  const [repairCost, setRepairCost] = useState('5000');
  const [repairDowntime, setRepairDowntime] = useState('4');
  const [repairNotes, setRepairNotes] = useState('');
  const [repairHistoryList, setRepairHistoryList] = useState<any[]>([
    { id: 101, assetName: 'MacBook Pro M3 Max', type: 'preventive', cost: 1200, downtime: 2, status: 'met', date: '2026-06-15' },
    { id: 102, assetName: 'Dell UltraSharp 32', type: 'corrective', cost: 4500, downtime: 8, status: 'breached', date: '2026-07-10' }
  ]);

  // Transfers logs
  const [transfersList, setTransfersList] = useState<any[]>([
    { id: 201, assetName: 'MacBook Pro M3', from: 'Main Office', to: 'Secondary Warehouse', transport: 'Corporate Courier (UPS)', date: '2026-07-20', status: 'In Transit' },
    { id: 202, assetName: 'SaaS License Enterprise', from: 'Platform team', to: 'Design team', transport: 'SSO Federated Transfer', date: '2026-07-25', status: 'Completed' }
  ]);

  // Audits logs
  const [auditVerifiedList, setAuditVerifiedList] = useState<any[]>([]);
  const [auditDiscrepancyCount, setAuditDiscrepancyCount] = useState(0);

  // Recovery logs matching offboarding exits
  const [recoveryDeductions, setRecoveryDeductions] = useState('0');
  const [recoveryAccessoriesStatus, setRecoveryAccessoriesStatus] = useState('All returned');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = getStoredSessionToken();

    // 1. Fetch categories
    try {
      const categoriesRes = await fetch('/api/assets/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setNewAssetCategoryId(categoriesData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load asset categories:', err);
    }

    // 2. Fetch assets
    try {
      const assetsRes = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        const aList = assetsData.data || assetsData || [];
        setAssets(aList);
        if (aList.length > 0) {
          setSelectedAsset(aList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }

    // 3. Fetch requests
    try {
      const requestsRes = await fetch('/api/assets/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.data || requestsData || []);
      }
    } catch (err) {
      console.error('Failed to load asset requests:', err);
    }

    // 4. Fetch employees
    try {
      const empRes = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : (empData.data || []));
      }
    } catch (err) {
      console.error('Failed to load employees for assets workspace:', err);
    }

    setLoading(false);
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/assets/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName, description: newCatDesc })
      });
      if (res.ok) {
        toast.success('Asset category created successfully');
        setNewCatName('');
        setNewCatDesc('');
        fetchData();
      } else {
        toast.error('Failed to create category');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const createAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetSerial || !newAssetCategoryId) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: newAssetCategoryId,
          name: newAssetName,
          serialNumber: newAssetSerial,
          modelNumber: newAssetModel,
          status: newAssetStatus,
          purchaseCost: Number(newAssetCost),
          macAddress: newAssetMac,
          imeiNumber: newAssetImei,
          depreciationYears: Number(newAssetLifespan)
        })
      });
      if (res.ok) {
        toast.success('Asset item registered to inventory');
        setNewAssetName('');
        setNewAssetSerial('');
        setNewAssetModel('');
        setNewAssetMac('');
        setNewAssetImei('');
        fetchData();
      } else {
        toast.error('Failed to register asset');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const handleRequestApproval = async (id: number, approvalStatus: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/assets/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status: approvalStatus, managerComments: 'HR ALM Approved' })
      });
      if (res.ok) {
        toast.success(`Request status set to ${approvalStatus}`);
        fetchData();
      } else {
        toast.error('Failed to update request');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // Checkout Allocation Handler
  const handleCheckoutAsset = async () => {
    if (!selectedAsset || !checkoutEmployeeId) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/assets/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          employeeId: Number(checkoutEmployeeId),
          conditionOnAssign: checkoutCondition,
          assignedDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success('Asset checkout completed successfully');
        setCheckoutEmployeeId('');
        fetchData();
      } else {
        toast.error('Allocation checkout failed');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // Simulated MDM remote locks
  const triggerMDMWipe = () => {
    if (!selectedAsset) return;
    setWipeActive(true);
    setMdmLogs(['[MDM Endpoint] Initiating remote wipe signal...']);
    setTimeout(() => {
      setMdmLogs(prev => [...prev, `[Target Node] Establishing secure connection with device S/N: ${selectedAsset.serial_number}...`]);
    }, 600);
    setTimeout(() => {
      setMdmLogs(prev => [...prev, '[MDM Profile] Device identity confirmed. Triggering system lock.']);
    }, 1200);
    setTimeout(() => {
      setMdmLogs(prev => [...prev, '[Container Security] Remote disk erasure initiated. Cleared SSO credentials.']);
    }, 1800);
    setTimeout(() => {
      setMdmLogs(prev => [...prev, '✅ Device safely wiped. Locked container successfully.']);
      setWipeActive(false);
      toast.success('SSO remote lockout wiped device successfully!');
    }, 2400);
  };

  // Repair maintenance logger
  const handleLogRepair = () => {
    if (!selectedAsset) return;
    const newRecord = {
      id: repairHistoryList.length + 101,
      assetName: selectedAsset.name,
      type: repairType,
      cost: Number(repairCost),
      downtime: Number(repairDowntime),
      status: 'met',
      date: new Date().toISOString().split('T')[0]
    };
    setRepairHistoryList(prev => [newRecord, ...prev]);
    toast.success('Maintenance record logged successfully');
  };

  // Surprise Audit check
  const handleVerifyAssetAudit = (asset: any) => {
    setAuditVerifiedList(prev => [...prev, asset.id]);
    toast.success(`Asset tag S/N: ${asset.serial_number} verified in stock.`);
  };

  const filteredAssets = assets.filter(a => {
    const q = searchQuery.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.serial_number?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b pb-2">
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-28"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-28"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-28"></div>
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          <div className="lg:col-span-2 h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-850 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Cpu className="h-8 w-8 text-[#f87941]" />
            Asset Lifecycle Workspace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage global procurements, checking out devices, diagnostic maintenance logs, and audit reconciliations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            ISO 27001 & SOC2 Compliant Registry
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-xl">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total organization Assets</p>
              <h3 className="text-xl font-bold mt-0.5">{assets.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active checkouts</p>
              <h3 className="text-xl font-bold mt-0.5">{assets.filter(a => a.status === 'assigned').length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available in Stock</p>
              <h3 className="text-xl font-bold mt-0.5">{assets.filter(a => a.status === 'available').length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md dark:bg-slate-950/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Under diagnostics</p>
              <h3 className="text-xl font-bold mt-0.5">{assets.filter(a => a.status === 'maintenance').length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category and Asset Setup Forms */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Laptop className="h-4 w-4 text-[#f87941]" />
                Procure & Register Asset
              </CardTitle>
              <CardDescription>Procure device items for workspaces catalog.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={createAsset} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <Label htmlFor="asset-name">Asset / Model Title</Label>
                    <Input id="asset-name" placeholder="e.g. MacBook Pro M3 Max" value={newAssetName} onChange={e => setNewAssetName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="asset-serial">Serial Number</Label>
                    <Input id="asset-serial" placeholder="e.g. C02GL9A8XT" value={newAssetSerial} onChange={e => setNewAssetSerial(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="asset-cat">Asset Category</Label>
                    <select id="asset-cat" className="w-full border rounded-lg p-2 bg-transparent text-xs border-input outline-none h-9 mt-1" value={newAssetCategoryId || ''} onChange={e => setNewAssetCategoryId(Number(e.target.value))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="asset-cost">Purchase Cost (INR)</Label>
                    <Input id="asset-cost" type="number" value={newAssetCost} onChange={e => setNewAssetCost(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="asset-lifespan">Useful Life (Years)</Label>
                    <Input id="asset-lifespan" type="number" value={newAssetLifespan} onChange={e => setNewAssetLifespan(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="asset-mac">MAC Address</Label>
                    <Input id="asset-mac" placeholder="00:1A:2B:3C:4D:5E" value={newAssetMac} onChange={e => setNewAssetMac(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="asset-imei">IMEI Number (Mobiles)</Label>
                    <Input id="asset-imei" placeholder="358291049281294" value={newAssetImei} onChange={e => setNewAssetImei(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="asset-model">Specification Description</Label>
                    <Input id="asset-model" placeholder="64GB RAM • 1TB SSD • OS Sonoma" value={newAssetModel} onChange={e => setNewAssetModel(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                  Commit Procurement & Register
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Plus className="h-4 w-4 text-[#f87941]" />
                Add Asset Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={createCategory} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cat-name" className="text-xs">Category Name</Label>
                  <Input id="cat-name" placeholder="e.g. SaaS Cloud Licenses" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-desc" className="text-xs">Description</Label>
                  <Input id="cat-desc" placeholder="Details..." value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-semibold">
                  Add custom Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: ALM lifecycle tabs workspace */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-xl dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ClipboardList className="h-4 w-4 text-[#f87941]" />
                Central Asset Workspace (ALM)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tab options lists */}
              <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-thin border-b">
                {[
                  { id: 'inventory', label: 'Asset Master', icon: Laptop },
                  { id: 'procurement', label: 'Procurements', icon: FileText },
                  { id: 'checkout', label: 'Check-outs', icon: CheckCircle2 },
                  { id: 'transfers', label: 'Transfers', icon: Globe },
                  { id: 'warranty', label: 'Warranty AMC', icon: Award },
                  { id: 'repairs', label: 'Repairs & Cost', icon: Wrench },
                  { id: 'licences', label: 'SaaS Licences', icon: Server },
                  { id: 'mdm', label: 'MDM lockouts', icon: Smartphone },
                  { id: 'access', label: 'Keycards', icon: KeyRound },
                  { id: 'audits', label: 'Surprise Audits', icon: ShieldAlert },
                  { id: 'recovery', label: 'Exit recovery', icon: Undo2 },
                  { id: 'depreciation', label: 'Depreciation', icon: DollarSign }
                ].map(t => (
                  <Button
                    key={t.id}
                    variant={activeTab === t.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(t.id as any)}
                    className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white' : 'text-slate-400'}
                  >
                    <t.icon className="h-3.5 w-3.5 mr-1" /> {t.label}
                  </Button>
                ))}
              </div>

              {/* Selected Asset summary banner */}
              {selectedAsset && (
                <div className="mt-4 p-4 rounded-xl border border-[#f87941]/10 bg-[#f87941]/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-500">Selected Asset Target:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedAsset.name} • S/N: {selectedAsset.serial_number}</p>
                  </div>
                  <Badge className="bg-[#f87941]/15 text-[#f87941] border-none font-bold uppercase tracking-wider">{selectedAsset.status}</Badge>
                </div>
              )}

              {/* TAB 1: INVENTORY MASTER */}
              {activeTab === 'inventory' && (
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search asset model serial or tag..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredAssets.map(a => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAsset(a)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedAsset?.id === a.id ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm' : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{a.name}</p>
                            <span className="text-xs text-slate-500 block mt-0.5">S/N: {a.serial_number} • Model: {a.model_number || 'N/A'}</span>
                            {a.macAddress && <p className="text-[10px] text-slate-400 font-mono mt-1">MAC: {a.macAddress} • IMEI: {a.imeiNumber || 'N/A'}</p>}
                          </div>
                          <Badge className="bg-slate-100 dark:bg-zinc-800 border text-xs capitalize text-slate-700 dark:text-slate-300">
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: PROCUREMENTS WORKFLOW */}
              {activeTab === 'procurement' && (
                <div className="space-y-4 pt-4 text-xs">
                  <Label className="font-bold text-slate-400 block mb-2 uppercase tracking-wider">Employee Requests & Budget Sign-offs</Label>
                  
                  {requests.map(req => (
                    <div key={req.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/10 space-y-3">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="font-bold">Request for Category: {req.asset_categories?.name || 'Device Item'}</span>
                        <Badge className={req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 font-bold border-none' : 'bg-emerald-500/10 text-emerald-600 font-bold border-none'}>
                          {req.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-500">Reason: "{req.reason}"</p>
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button size="xs" variant="outline" className="text-[#f87941] border-[#f87941]/25 h-7" onClick={() => handleRequestApproval(req.id, 'rejected')}>Reject Request</Button>
                          <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7" onClick={() => handleRequestApproval(req.id, 'approved')}>Approve Budget & Quality Check</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: CHECKOUT ALLOCATIONS */}
              {activeTab === 'checkout' && (
                <div className="space-y-4 pt-4 text-xs">
                  {selectedAsset?.status === 'available' ? (
                    <div className="space-y-4 border rounded-2xl p-5 bg-slate-50/50 dark:bg-zinc-900/10">
                      <p className="font-bold border-b pb-1.5">Check-out Allocation Form</p>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Assign Employee Custodian</Label>
                          <select value={checkoutEmployeeId} onChange={e => setCheckoutEmployeeId(e.target.value)} className="w-full border rounded-lg p-2.5 bg-transparent text-xs border-input outline-none mt-1">
                            <option value="">Select Employee</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs">Accessories Handover Verification</Label>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input type="checkbox" checked={checkoutAccessories.charger} onChange={e => setCheckoutAccessories(prev => ({ ...prev, charger: e.target.checked }))} className="rounded text-[#f87941] focus:ring-[#f87941] h-4.5 w-4.5" /> USB-C Charger
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input type="checkbox" checked={checkoutAccessories.bag} onChange={e => setCheckoutAccessories(prev => ({ ...prev, bag: e.target.checked }))} className="rounded text-[#f87941] focus:ring-[#f87941] h-4.5 w-4.5" /> Carrying Sleeve/Bag
                            </label>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Condition on Assignment</Label>
                          <select value={checkoutCondition} onChange={e => setCheckoutCondition(e.target.value)} className="w-full border rounded-lg p-2.5 bg-transparent text-xs border-input outline-none mt-1">
                            <option value="Mint">Mint Condition</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good / Used</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs">Expected Return Date</Label>
                          <Input type="date" value={checkoutReturnDate} onChange={e => setCheckoutReturnDate(e.target.value)} className="mt-1" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={handleCheckoutAsset}>Confirm Checkout & Issue Asset</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed rounded-2xl text-center italic text-slate-400 leading-relaxed">
                      Select an "available" device from the inventory list to checkout.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRANSFERS */}
              {activeTab === 'transfers' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <p className="font-bold text-slate-400 uppercase tracking-wider">Inter-Office & Warehouse Transfers</p>
                    <Button size="xs" variant="outline" className="border-[#f87941]/20 text-[#f87941] hover:bg-[#f87941]/5">Schedule New Transfer</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {transfersList.map(t => (
                      <div key={t.id} className="p-3 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/10 space-y-1.5">
                        <div className="flex justify-between font-bold">
                          <span>{t.assetName}</span>
                          <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[9px]">{t.status}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-500">Route: {t.from} → {t.to}</p>
                        <p className="text-[10px] text-slate-400">Carrier: {t.transport} • Dated: {t.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: WARRANTY & AMC */}
              {activeTab === 'warranty' && (
                <div className="space-y-4 pt-4 text-xs">
                  <Card className="p-4 bg-slate-50/50 dark:bg-zinc-900/10 border text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5"><Award className="h-4.5 w-4.5 text-[#f87941]" /> Coverage Schedules</p>
                    <div className="flex justify-between">
                      <span>Manufacturer Warranty Expiration:</span>
                      <span className="font-bold text-emerald-500">Active (Valid until Dec 15, 2027)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extended support contract coverage:</span>
                      <span className="font-bold">AppleCare+ Enterprise Service Contract</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>AMC Renewals alert setting:</span>
                      <span>Trigger warning 30 days prior</span>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 6: REPAIRS MAINTENANCE */}
              {activeTab === 'repairs' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-900/10 space-y-3">
                    <p className="font-bold border-b pb-1">Log Maintenance Diagnostics</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px]">Maintenance SLA Category</Label>
                        <select value={repairType} onChange={e => setRepairType(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 outline-none border-input h-9">
                          <option value="preventive">Preventive Diagnostics Check</option>
                          <option value="corrective">Corrective Repair</option>
                          <option value="emergency">Emergency Hardware replacement</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Estimated cost (INR)</Label>
                        <Input value={repairCost} onChange={e => setRepairCost(e.target.value)} type="number" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Downtime Hours</Label>
                        <Input value={repairDowntime} onChange={e => setRepairDowntime(e.target.value)} type="number" />
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9" onClick={handleLogRepair}>Log Record to history</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Historical Servicing timeline</Label>
                    {repairHistoryList.map(h => (
                      <div key={h.id} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold">{h.assetName}</p>
                          <span className="text-[10px] text-slate-500">Type: {h.type} • Downtime: {h.downtime} hrs • Date: {h.date}</span>
                        </div>
                        <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[10px]">Cost: INR {h.cost}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: SAAS LICENSES */}
              {activeTab === 'licences' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">Enterprise Adobe CC Suite Subscription</p>
                      <p className="text-[10px] text-slate-400">Linked seats: 12 assigned • 2 floating licenses available</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 font-bold border-none text-[10px]">COMPLIANT / PASS</Badge>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">JetBrains IDE Developer Seats</p>
                      <p className="text-[10px] text-slate-400">License keys: 24 active • 0 unassigned (Under-provisioned)</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 font-bold border-none text-[10px]">RENEWAL CRITICAL</Badge>
                  </div>
                </div>
              )}

              {/* TAB 8: MDM CONTROLS */}
              {activeTab === 'mdm' && (
                <div className="space-y-4 pt-4 text-xs">
                  <Button size="sm" variant="outline" className="w-full text-[#f87941] border-[#f87941]/30 hover:bg-[#f87941]/5 flex items-center justify-center gap-2 h-10 font-bold" onClick={triggerMDMWipe} disabled={wipeActive}>
                    <Cpu className="h-4 w-4" /> Trigger eSIM Remote Disk wipe lockout
                  </Button>

                  {mdmLogs.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 font-mono text-[10px] space-y-1.5 h-36 overflow-y-auto shadow-inner">
                      {mdmLogs.map((log, index) => <p key={index}>{log}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: KEYCARDS ACCESS */}
              {activeTab === 'access' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">Access Card ID: #AC-9284</p>
                      <p className="text-[10px] text-slate-400">Permissions: Floor 4 Server Room, Main Entrance Gate, Gym</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">GRANTED</Badge>
                  </div>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">Vehicle Parking Pass: #PK-409</p>
                      <p className="text-[10px] text-slate-400">Allocated slot: Basement B4-Slot 22</p>
                    </div>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">RECALL REQUEST</Badge>
                  </div>
                </div>
              )}

              {/* TAB 10: SURPRISE AUDITS */}
              {activeTab === 'audits' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="p-4 border border-[#f87941]/20 bg-[#f87941]/5 rounded-2xl flex gap-3 items-start">
                    <ShieldAlert className="h-6 w-6 text-[#f87941] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Surprise Audit Verification Simulator:</span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Admin controls to verify physical tags matches records. Click "Verify Stock" on the target devices during auditing sweeps.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {assets.map(asset => {
                      const isVerified = auditVerifiedList.includes(asset.id);
                      return (
                        <div key={asset.id} className="flex justify-between items-center p-3 border rounded-xl text-xs bg-slate-50/50 dark:bg-zinc-900/10">
                          <div>
                            <p className="font-bold">{asset.name}</p>
                            <span className="text-[10px] text-slate-400">S/N: {asset.serial_number}</span>
                          </div>
                          <div>
                            {isVerified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 font-bold border-none">VERIFIED</Badge>
                            ) : (
                              <Button size="xs" variant="outline" className="border-[#f87941]/20 text-[#f87941] hover:bg-[#f87941]/5 h-7" onClick={() => handleVerifyAssetAudit(asset)}>Verify Stock Tag</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 11: EXIT RECOVERY */}
              {activeTab === 'recovery' && (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-zinc-900/10 space-y-3">
                    <p className="font-bold border-b pb-1">Offboarding Return Handover Assessment</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px]">Accessories Return check</Label>
                        <select value={recoveryAccessoriesStatus} onChange={e => setRecoveryAccessoriesStatus(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 outline-none border-input h-9">
                          <option value="All returned">All returned & verified</option>
                          <option value="Missing charger">Missing Power adapter charger</option>
                          <option value="Damaged screen">Physical damage to screen</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Damage Deductions Fee (INR)</Label>
                        <Input value={recoveryDeductions} onChange={e => setRecoveryDeductions(e.target.value)} type="number" />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9" onClick={() => {
                        toast.success('Exit recovery data logged. Damage deductions sent to payroll Full & Final ledger.');
                      }}>Log Return Recovery & Clearance</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 12: DEPRECIATION CALCULATION */}
              {activeTab === 'depreciation' && (
                <div className="space-y-4 pt-4 text-xs">
                  <Card className="p-4 bg-slate-50/50 dark:bg-zinc-900/10 border text-xs space-y-3">
                    <p className="font-bold flex items-center gap-1.5"><DollarSign className="h-4.5 w-4.5 text-[#f87941]" /> Straight-Line Depreciation Ledger</p>
                    {selectedAsset ? (
                      <div className="space-y-2">
                        <div className="flex justify-between font-semibold border-b pb-1.5">
                          <span>Purchase Cost:</span>
                          <span>INR {Number(selectedAsset.purchaseCost || 120000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Depreciation Method:</span>
                          <span>Straight Line (5-Year Lifespan)</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100">
                          <span>Annual Depreciation expense:</span>
                          <span>INR {Math.round(Number(selectedAsset.purchaseCost || 120000) / 5).toLocaleString()} / year</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#f87941] border-t pt-2 mt-2">
                          <span>Remaining Book Value (Year 2):</span>
                          <span>INR {Math.round(Number(selectedAsset.purchaseCost || 120000) * 0.6).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="italic text-slate-400">Choose an asset target to run calculations.</p>
                    )}
                  </Card>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
