'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  ChevronRight, 
  Download, 
  Search, 
  ArrowUpRight, 
  Clock, 
  Users, 
  MapPin, 
  ChevronDown, 
  Bookmark, 
  FileText,
  School,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface WaitlistItem {
  id: string;
  course: string;
  count: number;
  status: string;
}

interface StudentCohort {
  id: string;
  name: string;
  status: 'Enrolled' | 'Pending' | 'On Probation';
  standing: string;
  progress: number;
  gpa: number;
}

export default function CurriculumPage() {
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([
    { id: 'W-01', course: 'Intro to AI (CS101)', count: 42, status: 'High Demand' },
    { id: 'W-02', course: 'Advanced Bio-Med Systems', count: 12, status: 'Normal' }
  ]);

  const [cohort, setCohort] = useState<StudentCohort[]>([
    { id: 'NX-90210', name: 'Alex Sterling', status: 'Enrolled', standing: 'Clear', progress: 85, gpa: 3.8 },
    { id: 'NX-88432', name: 'Maya Kapoor', status: 'Pending', standing: 'Balance Due', progress: 60, gpa: 3.2 },
    { id: 'NX-77219', name: 'Julian O\'Conner', status: 'Enrolled', standing: 'Clear', progress: 92, gpa: 4.0 }
  ]);

  const [openDepts, setOpenDepts] = useState<{ [key: string]: boolean }>({
    cs: true,
    biotech: false,
    engineering: false
  });

  const [search, setSearch] = useState('');

  const toggleDept = (dept: string) => {
    setOpenDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const handleExport = () => {
    toast.success('Curriculum enrollment ledger exported successfully as CSV!');
  };

  const handleWizard = () => {
    toast.success('Launching Nexus Academic Course Creation Wizard...');
  };

  const handleWaitlistRow = (course: string) => {
    toast.info(`Opening priority resolution workflow for ${course}...`);
  };

  const handleStudentDetails = (name: string) => {
    toast.info(`Navigating to student file: ${name}`);
  };

  const filteredCohort = cohort.filter(student => 
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Nav Breadcrumbs */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-xs tracking-wider uppercase">
          <span>Nexus Academic Console</span>
          <span>/</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Curriculum &amp; Enrollment</span>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold uppercase text-[10px]">
            Academic Registry Online
          </Badge>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Curriculum &amp; Registration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage course scheduling, waitlists, department trees, and student cohorts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="font-semibold text-xs flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button onClick={handleWizard} size="sm" className="bg-brand-gradient hover:opacity-90 text-white font-bold text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> New Course Wizard
          </Button>
        </div>
      </div>

      {/* Main Grid: Pulse Chart and Side Widgets */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Pulse Chart (Lg Span) */}
        <Card className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Enrollment Pulse</h3>
              <p className="text-xs text-slate-400">Student sign-up trajectory for Fall Semester 2024</p>
            </div>
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950 text-xs font-semibold">
              <button className="px-3 py-1 bg-white dark:bg-slate-900 text-primary dark:text-primary-light rounded shadow-sm">Daily</button>
              <button className="px-3 py-1 text-slate-400">Weekly</button>
              <button className="px-3 py-1 text-slate-400">Monthly</button>
            </div>
          </div>

          <div className="h-48 w-full flex items-end gap-2 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
              <div className="border-b border-slate-100 dark:border-slate-800 w-full h-0"></div>
              <div className="border-b border-slate-100 dark:border-slate-800 w-full h-0"></div>
              <div className="border-b border-slate-100 dark:border-slate-800 w-full h-0"></div>
            </div>
            <div className="flex-1 bg-primary-light/10 hover:bg-primary-light/20 dark:bg-primary-light/5 rounded-t-lg h-[40%] group relative transition-all" />
            <div className="flex-1 bg-primary-light/20 hover:bg-primary-light/30 dark:bg-primary-light/10 rounded-t-lg h-[55%] group relative transition-all" />
            <div className="flex-1 bg-primary-light/25 hover:bg-primary-light/35 dark:bg-primary-light/10 rounded-t-lg h-[45%] group relative transition-all" />
            <div className="flex-1 bg-primary-light/40 hover:bg-primary-light/50 dark:bg-primary-light/15 rounded-t-lg h-[70%] group relative transition-all" />
            <div className="flex-1 bg-primary-light/60 hover:bg-primary-light/70 dark:bg-primary-light/20 rounded-t-lg h-[60%] group relative transition-all" />
            <div className="flex-1 bg-primary-light/80 hover:bg-primary-light/90 dark:bg-primary-light/25 rounded-t-lg h-[85%] group relative transition-all" />
            <div className="flex-1 bg-primary hover:brightness-95 dark:bg-primary rounded-t-lg h-[95%] group relative transition-all" />
          </div>
          <div className="flex justify-between px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </Card>

        {/* Quick Stats Sidebar (Sm Span) */}
        <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
          
          {/* Active Students */}
          <div className="bg-gradient-to-br from-slate-900 to-primary-dark text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="relative z-10 space-y-1">
              <span className="text-primary-light font-extrabold text-[10px] uppercase tracking-wider">Active Students</span>
              <h3 className="text-3xl font-extrabold text-white">24,812</h3>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <ArrowUpRight className="h-4 w-4" /> <span>+12.4% vs last semester</span>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
              <Users className="h-32 w-32" />
            </div>
          </div>

          {/* Waitlist Management */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                <span>Waitlist Priorities</span>
                <Clock className="h-4 w-4 text-primary" />
              </h3>
              <div className="space-y-3 mt-4">
                {waitlist.map((w) => (
                  <div 
                    key={w.id} 
                    onClick={() => handleWaitlistRow(w.course)}
                    className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{w.course}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{w.count} students in pipeline</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
            <button className="text-primary dark:text-primary-light text-xs font-bold text-center mt-4 hover:underline">
              Resolve Waitlists
            </button>
          </Card>

        </div>

      </div>

      {/* Curriculum Trees collapsible & Student Dossiers Cohorts */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Collapsible Departments Tree (Side Column) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Collapsible Curriculum Tree</h3>
          </div>
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 space-y-2 shadow-sm">
            
            {/* Dept: CS */}
            <div className="space-y-1">
              <div 
                onClick={() => toggleDept('cs')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-primary-light/10 hover:text-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-850 dark:text-slate-200">
                  <School className="h-4 w-4 text-primary" />
                  <span>Dept. of Computer Science</span>
                </div>
                {openDepts.cs ? <ChevronDown className="h-4 w-4 text-slate-450" /> : <ChevronRight className="h-4 w-4 text-slate-450" />}
              </div>
              
              {openDepts.cs && (
                <div className="pl-6 space-y-1 mt-1 transition-all">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs text-slate-650 dark:text-slate-400 font-semibold">CS101: Intro to AI</span>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-none font-bold text-[8px] uppercase">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs text-slate-650 dark:text-slate-400 font-semibold">CS204: Advanced Data Systems</span>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-none font-bold text-[8px] uppercase">Active</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Dept: Biotech */}
            <div className="space-y-1">
              <div 
                onClick={() => toggleDept('biotech')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-primary-light/10 hover:text-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-850 dark:text-slate-200">
                  <School className="h-4 w-4 text-primary" />
                  <span>Dept. of Biotechnology</span>
                </div>
                {openDepts.biotech ? <ChevronDown className="h-4 w-4 text-slate-450" /> : <ChevronRight className="h-4 w-4 text-slate-450" />}
              </div>
              
              {openDepts.biotech && (
                <div className="pl-6 space-y-1 mt-1 transition-all">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs text-slate-650 dark:text-slate-400 font-semibold">BIO-401: Genetic Mapping</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[8px] uppercase">Active</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Dept: Engineering */}
            <div className="space-y-1">
              <div 
                onClick={() => toggleDept('engineering')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-primary-light/10 hover:text-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-850 dark:text-slate-200">
                  <School className="h-4 w-4 text-primary" />
                  <span>Dept. of Engineering</span>
                </div>
                {openDepts.engineering ? <ChevronDown className="h-4 w-4 text-slate-450" /> : <ChevronRight className="h-4 w-4 text-slate-450" />}
              </div>
              
              {openDepts.engineering && (
                <div className="pl-6 space-y-1 mt-1 transition-all">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs text-slate-650 dark:text-slate-400 font-semibold">ENG-102: Basic Statics</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[8px] uppercase">Active</Badge>
                  </div>
                </div>
              )}
            </div>

          </Card>
        </div>

        {/* Student Cohort Register List (Main Column) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Active Student Cohort</h2>
            <div className="relative max-w-xs w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs" 
                placeholder="Search cohort..." 
              />
            </div>
          </div>

          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Standing</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GPA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredCohort.map((student) => (
                    <tr 
                      key={student.id} 
                      onClick={() => handleStudentDetails(student.name)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-primary">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">ID: {student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.status === 'Enrolled' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold text-[9px] uppercase tracking-wide">
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none font-bold text-[9px] uppercase tracking-wide animate-pulse">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${student.standing === 'Clear' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {student.standing}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Progress value={student.progress} className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 [&>div]:bg-primary" />
                          <span className="font-bold font-mono text-slate-700 dark:text-slate-350">{student.gpa} GPA</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">
                  Showing {filteredCohort.length} of {cohort.length} students
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled>
                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-primary text-white border-primary hover:bg-primary-dark">
                    <span>1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
