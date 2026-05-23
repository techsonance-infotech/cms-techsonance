'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, MapPin, Search, SlidersHorizontal, Download, 
  MoreVertical, Home, BedDouble, Bath, Square, 
  Trees, Eye, Share2, Maximize2, Map
} from 'lucide-react';

export default function PropertyListingsManagement() {
  const [selectedProperty, setSelectedProperty] = useState(2);

  const properties = [
    {
      id: 1,
      title: "Skyline Penthouse 402",
      location: "Financial District, New York",
      status: "Available",
      price: "$2,450,000",
      trend: "+$12k this month",
      agent: "Marcus Thorne",
      updated: "2 hours ago",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Oakwood Manor Estate",
      location: "Greenwich, Connecticut",
      status: "Under Contract",
      price: "$5,890,000",
      trend: "Stable",
      agent: "Elena Rodriguez",
      updated: "Yesterday, 4:15 PM",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "The Glass Studio Loft",
      location: "SoHo, New York",
      status: "Sold",
      price: "$1,120,000",
      trend: "-4% vs Ask",
      agent: "John Daltry",
      updated: "3 days ago",
      image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "Harbor View Residence",
      location: "Miami, Florida",
      status: "Available",
      price: "$3,200,000",
      trend: "New Listing",
      agent: "Samuel Lee",
      updated: "5 hours ago",
      image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      
      {/* Filters Header */}
      <div className="p-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Property Inventory</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage and monitor 1,248 active listings across all regions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-64 bg-slate-100 dark:bg-zinc-950 border-none font-semibold" placeholder="Search properties..." />
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-zinc-950 rounded-lg p-1">
            <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-800 shadow-sm text-sm font-bold">All</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-slate-900 dark:hover:text-white font-semibold">Available</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-slate-900 dark:hover:text-white font-semibold">Pending</Button>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>
          <Button variant="outline" className="gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
          </Button>
          <Button variant="outline" className="gap-2 font-semibold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Table Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900 z-10 shadow-sm">
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider">Property Details</th>
                  <th className="px-4 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider">Market Price</th>
                  <th className="px-4 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider">Assigned Agent</th>
                  <th className="px-4 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-xs uppercase text-muted-foreground font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-950">
                
                {properties.map((prop) => (
                  <tr 
                    key={prop.id} 
                    onClick={() => setSelectedProperty(prop.id)}
                    className={`transition-colors cursor-pointer group ${
                      selectedProperty === prop.id 
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' 
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-900 border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden relative shadow-sm">
                          <Image src={prop.image} alt={prop.title} fill className="object-cover" />
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${selectedProperty === prop.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                            {prop.title}
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {prop.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className={`
                        ${prop.status === 'Available' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                        ${prop.status === 'Under Contract' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                        ${prop.status === 'Sold' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                        font-bold border-none
                      `}>
                        {prop.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">{prop.price}</div>
                      <div className={`text-[11px] font-semibold mt-0.5 
                        ${prop.trend.includes('-') ? 'text-rose-500' : 'text-emerald-500'}
                        ${prop.trend.includes('Stable') || prop.trend.includes('New') ? 'text-slate-500' : ''}
                      `}>
                        {prop.trend}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {prop.agent.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{prop.agent}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-muted-foreground">{prop.updated}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
          
          {/* Table Pagination/Footer */}
          <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Showing 1-4 of 1,248 properties</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 font-bold">Previous</Button>
              <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-600 font-bold">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 font-bold">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 font-bold">3</Button>
              <span className="px-2 text-muted-foreground font-bold">...</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 font-bold">84</Button>
              <Button variant="outline" size="sm" className="h-8 font-bold">Next</Button>
            </div>
          </div>
        </div>

        {/* Map Sidebar Preview */}
        <aside className="w-[380px] bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 hidden xl:flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-indigo-500" /> Listing Preview
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Map Placeholder */}
            <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-zinc-950 rounded-xl overflow-hidden relative border border-slate-200 dark:border-zinc-800 group shadow-sm">
              <Image 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
                alt="Map" 
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute top-2 right-2 bg-white dark:bg-zinc-900 p-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 cursor-pointer hover:bg-slate-50">
                <Maximize2 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
                  <Home className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Selected Property Summary */}
            <div className="space-y-4">
              <div>
                <div className="text-xs text-indigo-600 font-black uppercase tracking-widest mb-1">Selected Listing</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Oakwood Manor Estate</h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">450 Oak Ridge Dr, Greenwich, CT 06830</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Bedrooms</div>
                  <div className="font-black text-lg flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <BedDouble className="h-4 w-4 text-indigo-500" /> 6
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Bathrooms</div>
                  <div className="font-black text-lg flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Bath className="h-4 w-4 text-indigo-500" /> 4.5
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Area (sq ft)</div>
                  <div className="font-black text-lg flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Square className="h-4 w-4 text-indigo-500" /> 8,420
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl shadow-sm">
                  <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Lot Size</div>
                  <div className="font-black text-lg flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Trees className="h-4 w-4 text-indigo-500" /> 2.4 ac
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Sales Performance</span>
                  <span className="text-emerald-600 font-black text-sm">+18.4%</span>
                </div>
                <div className="h-2 w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-4/5 rounded-full"></div>
                </div>
                <div className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Market demand is currently high in this sector.</div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 text-sm shadow-md">
                  <Eye className="h-4 w-4" /> Public Listing View
                </Button>
                <Button variant="outline" className="w-full h-11 font-bold gap-2 text-sm border-slate-200 dark:border-zinc-800">
                  <Share2 className="h-4 w-4 text-indigo-600" /> Share Assets
                </Button>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
