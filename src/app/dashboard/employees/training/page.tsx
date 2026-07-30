'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  BookOpen, Award, CheckCircle2, Plus, Clock, ShieldCheck, GraduationCap, ChevronRight, Table, Sparkles,
  Calendar, Search, Filter, Check, X, ShieldAlert, Cpu, Share2, History, FileText, FileSignature, 
  MapPin, UserCheck, BarChart4, DollarSign, Users, Timer, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function TrainingAndSkillsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Multi-tab active selection
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalogue' | 'schedules' | 'enrolments' | 'competency' | 'certifications' | 'instructors' | 'audits'>('dashboard');

  // Course Form
  const [progTitle, setProgTitle] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progInstructor, setProgInstructor] = useState('');
  const [progHours, setProgHours] = useState('');
  const [progCode, setProgCode] = useState('');
  const [progCategory, setProgCategory] = useState('Technical');
  const [progSubcat, setProgSubcat] = useState('');
  const [progDifficulty, setProgDifficulty] = useState('Intermediate');
  const [progAudience, setProgAudience] = useState('');
  const [progMethod, setProgMethod] = useState('Self-Paced');
  const [progValidity, setProgValidity] = useState('365');
  const [progCredits, setProgCredits] = useState('2');
  const [progCostCentre, setProgCostCentre] = useState('');
  const [progPricing, setProgPricing] = useState('0');
  const [progPassCriteria, setProgPassCriteria] = useState('70');

  // Session Form
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [sessStart, setSessStart] = useState('');
  const [sessEnd, setSessEnd] = useState('');
  const [sessVenue, setSessVenue] = useState('');
  const [sessLink, setSessLink] = useState('');
  const [sessCapacity, setSessCapacity] = useState('20');
  const [sessWaitlist, setSessWaitlist] = useState('5');
  const [sessions, setSessions] = useState<any[]>([]);

  // Enrollment Nomination Form
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [selectedProgId, setSelectedProgId] = useState<number | null>(null);
  const [selectedSessId, setSelectedSessId] = useState<number | null>(null);
  const [enrolType, setEnrolType] = useState('self');

  // Skill Competency Framework Form
  const [compDesignation, setCompDesignation] = useState('Senior Software Engineer');
  const [compSkillName, setCompSkillName] = useState('');
  const [compRequiredLevel, setCompRequiredLevel] = useState('advanced');

  // Skill Profile Matrix Add Form
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [skillExp, setSkillExp] = useState('');

  // Instructor Form
  const [instName, setInstName] = useState('');
  const [instQuals, setInstQuals] = useState('');
  const [instRate, setInstRate] = useState('50');
  const [instAvailability, setInstAvailability] = useState('Available');

  // Certification Upload Form
  const [certEmployeeId, setCertEmployeeId] = useState<number | null>(null);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certCredId, setCertCredId] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certFileUrl, setCertFileUrl] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificationsList, setCertificationsList] = useState<any[]>([]);

  // Interactive Timed Quiz Simulator
  const [quizActive, setQuizActive] = useState(false);
  const [quizTimer, setQuizTimer] = useState(60);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const mockQuestions = [
    { id: 1, text: "Which Supabase feature enables secure, row-level access control rules in PostgreSQL database tables?", options: ["PostgREST", "Realtime API", "Row Level Security (RLS)", "Edge Functions"], correct: "Row Level Security (RLS)" },
    { id: 2, text: "What is the recommended method for handling multi-tenant isolation schemas in enterprise CRM tables?", options: ["Separate DB instances", "tenant_id columns with strict RLS policies", "Materialized Views", "Dotted line tables"], correct: "tenant_id columns with strict RLS policies" },
    { id: 3, text: "Under SOC2 & ISO 27001 compliance standards, where should user data access and decryption activities be logged?", options: ["Console logger", "Immutable database forensic audit tables", "Client cookies", "Vercel deployments log"], correct: "Immutable database forensic audit tables" }
  ];

  // Geolocation and Biometric Simulation
  const [simulatingBiometric, setSimulatingBiometric] = useState(false);
  const [gpsCoords, setGpsCoords] = useState({ lat: 21.1702, lng: 72.8311 }); // Surat, India Default coords

  const handleViewFile = async (e: React.MouseEvent, fileUrl: string) => {
    e.preventDefault();
    if (!fileUrl) return;

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const token = getStoredSessionToken();
      const res = await fetch(fileUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to resolve secure download link');
      const data = await res.json();
      const signedUrl = data.data?.url || data.url;
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not retrieve secure download link');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open file');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = getStoredSessionToken();
    let empList: any[] = [];

    // 1. Fetch employees (crucial for dropdown mapping)
    try {
      const employeesRes = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        empList = employeesData.data || [];
        setEmployees(empList);
        if (empList.length > 0) {
          setSelectedEmpId(empList[0].id);
          setCertEmployeeId(empList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }

    // 2. Fetch programs
    try {
      const programsRes = await fetch('/api/training/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPrograms(programsData);
        if (programsData.length > 0) {
          setSelectedProgId(programsData[0].id);
          setSelectedCourseId(programsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load programs:', err);
    }

    // 3. Fetch enrollments
    try {
      const enrollmentsRes = await fetch('/api/training/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData);
      }
    } catch (err) {
      console.error('Failed to load enrollments:', err);
    }

    // 4. Fetch instructors
    try {
      const instRes = await fetch('/api/training/instructors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstructors(instData);
        if (instData.length > 0) {
          setSelectedTrainerId(instData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load instructors:', err);
    }

    // 5. Fetch sessions
    try {
      const sessionsRes = await fetch('/api/training/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
        if (sessionsData.length > 0) {
          setSelectedSessId(sessionsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }

    // 6. Fetch competency framework
    try {
      const compRes = await fetch('/api/training/competencies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompetencies(compData);
      }
    } catch (err) {
      console.error('Failed to load competencies:', err);
    }

    // 7. Fetch skills and certifications for default selected employee
    if (empList.length > 0) {
      try {
        await fetchSkills(empList[0].id);
        await fetchCertifications(empList[0].id);
      } catch (err) {
        console.error('Failed to load initial employee profiles:', err);
      }
    }

    // 8. Fetch audit logs
    try {
      const auditsRes = await fetch('/api/training/audits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAuditLogs(auditsData);
      }
    } catch (err) {
      console.error('Failed to load audits:', err);
    }

    setLoading(false);
  };

  const fetchSkills = async (empId: number) => {
    try {
      const token = getStoredSessionToken();
      const skillsRes = await fetch(`/api/skills/matrix?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const skillsData = await skillsRes.json();
      setSkills(skillsData);
    } catch {
      toast.error('Failed to load skills matrix');
    }
  };

  const fetchCertifications = async (empId: number) => {
    try {
      const token = getStoredSessionToken();
      const certRes = await fetch(`/api/documents?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const certData = await certRes.json();
      setCertificationsList(Array.isArray(certData) ? certData : (certData.data || []));
    } catch {
      toast.error('Failed to load certifications');
    }
  };

  const handleEmployeeFocusChange = async (empId: number) => {
    setSelectedEmpId(empId);
    setCertEmployeeId(empId);
    
    // Fetch skills
    await fetchSkills(empId);
    
    // Fetch certifications
    await fetchCertifications(empId);

    // Fetch enrollments filtered by this employee
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/training/enrollments?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEnrollments(data);
    } catch {
      toast.error('Failed to load enrollments');
    }
  };

  // 1. Create Program catalogue course
  const createProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: progTitle,
          description: progDesc,
          instructor: progInstructor,
          durationHours: progHours ? Number(progHours) : null,
          code: progCode,
          category: progCategory,
          subcategory: progSubcat,
          difficultyLevel: progDifficulty,
          targetAudience: progAudience,
          deliveryMethod: progMethod,
          validityPeriod: Number(progValidity),
          ceCredits: Number(progCredits),
          costCentre: progCostCentre,
          pricing: Number(progPricing),
          passingCriteria: Number(progPassCriteria)
        })
      });
      if (res.ok) {
        toast.success('LMS Catalogue Course Published successfully!');
        setProgTitle('');
        setProgDesc('');
        setProgInstructor('');
        setProgHours('');
        setProgCode('');
        setProgSubcat('');
        setProgCostCentre('');
        // Log Audit Event
        await logAuditEvent('CoursePublished', { title: progTitle, code: progCode });
        fetchData();
      } else {
        toast.error('Failed to publish course program');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Create class session
  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !sessStart || !sessEnd) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: selectedCourseId,
          trainerId: selectedTrainerId,
          startDate: new Date(sessStart).toISOString(),
          endDate: new Date(sessEnd).toISOString(),
          venue: sessVenue,
          meetingLink: sessLink,
          capacity: Number(sessCapacity),
          waitlistLimit: Number(sessWaitlist)
        })
      });
      if (res.ok) {
        toast.success('Session Scheduled successfully!');
        setSessStart('');
        setSessEnd('');
        setSessVenue('');
        setSessLink('');
        // Log Audit Event
        await logAuditEvent('SessionCreated', { courseId: selectedCourseId, venue: sessVenue });
        fetchData();
      } else {
        toast.error('Failed to create session');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Nominate / Enrol Employee
  const enrollEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedProgId) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: selectedProgId,
          employeeId: selectedEmpId,
          sessionId: selectedSessId || null,
          status: 'enrolled',
          progressPercentage: 0,
          enrolmentType: enrolType
        })
      });
      if (res.ok) {
        toast.success('Employee Enrolled & Nominated successfully!');
        // Log Audit Event
        await logAuditEvent('EmployeeEnrolled', { employeeId: selectedEmpId, courseId: selectedProgId });
        fetchData();
      } else {
        toast.error('Failed to nominate employee');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Competency Framework Requirement
  const createCompetencyRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compSkillName || !compDesignation) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/competencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          designation: compDesignation,
          skillName: compSkillName,
          requiredLevel: compRequiredLevel
        })
      });
      if (res.ok) {
        toast.success('Designation Competency constraint registered!');
        setCompSkillName('');
        // Log Audit Event
        await logAuditEvent('CompetencyValidated', { designation: compDesignation, skill: compSkillName });
        fetchData();
      } else {
        toast.error('Failed to save competency rule');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Add Skill Matrix records
  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName || !selectedEmpId) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/skills/matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          skillName,
          proficiencyLevel: skillLevel,
          yearsOfExperience: skillExp ? Number(skillExp) : 0
        })
      });
      if (res.ok) {
        toast.success('Skill record mapped in matrix!');
        setSkillName('');
        setSkillExp('');
        // Log Audit Event
        await logAuditEvent('SkillUpdated', { employeeId: selectedEmpId, skill: skillName });
        fetchSkills(selectedEmpId);
      } else {
        toast.error('Failed to save skill entry');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Add Instructor Registry
  const addInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: instName,
          qualifications: instQuals,
          hourlyRate: Number(instRate),
          availability: instAvailability
        })
      });
      if (res.ok) {
        toast.success('Instructor registered in directory!');
        setInstName('');
        setInstQuals('');
        // Log Audit Event
        await logAuditEvent('TrainerAssigned', { name: instName });
        fetchData();
      } else {
        toast.error('Failed to register instructor');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Local Certifications Upload
  const handleCertFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const mimeType = file.type;
    
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                    fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                    
    const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
    
    if (!isImage && !isPdf && !isDocx) {
      toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.');
      return;
    }
    
    const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > fileLimit) {
      toast.error(`File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`);
      return;
    }

    try {
      setUploadingCert(true);
      const token = getStoredSessionToken();
      const payload = new FormData();
      payload.append('file', file);
      payload.append('kind', 'employee_document');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });

      if (!res.ok) throw new Error('File upload failed');
      const data = await res.json();
      const url = data.data?.url || data.url;

      setCertFileUrl(url);
      setCertName(file.name);
      toast.success(`Accreditation Certificate "${file.name}" uploaded to secure storage!`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file');
    } finally {
      setUploadingCert(false);
    }
  };

  const saveCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName || !certEmployeeId || !certOrg) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      
      // Save as employee document vault category
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: certEmployeeId,
          categoryId: 1, // General Vault Category
          documentName: certName,
          fileUrl: certFileUrl,
          expiryDate: certExpiry || null,
          documentNumber: certCredId,
          confidentialityLevel: 'internal'
        })
      });
      if (res.ok) {
        toast.success('Vendor Accreditation logged successfully!');
        setCertName('');
        setCertOrg('');
        setCertCredId('');
        setCertExpiry('');
        setCertIssue('');
        setCertFileUrl('');
        // Log Audit Event
        await logAuditEvent('CertificateIssued', { employeeId: certEmployeeId, certName });
        fetchData();
      } else {
        toast.error('Failed to log certification');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Timed Exam Quiz simulation
  const startQuiz = () => {
    setQuizActive(true);
    setQuizTimer(60);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    toast.success('Exam session initiated! Timer started (60s).');
  };

  useEffect(() => {
    if (!quizActive || quizSubmitted) return;
    const interval = setInterval(() => {
      setQuizTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuizAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizActive, quizSubmitted]);

  const selectQuizAnswer = (qId: number, option: string) => {
    setSelectedQuizAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const submitQuizAuto = () => {
    evaluateQuiz();
  };

  const evaluateQuiz = async () => {
    setQuizSubmitted(true);
    let score = 0;
    mockQuestions.forEach(q => {
      if (selectedQuizAnswers[q.id] === q.correct) {
        score += 33.3;
      }
    });
    const finalScore = Math.min(Math.round(score), 100);
    setQuizScore(finalScore);

    if (finalScore >= 70) {
      toast.success(`Exam Passed! Score: ${finalScore}%. Issuing digital certificate to vault.`);
      await logAuditEvent('AssessmentPassed', { score: finalScore });
    } else {
      toast.error(`Exam Failed. Score: ${finalScore}%. Passing criteria: 70%.`);
      await logAuditEvent('AssessmentFailed', { score: finalScore });
    }
  };

  // Biometric / Geolocation simulation check-in
  const triggerBiometricScan = async () => {
    setSimulatingBiometric(true);
    toast.info("Performing biometric facial symmetry verification...");
    setTimeout(async () => {
      setSimulatingBiometric(false);
      toast.success(`Biometric face signature matched! GPS Geofence: surat_office [Lat: ${gpsCoords.lat}, Lng: ${gpsCoords.lng}]`);
      await logAuditEvent('AttendanceStarted', { method: 'biometric', lat: gpsCoords.lat, lng: gpsCoords.lng });
    }, 2000);
  };

  // Audit logger utility helper
  const logAuditEvent = async (action: string, details: any) => {
    try {
      const token = getStoredSessionToken();
      await fetch('/api/training/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, details })
      });
    } catch (err) {
      console.error("Failed to log audit event:", err);
    }
  };

  const updateEnrollmentProgress = async (id: number, currentProgress: number, isComplete: boolean) => {
    const nextProgress = isComplete ? 100 : Math.min(currentProgress + 25, 100);
    const status = nextProgress === 100 ? 'completed' : 'in_progress';
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/enrollments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status, progressPercentage: nextProgress })
      });
      if (res.ok) {
        toast.success('Enrollment progress updated successfully');
        await logAuditEvent('SessionCompleted', { enrollmentId: id, progress: nextProgress });
        fetchData();
      } else {
        toast.error('Failed to update progress');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
        {/* Focused Selector Skeleton */}
        <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-full"></div>
        {/* Tabs Navigation Skeleton */}
        <div className="flex gap-2 pb-2 border-b">
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
        </div>
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
            <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[450px] bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#f87941]" />
            LXP & Training Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage skill development roadmaps, publish learning courses, run timed exams, and index digital certifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            AI Learning Engine Active
          </Badge>
        </div>
      </div>

      {/* Global Employee Profile Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/30 rounded-xl border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#f87941]" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Focused Employee Profile View:</span>
        </div>
        <select 
          className="w-72 border rounded-lg p-2 bg-transparent text-xs border-input h-9 outline-none font-semibold text-slate-800 dark:text-slate-200" 
          value={selectedEmpId || ''} 
          onChange={e => {
            const empId = Number(e.target.value);
            handleEmployeeFocusChange(empId);
          }}
        >
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</option>
          ))}
        </select>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200 dark:border-zinc-800">
        {[
          { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart4 },
          { id: 'catalogue', label: 'Learning Catalogue', icon: BookOpen },
          { id: 'schedules', label: 'Class Schedules', icon: Calendar },
          { id: 'enrolments', label: 'Nominations & Enrolments', icon: UserCheck },
          { id: 'competency', label: 'Competency Framework', icon: Table },
          { id: 'certifications', label: 'Accreditation Exam Centre', icon: Award },
          { id: 'instructors', label: 'Trainer Registry', icon: Users },
          { id: 'audits', label: 'Forensic Audit Logs', icon: ShieldAlert }
        ].map(t => (
          <Button
            key={t.id}
            variant={activeTab === t.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(t.id as any)}
            className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
          >
            <t.icon className="h-3.5 w-3.5 mr-1.5" /> {t.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-[#f87941]/10 rounded-xl"><GraduationCap className="h-5 w-5 text-[#f87941]" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Active Enrolments</p>
                  <h3 className="text-2xl font-bold">{enrollments.filter(e => e.status !== 'completed').length} Learners</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Compliance Ratio</p>
                  <h3 className="text-2xl font-bold">89.4% Completed</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl"><Award className="h-5 w-5 text-indigo-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">CPD / CE Credits Logged</p>
                  <h3 className="text-2xl font-bold">142 Credits</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl"><DollarSign className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">L&D Budget Consumption</p>
                  <h3 className="text-2xl font-bold">$12,450 / $25k</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader><CardTitle className="text-md flex items-center gap-2"><Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> AI Competency Gap Analysis & Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-3 border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Engineering Division (Surat Office)</span>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">8 Missing Competencies</Badge>
                  </div>
                  <p className="text-slate-500">AI has detected a critical skill shortage in **Supabase Row Level Security (RLS)** and **Next.js Server Actions** across junior developers allocated to Project Alpha.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-[#f87941]/30 hover:bg-[#f87941]/5 text-[#f87941]" onClick={() => setActiveTab('enrolments')}>Nominate Team</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-slate-500">Ignore warning</Button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-3 border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Management & Leadership Track</span>
                    <Badge className="bg-purple-500/10 text-purple-500 border-none font-bold">Succession Planning Alert</Badge>
                  </div>
                  <p className="text-slate-500">3 department managers have not completed their mandatory annual **SOC2 security awareness refreshers**. Validity expires in 12 days.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-purple-350 hover:bg-purple-500/5 text-purple-600">Assign refresher</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader><CardTitle className="text-md">Popular Learning Modules</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs">
                {programs.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="p-3 border rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{p.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.category} • {p.difficulty_level}</p>
                    </div>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">#{i + 1}</Badge>
                  </div>
                ))}
                {programs.length === 0 && <p className="text-slate-400 italic py-4 text-center">No catalogued courses found.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: LEARNING CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Define Catalogue Course</CardTitle>
                <CardDescription>Configure course parameters, difficulty, pricing, and cost centers.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={createProgram} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="prog-code">Course Code</Label>
                      <Input id="prog-code" placeholder="e.g. SEC-101" value={progCode} onChange={e => setProgCode(e.target.value)} required className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="prog-title">Course Title</Label>
                      <Input id="prog-title" placeholder="Advanced Supabase" value={progTitle} onChange={e => setProgTitle(e.target.value)} required className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prog-desc">Objectives / Description</Label>
                    <Input id="prog-desc" placeholder="Course goals..." value={progDesc} onChange={e => setProgDesc(e.target.value)} className="h-8 text-xs mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="prog-category">Category</Label>
                      <select id="prog-category" value={progCategory} onChange={e => setProgCategory(e.target.value)} className="w-full border rounded-lg p-1.5 mt-1 bg-transparent text-xs border-input h-8 outline-none">
                        <option value="Technical">Technical</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Leadership">Leadership</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="prog-subcategory">Subcategory</Label>
                      <Input id="prog-subcategory" placeholder="e.g. Security" value={progSubcat} onChange={e => setProgSubcat(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="prog-difficulty">Difficulty</Label>
                      <select id="prog-difficulty" value={progDifficulty} onChange={e => setProgDifficulty(e.target.value)} className="w-full border rounded-lg p-1.5 mt-1 bg-transparent text-xs border-input h-8 outline-none">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="prog-method">Method</Label>
                      <select id="prog-method" value={progMethod} onChange={e => setProgMethod(e.target.value)} className="w-full border rounded-lg p-1.5 mt-1 bg-transparent text-xs border-input h-8 outline-none">
                        <option value="Self-Paced">Self-Paced</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="prog-inst">Instructor</Label>
                      <Input id="prog-inst" placeholder="Coach name" value={progInstructor} onChange={e => setProgInstructor(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="prog-hours">Hours</Label>
                      <Input id="prog-hours" type="number" placeholder="10" value={progHours} onChange={e => setProgHours(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="prog-credits">CE Credits</Label>
                      <Input id="prog-credits" type="number" placeholder="2" value={progCredits} onChange={e => setProgCredits(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="prog-validity">Validity (Days)</Label>
                      <Input id="prog-validity" type="number" placeholder="365" value={progValidity} onChange={e => setProgValidity(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="prog-cost">Cost Centre</Label>
                      <Input id="prog-cost" placeholder="L&D-ENG" value={progCostCentre} onChange={e => setProgCostCentre(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="prog-price">Pricing ($)</Label>
                      <Input id="prog-price" type="number" placeholder="0" value={progPricing} onChange={e => setProgPricing(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="prog-pass">Pass Score (%)</Label>
                      <Input id="prog-pass" type="number" placeholder="70" value={progPassCriteria} onChange={e => setProgPassCriteria(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Publishing...' : 'Publish Course Program'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Course Catalogue Directory</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {programs.map(p => (
                    <div key={p.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#f87941] font-bold bg-[#f87941]/10 px-1.5 py-0.5 rounded">{p.code || 'LMS'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.title}</span>
                        </div>
                        <p className="text-slate-500 mt-1">{p.description || 'No description recorded.'}</p>
                        <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                          <span>Difficulty: {p.difficulty_level}</span>
                          <span>Method: {p.delivery_method}</span>
                          <span>Credits: {p.ce_credits} pts</span>
                          <span>Cost Centre: {p.cost_centre || 'N/A'}</span>
                          {p.pricing > 0 && <span className="text-emerald-600 font-bold">${p.pricing}</span>}
                        </div>
                      </div>
                      <Badge className="bg-slate-150 text-slate-700 border-none font-bold uppercase tracking-wider">{p.category}</Badge>
                    </div>
                  ))}
                  {programs.length === 0 && <p className="text-slate-400 italic py-6 text-center">Catalogue is currently empty. Add your first course on the left.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Calendar className="h-4.5 w-4.5 text-[#f87941]" /> Schedule Class Session</CardTitle>
                <CardDescription>Book trainer, classroom, zoom link, and waitlists.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={createSession} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="sess-course">Select Course Program</Label>
                    <select id="sess-course" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedCourseId || ''} onChange={e => setSelectedCourseId(Number(e.target.value))}>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sess-trainer">Assign Instructor</Label>
                    <select id="sess-trainer" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedTrainerId || ''} onChange={e => setSelectedTrainerId(Number(e.target.value))}>
                      <option value="">No Instructor Assigned</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sess-start">Start Date & Time</Label>
                      <Input id="sess-start" type="datetime-local" value={sessStart} onChange={e => setSessStart(e.target.value)} required className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="sess-end">End Date & Time</Label>
                      <Input id="sess-end" type="datetime-local" value={sessEnd} onChange={e => setSessEnd(e.target.value)} required className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sess-venue">Venue / Room</Label>
                      <Input id="sess-venue" placeholder="Room 402 / Zoom" value={sessVenue} onChange={e => setSessVenue(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="sess-link">Meeting Link (Virtual)</Label>
                      <Input id="sess-link" placeholder="https://zoom.us/..." value={sessLink} onChange={e => setSessLink(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sess-capacity">Capacity Limit</Label>
                      <Input id="sess-capacity" type="number" value={sessCapacity} onChange={e => setSessCapacity(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="sess-wait">Waitlist limit</Label>
                      <Input id="sess-wait" type="number" value={sessWaitlist} onChange={e => setSessWaitlist(e.target.value)} className="h-8 text-xs mt-1" />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Scheduling...' : 'Schedule Class Session'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Scheduled Training Classes</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {sessions.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{s.training_programs?.title}</p>
                          <p className="text-slate-400 mt-1">Instructor: {s.training_instructors?.name || 'Unassigned'}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase tracking-wider font-bold">{s.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#f87941]" /> Start: {new Date(s.start_date).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#f87941]" /> Venue: {s.venue || 'Online'}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-[#f87941]" /> Cap: {s.capacity} (Wait: {s.waitlist_limit})</span>
                        {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noreferrer" className="text-[#f87941] underline flex items-center gap-1"><Share2 className="h-3 w-3" /> Join Class</a>}
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && <p className="text-slate-400 italic py-6 text-center">No active class schedules mapped. Schedule one on the left.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: NOMINATIONS & ENROLMENTS */}
      {activeTab === 'enrolments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><UserCheck className="h-4.5 w-4.5 text-[#f87941]" /> Nominate Employee</CardTitle>
                <CardDescription>Nominate employee or self-enroll into course/scheduled session.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={enrollEmployee} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="enr-emp">Select Employee</Label>
                    <select id="enr-emp" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedEmpId || ''} onChange={e => {
                      const empId = Number(e.target.value);
                      handleEmployeeFocusChange(empId);
                    }}>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="enr-prog">Select Course Program</Label>
                    <select id="enr-prog" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedProgId || ''} onChange={e => setSelectedProgId(Number(e.target.value))}>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="enr-sess">Select Scheduled Session (Optional)</Label>
                    <select id="enr-sess" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedSessId || ''} onChange={e => setSelectedSessId(Number(e.target.value))}>
                      <option value="">Self-paced / No session</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.training_programs?.title} ({new Date(s.start_date).toLocaleDateString()})</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="enr-type">Enrolment Type</Label>
                    <select id="enr-type" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={enrolType} onChange={e => setEnrolType(e.target.value)}>
                      <option value="self">Self-Enrolment</option>
                      <option value="manager">Manager Nomination</option>
                      <option value="hr">HR Mandatory Induction</option>
                      <option value="automatic">Automatic AI Path</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Nominating...' : 'Submit Nomination Enrolment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Nominations Timelines & Learning Tracker</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {enrollments.map(e => (
                    <div key={e.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{e.training_programs?.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Enrolment ID: #{e.id} • Mode: <span className="font-semibold uppercase text-slate-500">{e.enrolment_type || 'self'}</span></p>
                        </div>
                        <div className="text-right">
                          <Badge className={`capitalize font-semibold border-none ${e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{e.status}</Badge>
                          <p className="text-[10px] text-slate-400 mt-1">{e.progress_percentage}% completed</p>
                        </div>
                      </div>
                      {e.status !== 'completed' && (
                        <div className="flex gap-2 mt-4 justify-end border-t pt-3">
                          <Button size="sm" variant="outline" className="text-xs h-7 border-[#f87941]/30 text-[#f87941] hover:bg-[#f87941]/5" onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, false)}>+25% Progress</Button>
                          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, true)}>Complete Track</Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {enrollments.length === 0 && <p className="text-slate-400 italic py-6 text-center">No logged enrolments mapped in learning tracks.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: COMPETENCY FRAMEWORK */}
      {activeTab === 'competency' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Competency constraint</CardTitle>
                <CardDescription>Model expected skill proficiencies by organizational roles.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={createCompetencyRule} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="comp-designation">Select Designation</Label>
                    <select id="comp-designation" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={compDesignation} onChange={e => setCompDesignation(e.target.value)}>
                      <option value="Senior Software Engineer">Senior Software Engineer</option>
                      <option value="Lead Architect">Lead Architect</option>
                      <option value="CTO">CTO</option>
                      <option value="HR Analyst">HR Analyst</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="comp-skill">Skill Name</Label>
                    <Input id="comp-skill" placeholder="e.g. Next.js Server Actions" value={compSkillName} onChange={e => setCompSkillName(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div>
                    <Label htmlFor="comp-level">Expected Proficiency</Label>
                    <select id="comp-level" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={compRequiredLevel} onChange={e => setCompRequiredLevel(e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Registering...' : 'Register Competency Rule'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Employee Skill Matrix</CardTitle>
                <CardDescription>Log employee technical competencies years experience.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={addSkill} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="matrix-emp">Select Employee Target</Label>
                    <select id="matrix-emp" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedEmpId || ''} onChange={e => {
                      const empId = Number(e.target.value);
                      handleEmployeeFocusChange(empId);
                    }}>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="matrix-skill">Skill Name</Label>
                    <Input id="matrix-skill" placeholder="e.g. Next.js" value={skillName} onChange={e => setSkillName(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="matrix-level">Proficiency</Label>
                      <select id="matrix-level" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={skillLevel} onChange={e => setSkillLevel(e.target.value)}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="matrix-exp">Experience (Years)</Label>
                      <Input id="matrix-exp" type="number" placeholder="4" value={skillExp} onChange={e => setSkillExp(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Saving...' : 'Save Skill Matrix Record'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Designations Target Skill Framework</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {competencies.map(c => (
                    <div key={c.id} className="p-3 border rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{c.designation}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Skill requirement: <span className="font-semibold">{c.skill_name}</span></p>
                      </div>
                      <Badge className="bg-slate-150 text-slate-700 border-none font-bold uppercase tracking-wider">{c.required_level}</Badge>
                    </div>
                  ))}
                  {competencies.length === 0 && <p className="col-span-full text-slate-400 italic py-6 text-center">No competency designation constraints registered yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">Active Employee Skill Matrix ({employees.find(emp => emp.id === selectedEmpId)?.firstName || 'Select user'})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {skills.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#1E1F22]">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{s.skill_name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{s.years_of_experience || 0} yrs experience</p>
                      </div>
                      <Badge className={`capitalize font-semibold border-none ${s.proficiency_level === 'expert' ? 'bg-purple-500/10 text-purple-500' : s.proficiency_level === 'advanced' ? 'bg-[#f87941]/10 text-[#f87941]' : 'bg-slate-500/10 text-slate-500'}`}>{s.proficiency_level}</Badge>
                    </div>
                  ))}
                  {skills.length === 0 && <p className="col-span-full text-slate-400 italic py-6 text-center">No skill matrix items logged for this employee. Map skills on the left.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: ACCREDITATION EXAM CENTRE */}
      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Award className="h-4.5 w-4.5 text-[#f87941]" /> Add Vendor Accreditation</CardTitle>
                <CardDescription>Log credential verification, issuing organization, and expiry check dates.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={saveCertification} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="cert-emp">Accredited Employee</Label>
                    <select id="cert-emp" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={certEmployeeId || ''} onChange={e => {
                      const empId = Number(e.target.value);
                      handleEmployeeFocusChange(empId);
                    }}>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="cert-name">Accreditation Title Name</Label>
                    <Input id="cert-name" placeholder="AWS Certified Solutions Architect" value={certName} onChange={e => setCertName(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cert-org">Issuing Organization</Label>
                      <Input id="cert-org" placeholder="Amazon Web Services" value={certOrg} onChange={e => setCertOrg(e.target.value)} required className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="cert-credid">Credential ID</Label>
                      <Input id="cert-credid" placeholder="AWS-90284" value={certCredId} onChange={e => setCertCredId(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cert-issue">Issue Date</Label>
                      <Input id="cert-issue" type="date" value={certIssue} onChange={e => setCertIssue(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="cert-expiry">Expiration Date</Label>
                      <Input id="cert-expiry" type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Or Choose Certificate File from device</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleCertFileUpload}
                      disabled={uploadingCert}
                      className="text-xs cursor-pointer h-9 mt-1"
                    />
                    {uploadingCert && <p className="text-[10px] text-[#f87941] mt-1 animate-pulse">Uploading file to secure vault storage...</p>}
                  </div>
                  <Button type="submit" disabled={submitting || uploadingCert} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Logging...' : 'Log Vendor Accreditation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md flex items-center gap-2"><Timer className="h-4.5 w-4.5 text-[#f87941]" /> Timed Interactive Exam Suite</CardTitle>
                {!quizActive && <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs h-8" onClick={startQuiz}>Initiate RLS Exam</Button>}
              </CardHeader>
              <CardContent className="pt-4">
                {quizActive ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                      <span className="font-bold text-red-500">Security & Compliance Certification Exam</span>
                      <span className="flex items-center gap-1.5 font-bold text-red-500"><Clock className="h-4 w-4 animate-spin" /> Timer: {quizTimer}s</span>
                    </div>

                    {!quizSubmitted ? (
                      <div className="space-y-4 pt-2">
                        {mockQuestions.map((q, idx) => (
                          <div key={q.id} className="p-4 border rounded-xl space-y-2.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{idx + 1}. {q.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => selectQuizAnswer(q.id, opt)}
                                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all text-xs ${selectedQuizAnswers[q.id] === opt ? 'border-[#f87941] bg-[#f87941]/5 font-semibold text-slate-800 dark:text-slate-200' : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 mt-4" onClick={evaluateQuiz}>Submit Exam Paper</Button>
                      </div>
                    ) : (
                      <div className="p-6 border rounded-xl space-y-3 text-center animate-fadeIn">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${quizScore >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {quizScore >= 70 ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
                        </div>
                        <h3 className="text-lg font-bold">Exam Result: {quizScore}%</h3>
                        <p className="text-slate-400">Passing score constraint: 70%</p>
                        <p className="text-slate-500 font-semibold">{quizScore >= 70 ? "Congratulations! Your digital certificate has been verified and registered in the vault." : "You did not pass the pass threshold. Please review the course catalogue and retry."}</p>
                        <Button variant="outline" className="mt-2 text-slate-600 border-slate-200 text-xs h-8" onClick={() => setQuizActive(false)}>Return to Centre</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-center py-6 text-xs">No active exam session. Click "Initiate RLS Exam" above to start the timed assessment.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Logged Accreditations & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {certificationsList.map(c => (
                    <div key={c.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.document_name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Cred ID: {c.document_number || 'N/A'} • Expiration: {c.expiry_date || 'Lifetime validity'}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase font-bold tracking-wider">{c.verification_status}</Badge>
                        {c.file_url && (
                          <a href={c.file_url} onClick={e => handleViewFile(e, c.file_url)} target="_blank" rel="noreferrer" className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 dark:hover:bg-zinc-900">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {certificationsList.length === 0 && <p className="text-slate-400 italic py-6 text-center">No certifications logged for selected user.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: TRAINER REGISTRY */}
      {activeTab === 'instructors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Trainer profile</CardTitle>
                <CardDescription>Register qualifications, contractor hourly rates, availability.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={addInstructor} className="space-y-3 text-xs">
                  <div>
                    <Label htmlFor="inst-name">Instructor Name</Label>
                    <Input id="inst-name" placeholder="e.g. Dr. Emily Thorne" value={instName} onChange={e => setInstName(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div>
                    <Label htmlFor="inst-quals">Qualifications & Certs</Label>
                    <Input id="inst-quals" placeholder="e.g. AWS Authorized Trainer" value={instQuals} onChange={e => setInstQuals(e.target.value)} className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="inst-rate">Hourly Rate ($)</Label>
                      <Input id="inst-rate" type="number" placeholder="50" value={instRate} onChange={e => setInstRate(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="inst-avail">Availability</Label>
                      <select id="inst-avail" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={instAvailability} onChange={e => setInstAvailability(e.target.value)}>
                        <option value="Available">Available</option>
                        <option value="Out of office">Out of office</option>
                        <option value="Fully booked">Fully booked</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Registering...' : 'Register Trainer profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Instructors & Mentors directory</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {instructors.map(i => (
                    <div key={i.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{i.name}</p>
                        <p className="text-slate-500 mt-1">{i.qualifications || 'No qualifications documented.'}</p>
                        <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
                          <span>Rating: {i.rating} / 5</span>
                          <span>Hourly: ${i.hourly_rate}/hr</span>
                        </div>
                      </div>
                      <Badge className={`capitalize font-bold border-none ${i.availability === 'Available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{i.availability}</Badge>
                    </div>
                  ))}
                  {instructors.length === 0 && <p className="col-span-full text-slate-400 italic py-6 text-center">No trainers logged in the workspace registry.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 8: FORENSIC AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><MapPin className="h-4.5 w-4.5 text-[#f87941]" /> Biometric Geolocation simulation</CardTitle>
                <CardDescription>Simulate face symmetry matches and GPS check-ins for classroom learning verification.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Latitude Geofence</Label>
                    <Input type="number" value={gpsCoords.lat} onChange={e => setGpsCoords(prev => ({ ...prev, lat: Number(e.target.value) }))} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <Label>Longitude Geofence</Label>
                    <Input type="number" value={gpsCoords.lng} onChange={e => setGpsCoords(prev => ({ ...prev, lng: Number(e.target.value) }))} className="h-8 text-xs mt-1" />
                  </div>
                </div>
                <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 mt-2" onClick={triggerBiometricScan} disabled={simulatingBiometric}>
                  {simulatingBiometric ? "Validating camera feed..." : "Simulate Biometric check-in"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Cpu className="h-4.5 w-4.5 text-[#f87941]" /> Asynchronous Domain Events Queue</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2">
                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono text-[10px] text-indigo-500">CourseCreated</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[9px] tracking-wide">Published</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400">ID: lms-event-9028 • Retries: 0 • DLQ: false</p>
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-indigo-500 font-bold">CertificateIssued</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[9px] tracking-wide">Published</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400">ID: lms-event-4038 • Retries: 0 • DLQ: false</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Immutable Compliance Forensic Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs font-mono">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 space-y-1 border-slate-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#f87941]">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Performed by: {log.performed_by}</p>
                      <pre className="text-[9px] bg-slate-50 dark:bg-zinc-900 p-2 rounded border mt-1 overflow-x-auto text-slate-600 dark:text-slate-400">{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-slate-400 italic py-6 text-center">Forensic compliance audits registry is currently empty.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
