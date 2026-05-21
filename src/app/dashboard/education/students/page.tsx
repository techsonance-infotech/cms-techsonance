'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  CalendarDays, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  Download, 
  Edit3, 
  Wallet, 
  Clock, 
  Search, 
  ChevronDown, 
  UserCheck, 
  AlertTriangle,
  Award,
  Users,
  Star
} from 'lucide-react';

interface TranscriptItem {
  id: string;
  name: string;
  instructor: string;
  credits: number;
  grade: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
}

interface DirectoryStudent {
  id: string;
  name: string;
  initials: string;
  cohort: string;
  gpa: number;
  status: 'ACTIVE' | 'PROBATION';
}

export default function StudentDashboardPage() {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([
    { id: 'CS-401-A', name: 'Advanced Data Structures', instructor: 'Dr. Robert Chen', credits: 4.0, grade: 'A+', status: 'COMPLETED' },
    { id: 'UX-302-B', name: 'Human-Computer Interaction', instructor: 'Prof. Sarah Jenkins', credits: 3.0, grade: 'A', status: 'COMPLETED' },
    { id: 'CS-305-C', name: 'Database Systems & Logic', instructor: 'Dr. Marcus Thorne', credits: 4.0, grade: '—', status: 'IN_PROGRESS' }
  ]);

  const [students, setStudents] = useState<DirectoryStudent[]>([
    { id: 'NX-90201', name: 'Liam Gallagher', initials: 'LG', cohort: 'Cohort A', gpa: 3.75, status: 'ACTIVE' },
    { id: 'NX-88402', name: 'Anya Volkov', initials: 'AV', cohort: 'Cohort B', gpa: 4.0, status: 'ACTIVE' },
    { id: 'NX-77203', name: 'Jameson Wu', initials: 'JW', cohort: 'Cohort A', gpa: 2.1, status: 'PROBATION' },
    { id: 'NX-90104', name: 'Chloe Bennet', initials: 'CB', cohort: 'Cohort B', gpa: 3.2, status: 'ACTIVE' }
  ]);

  const handleExportRecord = () => {
    toast.success('Dossier and certified academic record exported as signed PDF!');
  };

  const handleModifyEnrollment = () => {
    toast.success('Opening academic program modifications wizard...');
  };

  const handleInvoice = () => {
    toast.success('Tuition balance invoice successfully sent to Elena Rodriguez!');
  };

  const handleDossierClick = (name: string) => {
    toast.info(`Switched focus to student file: ${name}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-xs tracking-wider uppercase">
          <span>Academic Command Center</span>
          <span>/</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Student Profiles</span>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-none font-bold uppercase text-[10px]">
            Academic Year 2023/24
          </Badge>
        </div>
      </div>

      {/* Header Profile Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Student Dossier: Elena Rodriguez
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Program: B-Advanced Computer Science • Counselor Assigned: Dr. Robert Chen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportRecord} variant="outline" size="sm" className="font-semibold text-xs flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Record
          </Button>
          <Button onClick={handleModifyEnrollment} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2">
            <Edit3 className="h-4 w-4" /> Modify Enrollment
          </Button>
        </div>
      </div>

      {/* Grid: Profile Dossier Left, Performance Right */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Bio Dossier Card (Left Span) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          
          {/* Card: Demographic */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-bl-full pointer-events-none"></div>
            
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 rounded-full flex items-center justify-center font-black text-2xl text-indigo-600">
              ER
            </div>
            
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white text-base">Elena Rodriguez</h3>
              <p className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">SID: 2024-UX-4829</p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-none font-bold text-[8px] uppercase tracking-wide">Active</Badge>
              <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 border-none font-bold text-[8px] uppercase tracking-wide">Dean&apos;s List</Badge>
            </div>

            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Current GPA</span>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">3.92</h4>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Credits</span>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">114/120</h4>
              </div>
            </div>
          </Card>

          {/* Card: Tuition & Invoices */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex justify-between items-center">
              <span>Financial Status</span>
              <Wallet className="h-4 w-4 text-indigo-500" />
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pending Balance</span>
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">$2,450.00</h4>
                </div>
                <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 border-none font-bold text-[8px] uppercase animate-pulse">Overdue 4d</Badge>
              </div>
              <div className="space-y-1">
                <Progress value={82} className="h-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>Tuition Paid: $24,000</span>
                  <span>82% Paid</span>
                </div>
              </div>
              <Button onClick={handleInvoice} variant="outline" size="sm" className="w-full text-xs font-bold py-2 h-9 mt-4">
                Generate Invoice
              </Button>
            </div>
          </Card>

        </div>

        {/* Performance details (Right Span) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance Rate</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">98.2%</h4>
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Academic Rank</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Top 5%</h4>
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Compl. Modules</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">32 Programs</h4>
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Behavior Rating</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Exemplary</h4>
              </div>
            </Card>

          </div>

          {/* Transcript table */}
          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Academic Transcript Records</h3>
                <select className="bg-white border-slate-200 rounded py-1 px-2 text-xs focus:ring-indigo-500">
                  <option>Fall Semester 2023</option>
                  <option>Spring Semester 2023</option>
                </select>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course Module</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Credit Hours</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Grade Issued</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {transcript.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5">Code: {item.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                        {item.instructor}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-350">
                        {item.credits.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{item.grade}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'COMPLETED' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-none font-bold text-[9px] uppercase tracking-wider">Completed</Badge>
                        ) : (
                          <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 border-none font-bold text-[9px] uppercase tracking-wider animate-pulse">In Progress</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Grid: 30-Day Attendance heatmap, Behavioral logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Heatmap */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-6">Attendance Density (Last 30 Days)</h4>
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Generate 28 mock squares */}
                  {Array.from({ length: 28 }).map((_, i) => {
                    let bg = 'bg-emerald-500';
                    if (i === 10) bg = 'bg-rose-500';
                    else if (i === 4 || i === 15) bg = 'bg-emerald-300';
                    else if (i % 7 === 5 || i % 7 === 6) bg = 'bg-slate-100 dark:bg-slate-800'; // Weekend
                    return (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-sm ${bg}`} 
                        title={`Day ${i + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-300"></span> Late</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent</span>
              </div>
            </Card>

            {/* Behavioral Logs */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">Behavioral Logs</h4>
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                      <Award className="h-4 w-4" /> Academic Excellence
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400">Exceptional first-place finish at the regional Fall Hackathon.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-500 space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-800 dark:text-indigo-400 font-bold text-xs">
                      <Users className="h-4 w-4" /> Leadership Commendation
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400">Elected unanimously as Cohort CS-401 Group Representative.</p>
                  </div>
                </div>
              </div>
            </Card>

          </div>

        </div>

      </div>

      {/* Directory Grid (Bottom) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Student Directory</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {students.map((student) => (
            <Card 
              key={student.id} 
              onClick={() => handleDossierClick(student.name)}
              className="p-4 border border-slate-150 dark:border-slate-800 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-slate-950 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600">
                  {student.initials}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-indigo-600 transition-colors">
                    {student.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {student.cohort} • <span className="font-bold font-mono text-slate-700 dark:text-slate-350">{student.gpa} GPA</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
