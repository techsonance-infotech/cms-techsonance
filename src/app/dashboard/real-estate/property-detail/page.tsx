'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, MapPin, Edit, Share2, Image as ImageIcon, 
  Video, TrendingUp, ChevronRight, UserCircle2, 
  Maximize2, DoorOpen, Layers, Car, CheckCircle2, 
  Wifi, Zap, Shield, Map, Maximize, FileText, 
  FileSpreadsheet, Scale, Download
} from 'lucide-react';

export default function PropertyDetailView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Breadcrumbs & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium">
            <span>Inventory</span>
            <ChevronRight className="h-4 w-4" />
            <span>Properties</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-indigo-600 font-semibold">PROP-9821-XL</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Summit Ridge Corporate Tower
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
              <MapPin className="h-4 w-4 text-slate-500" /> 
              1200 Avenue of the Americas, New York, NY
            </span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
              ACTIVE LISTING
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Edit className="h-4 w-4" /> Edit Property
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Share2 className="h-4 w-4" /> Share Listing
          </Button>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Main Image Gallery */}
        <Card className="col-span-12 lg:col-span-8 overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-0">
          <div className="flex-1 relative group cursor-pointer min-h-[400px]">
            <Image 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
              alt="Summit Ridge Corporate Tower" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button variant="secondary" size="sm" className="bg-black/50 backdrop-blur-md text-white hover:bg-black/70 border-none gap-2">
                <ImageIcon className="h-4 w-4" /> 12 Photos
              </Button>
              <Button variant="secondary" size="sm" className="bg-black/50 backdrop-blur-md text-white hover:bg-black/70 border-none gap-2">
                <Video className="h-4 w-4" /> 3D Tour
              </Button>
            </div>
          </div>
          <div className="h-24 grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1">
            <div className="relative h-full w-full rounded overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" alt="Lobby" fill className="object-cover hover:opacity-80 transition-opacity cursor-pointer" />
            </div>
            <div className="relative h-full w-full rounded overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2069&auto=format&fit=crop" alt="Office" fill className="object-cover hover:opacity-80 transition-opacity cursor-pointer" />
            </div>
            <div className="relative h-full w-full rounded overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1572025442646-866d16c84a54?q=80&w=2070&auto=format&fit=crop" alt="Conference" fill className="object-cover hover:opacity-80 transition-opacity cursor-pointer" />
            </div>
            <div className="relative h-full w-full rounded overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer group">
              <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" alt="More" fill className="object-cover grayscale opacity-40 group-hover:opacity-50 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm">
                +8 more
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Snapshot & Lead Tracking */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm font-semibold mb-2">Listing Price</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">$14,250,000</h2>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold">
                  <TrendingUp className="h-3 w-3" /> 4.2%
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 font-medium">Est. $92,000 /mo mortgage</p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Price / Sq Ft</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">$1,187</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Lot Size</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">0.85 Acres</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800 flex-1">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Lead Pipeline</CardTitle>
                <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">JD</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Jonathan Doe</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Initial Inquiry • 2h ago</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">SM</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Sarah Miller</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Viewing Scheduled • 5h ago</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-60 grayscale">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">RK</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Ray Knight</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Dormant • 2d ago</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              </div>

              <Button className="w-full mt-2" variant="outline">
                Add New Lead
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Property Specifications */}
        <Card className="col-span-12 lg:col-span-7 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Property Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Maximize2 className="h-5 w-5 text-indigo-500" />
                  <p className="text-sm font-medium">Total Area</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">12,000 sq ft</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DoorOpen className="h-5 w-5 text-indigo-500" />
                  <p className="text-sm font-medium">Suites</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">24 Units</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  <p className="text-sm font-medium">Floors</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">12 Storeys</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-5 w-5 text-indigo-500" />
                  <p className="text-sm font-medium">Parking</p>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">120 Spots</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-bold mb-3 uppercase tracking-widest text-muted-foreground">Description</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                The Summit Ridge Corporate Tower represents the pinnacle of modern commercial infrastructure. Featuring LEED Platinum certification and state-of-the-art climate control systems, this property offers premium visibility in the heart of the financial district. Built in 2022, it boasts a reinforced glass curtain wall and an expansive rooftop terrace equipped for high-end corporate events.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> LEED Platinum
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Wifi className="h-4 w-4 text-blue-500" /> Fiber-Optic Ready
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Zap className="h-4 w-4 text-amber-500" /> EV Charging
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Shield className="h-4 w-4 text-rose-500" /> 24/7 Security
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Map Section */}
        <Card className="col-span-12 lg:col-span-5 shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Location</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Map className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <div className="flex-1 relative min-h-[300px] bg-slate-200 dark:bg-slate-800">
            {/* Map Placeholder Image */}
            <Image 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
              alt="Map View" 
              fill
              className="object-cover opacity-90 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-[200px]">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Midtown Manhattan</p>
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Transit Score: 98/100</p>
            </div>
          </div>
        </Card>

        {/* Legal & Financial Documents */}
        <Card className="col-span-12 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Associated Documents</CardTitle>
            <Button variant="link" className="text-indigo-600 font-semibold gap-2">
              <Download className="h-4 w-4" /> Upload New Document
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Property_Deed_v2.pdf</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Legal • 4.2 MB • Oct 12, 2023</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">FY2023_Revenue_Forecast.xlsx</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Financial • 1.1 MB • Nov 01, 2023</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Zoning_Clearance_Cert.pdf</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Compliance • 2.8 MB • Sep 24, 2023</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
