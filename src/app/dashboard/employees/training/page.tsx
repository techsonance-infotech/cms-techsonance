'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  BookOpen, Award, CheckCircle2, Plus, Clock, ShieldCheck, GraduationCap, Table, Sparkles,
  Calendar, Search, Check, X, ShieldAlert, Share2,
  MapPin, UserCheck, BarChart4, Users, Timer, ExternalLink, Trash2, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';

export default function TrainingAndSkillsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [certificationsList, setCertificationsList] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Search & Filter for Catalogue
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [catalogueCategoryFilter, setCatalogueCategoryFilter] = useState('All');

  // Course Form (Admin)
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

  // Session Form (Admin)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [sessStart, setSessStart] = useState('');
  const [sessEnd, setSessEnd] = useState('');
  const [sessVenue, setSessVenue] = useState('');
  const [sessLink, setSessLink] = useState('');
  const [sessCapacity, setSessCapacity] = useState('20');
  const [sessWaitlist, setSessWaitlist] = useState('5');

  // Enrollment Nomination Form (Admin / Employee)
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [selectedProgId, setSelectedProgId] = useState<number | null>(null);
  const [selectedSessId, setSelectedSessId] = useState<number | null>(null);
  const [enrolType, setEnrolType] = useState('self');

  // Skill Competency Framework Form (Admin)
  const [compDesignation, setCompDesignation] = useState('Software Engineer');
  const [compSkillName, setCompSkillName] = useState('');
  const [compRequiredLevel, setCompRequiredLevel] = useState('intermediate');

  // Skill Profile Matrix Add Form (Employee / Admin)
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [skillExp, setSkillExp] = useState('');

  // Instructor Form (Admin)
  const [instName, setInstName] = useState('');
  const [instQuals, setInstQuals] = useState('');
  const [instRate, setInstRate] = useState('50');
  const [instAvailability, setInstAvailability] = useState('Available');

  // Certification Upload Form (Employee / Admin)
  const [certEmployeeId, setCertEmployeeId] = useState<number | null>(null);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certCredId, setCertCredId] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExpiry, setCertExpiry] = useState('');

  // Database-backed Interactive Exam State
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizTimer, setQuizTimer] = useState(60);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const token = getStoredSessionToken();
    const storedUser = getStoredUser();

    let userObj = storedUser;
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          userObj = meData.user;
        }
      }
    } catch (err) {
      console.error('Failed to fetch /api/auth/me:', err);
    }

    setCurrentUser(userObj);

    // Normalize role
    const rawRole = String(userObj?.role || userObj?.rawRole || '').toLowerCase().replace(/[\s-]+/g, '_');
    const userIsAdmin = ['super_admin', 'superadmin', 'admin', 'owner', 'ceo', 'hr_manager', 'hr_executive', 'cms_administrator', 'management'].includes(rawRole);
    const userIsManager = ['manager', 'project_manager'].includes(rawRole);
    const hasAdminAccess = userIsAdmin || userIsManager;
    setIsAdmin(hasAdminAccess);

    if (!hasAdminAccess) {
      setActiveTab('my_learning');
    } else {
      setActiveTab('dashboard');
    }

    let empList: any[] = [];
    let myEmpId: number | null = null;

    try {
      const employeesRes = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        empList = employeesData.data || [];
        setEmployees(empList);

        const myEmp = empList.find((e: any) => 
          String(e.userId) === String(userObj?.id) || 
          e.email === userObj?.email || 
          (userObj?.providerUserId && String(e.userId) === String(userObj.providerUserId)) ||
          (userObj?.id && String(e.id) === String(userObj.id))
        );

        if (myEmp) {
          myEmpId = myEmp.id;
          setCurrentEmployeeId(myEmp.id);
        } else if (!hasAdminAccess && empList.length > 0) {
          myEmpId = empList[0].id;
          setCurrentEmployeeId(empList[0].id);
        }

        const initialFocusId = hasAdminAccess ? (empList[0]?.id || null) : myEmpId;
        if (initialFocusId) {
          setSelectedEmpId(initialFocusId);
          setCertEmployeeId(initialFocusId);
        }
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }

    // Fetch Programs from DB
    try {
      const programsRes = await fetch('/api/training/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPrograms(Array.isArray(programsData) ? programsData : []);
        if (programsData.length > 0) {
          setSelectedProgId(programsData[0].id);
          setSelectedCourseId(programsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load programs:', err);
    }

    // Fetch Sessions from DB
    try {
      const sessionsRes = await fetch('/api/training/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        if (sessionsData.length > 0) {
          setSelectedSessId(sessionsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }

    // Fetch Competency framework from DB
    try {
      const compRes = await fetch('/api/training/competencies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompetencies(Array.isArray(compData) ? compData : []);
      }
    } catch (err) {
      console.error('Failed to load competencies:', err);
    }

    // Fetch Instructors from DB
    try {
      const instRes = await fetch('/api/training/instructors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstructors(Array.isArray(instData) ? instData : []);
        if (instData.length > 0) {
          setSelectedTrainerId(instData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load instructors:', err);
    }

    // Fetch Assessments from DB
    try {
      const assessRes = await fetch('/api/training/assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assessRes.ok) {
        const assessData = await assessRes.json();
        const list = Array.isArray(assessData) ? assessData : [];
        setAssessments(list);
        if (list.length > 0) {
          setSelectedAssessmentId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }

    // Fetch Attendance records from DB
    try {
      const attRes = await fetch('/api/training/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceList(Array.isArray(attData) ? attData : []);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }

    // Fetch Enrollments, Skills, Certifications
    const targetEmpId = hasAdminAccess ? (empList[0]?.id || myEmpId) : myEmpId;
    if (targetEmpId) {
      await loadEmployeeScopedData(targetEmpId, hasAdminAccess);
    } else {
      await fetchAllEnrollments();
    }

    // Fetch audit logs for admin
    if (hasAdminAccess) {
      try {
        const auditsRes = await fetch('/api/training/audits', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (auditsRes.ok) {
          const auditsData = await auditsRes.json();
          setAuditLogs(Array.isArray(auditsData) ? auditsData : []);
        }
      } catch (err) {
        console.error('Failed to load audits:', err);
      }
    }

    setLoading(false);
  };

  const loadEmployeeScopedData = async (empId: number, hasAdminRole: boolean) => {
    const token = getStoredSessionToken();

    // 1. Fetch skills from DB
    try {
      const skillsRes = await fetch(`/api/skills/matrix?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      }
    } catch {
      console.error('Failed to load skills matrix');
    }

    // 2. Fetch certifications from DB table `certifications`
    try {
      const certRes = await fetch(`/api/certifications?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificationsList(Array.isArray(certData) ? certData : []);
      }
    } catch {
      console.error('Failed to load certifications');
    }

    // 3. Fetch enrollments from DB
    try {
      const url = hasAdminRole 
        ? `/api/training/enrollments` 
        : `/api/training/enrollments?employeeId=${empId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error('Failed to load enrollments');
    }
  };

  const fetchAllEnrollments = async () => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/training/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error('Failed to fetch enrollments');
    }
  };

  const handleEmployeeFocusChange = async (empId: number) => {
    setSelectedEmpId(empId);
    setCertEmployeeId(empId);
    await loadEmployeeScopedData(empId, isAdmin);
  };

  // 1. Create Program catalogue course (Admin)
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
        toast.success('Course published to catalogue successfully!');
        setProgTitle('');
        setProgDesc('');
        setProgInstructor('');
        setProgHours('');
        setProgCode('');
        setProgSubcat('');
        setProgCostCentre('');
        await logAuditEvent('CoursePublished', { title: progTitle, code: progCode });
        const progsRes = await fetch('/api/training/programs', { headers: { Authorization: `Bearer ${token}` } });
        if (progsRes.ok) setPrograms(await progsRes.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to publish course program');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Course (Admin)
  const deleteProgram = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the catalogue?`)) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/training/programs?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Course removed from catalogue');
        setPrograms(prev => prev.filter(p => p.id !== id));
      } else {
        toast.error('Failed to remove course');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // 2. Create class session (Admin)
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
        toast.success('Session scheduled successfully!');
        setSessStart('');
        setSessEnd('');
        setSessVenue('');
        setSessLink('');
        await logAuditEvent('SessionCreated', { courseId: selectedCourseId, venue: sessVenue });
        const sessRes = await fetch('/api/training/sessions', { headers: { Authorization: `Bearer ${token}` } });
        if (sessRes.ok) setSessions(await sessRes.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to create session');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Nominate Employee (Admin)
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
        toast.success('Employee enrolled successfully!');
        await logAuditEvent('EmployeeEnrolled', { employeeId: selectedEmpId, courseId: selectedProgId });
        await loadEmployeeScopedData(selectedEmpId, isAdmin);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to enroll employee');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3b. Self-Enroll in Course (Employee)
  const selfEnroll = async (programId: number) => {
    const empId = currentEmployeeId || selectedEmpId;
    if (!empId) {
      toast.error('Employee profile not identified. Please contact administrator.');
      return;
    }
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
          programId,
          employeeId: empId,
          status: 'in_progress',
          progressPercentage: 0,
          enrolmentType: 'self'
        })
      });
      if (res.ok) {
        toast.success('Successfully enrolled in course! You can now start learning.');
        await loadEmployeeScopedData(empId, isAdmin);
        setActiveTab('my_learning');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to enroll');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Competency Framework Requirement (Admin)
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
        toast.success('Designation competency rule registered!');
        setCompSkillName('');
        await logAuditEvent('CompetencyValidated', { designation: compDesignation, skill: compSkillName });
        const compRes = await fetch('/api/training/competencies', { headers: { Authorization: `Bearer ${token}` } });
        if (compRes.ok) setCompetencies(await compRes.json());
      } else {
        toast.error('Failed to save competency rule');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Add Skill Matrix records (Employee & Admin)
  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = isAdmin ? selectedEmpId : (currentEmployeeId || selectedEmpId);
    if (!skillName || !targetId) return;
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
          employeeId: targetId,
          skillName,
          proficiencyLevel: skillLevel,
          yearsOfExperience: skillExp ? Number(skillExp) : 0
        })
      });
      if (res.ok) {
        toast.success('Skill added to matrix successfully!');
        setSkillName('');
        setSkillExp('');
        await logAuditEvent('SkillUpdated', { employeeId: targetId, skill: skillName });
        const skillsRes = await fetch(`/api/skills/matrix?employeeId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (skillsRes.ok) setSkills(await skillsRes.json());
      } else {
        toast.error('Failed to save skill entry');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Skill from Matrix
  const deleteSkill = async (id: number, name: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/skills/matrix?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Removed "${name}" from skills matrix`);
        setSkills(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error('Failed to delete skill');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // 6. Add Instructor Registry (Admin)
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
        await logAuditEvent('TrainerAssigned', { name: instName });
        const instRes = await fetch('/api/training/instructors', { headers: { Authorization: `Bearer ${token}` } });
        if (instRes.ok) setInstructors(await instRes.json());
      } else {
        toast.error('Failed to register instructor');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Save Certification to DB table `certifications` (Employee & Admin)
  const saveCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = isAdmin ? certEmployeeId : (currentEmployeeId || selectedEmpId);
    if (!certName || !targetId || !certOrg) {
      toast.error('Please enter certification name, issuing organization, and select employee.');
      return;
    }
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: targetId,
          name: certName,
          issuingOrganization: certOrg,
          credentialId: certCredId || null,
          issueDate: certIssue || null,
          expiryDate: certExpiry || null,
          verificationStatus: 'verified'
        })
      });
      if (res.ok) {
        toast.success('Accreditation logged to database successfully!');
        setCertName('');
        setCertOrg('');
        setCertCredId('');
        setCertExpiry('');
        setCertIssue('');
        await logAuditEvent('CertificateIssued', { employeeId: targetId, certName });
        const certRes = await fetch(`/api/certifications?employeeId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (certRes.ok) setCertificationsList(await certRes.json());
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to log certification');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Certification
  const deleteCertification = async (id: number, name: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/certifications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Certification "${name}" removed`);
        setCertificationsList(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error('Failed to remove certification');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // 8. Timed Exam Suite backed by Supabase `training_assessments`
  const activeAssessment = assessments.find(a => a.id === selectedAssessmentId) || assessments[0] || null;
  const assessmentQuestions = Array.isArray(activeAssessment?.questions) ? activeAssessment.questions : [];

  const startQuiz = () => {
    if (!activeAssessment || assessmentQuestions.length === 0) {
      toast.error('No assessment questions found in database for this paper.');
      return;
    }
    setQuizActive(true);
    setQuizTimer((activeAssessment.duration_minutes || 15) * 60);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    toast.success(`Exam session initiated! Duration: ${activeAssessment.duration_minutes || 15} minutes.`);
  };

  useEffect(() => {
    if (!quizActive || quizSubmitted) return;
    const interval = setInterval(() => {
      setQuizTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          evaluateQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizActive, quizSubmitted, selectedQuizAnswers, activeAssessment]);

  const selectQuizAnswer = (qId: number, option: string) => {
    setSelectedQuizAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const evaluateQuiz = async () => {
    setQuizSubmitted(true);
    let correctCount = 0;
    assessmentQuestions.forEach((q: any) => {
      if (selectedQuizAnswers[q.id] === q.correct) {
        correctCount++;
      }
    });
    const passCriteria = activeAssessment?.pass_percentage || 70;
    const finalScore = assessmentQuestions.length > 0 
      ? Math.min(Math.round((correctCount / assessmentQuestions.length) * 100), 100) 
      : 0;
    setQuizScore(finalScore);

    const targetId = isAdmin ? (selectedEmpId || currentEmployeeId) : currentEmployeeId;

    if (finalScore >= passCriteria) {
      toast.success(`Exam Passed! Score: ${finalScore}%. Issuing digital certification into database.`);
      await logAuditEvent('AssessmentPassed', { assessmentId: activeAssessment?.id, score: finalScore });

      if (targetId && activeAssessment) {
        try {
          const token = getStoredSessionToken();
          await fetch('/api/certifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              employeeId: targetId,
              name: `${activeAssessment.title} Certified`,
              issuingOrganization: 'Techsonance Learning Academy',
              credentialId: `TS-CERT-${Date.now().toString().slice(-6)}`,
              issueDate: new Date().toISOString().split('T')[0],
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              verificationStatus: 'verified'
            })
          });
          const certRes = await fetch(`/api/certifications?employeeId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (certRes.ok) setCertificationsList(await certRes.json());
        } catch (err) {
          console.error('Failed to auto-issue certificate:', err);
        }
      }
    } else {
      toast.error(`Exam Not Passed. Score: ${finalScore}%. Passing criteria: ${passCriteria}%.`);
      await logAuditEvent('AssessmentFailed', { assessmentId: activeAssessment?.id, score: finalScore });
    }
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

  // Update Enrollment Progress
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
        toast.success(`Progress updated to ${nextProgress}%!`);
        await logAuditEvent('SessionCompleted', { enrollmentId: id, progress: nextProgress });
        const targetId = isAdmin ? selectedEmpId : currentEmployeeId;
        if (targetId) await loadEmployeeScopedData(targetId, isAdmin);
      } else {
        toast.error('Failed to update progress');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // Delete Enrollment (Admin)
  const deleteEnrollment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this enrollment record?')) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/training/enrollments?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Enrollment deleted successfully');
        setEnrollments(prev => prev.filter(e => e.id !== id));
      } else {
        toast.error('Failed to delete enrollment');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  // Filtered Programs for Catalogue
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = !catalogueSearch || 
      p.title.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(catalogueSearch.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(catalogueSearch.toLowerCase()));
    const matchesCategory = catalogueCategoryFilter === 'All' || p.category === catalogueCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate my learning metrics
  const myEnrollments = enrollments.filter(e => {
    if (!isAdmin) return true;
    return selectedEmpId ? e.employee_id === selectedEmpId : true;
  });
  const myCompletedCount = myEnrollments.filter(e => e.status === 'completed').length;
  const myInProgressCount = myEnrollments.filter(e => e.status !== 'completed').length;
  const myCeCreditsEarned = myEnrollments
    .filter(e => e.status === 'completed')
    .reduce((acc, e) => acc + (Number(e.training_programs?.ce_credits) || 0), 0);

  // Target Designation Competency matching
  const currentEmpRecord = employees.find(e => e.id === (isAdmin ? selectedEmpId : currentEmployeeId));
  const empDesignation = currentEmpRecord?.designation || 'Software Engineer';
  const designationCompetencies = competencies.filter(c => 
    c.designation.toLowerCase().trim() === empDesignation.toLowerCase().trim()
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
        <div className="h-14 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          <div className="lg:col-span-2 h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-[#f87941]" />
            {isAdmin ? 'L&D & Training Administration Console' : 'My Learning & Upskilling Portal'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin
              ? 'Configure company learning catalogue, schedule trainer sessions, nominate staff, and audit compliance metrics.'
              : `Welcome back, ${currentEmpRecord?.firstName || currentUser?.firstName || 'Learner'}! Track your courses, self-enroll in learning tracks, record skills, and earn certifications.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            {isAdmin ? 'Admin Governance Mode' : 'Self-Paced Learning Active'}
          </Badge>
        </div>
      </div>

      {/* Admin Employee Focus Switcher */}
      {isAdmin ? (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#f87941]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Focused Employee Profile View:</span>
          </div>
          <select 
            className="w-80 border rounded-lg p-2 bg-transparent text-xs border-input h-9 outline-none font-semibold text-slate-800 dark:text-slate-200" 
            value={selectedEmpId || ''} 
            onChange={e => {
              const empId = Number(e.target.value);
              handleEmployeeFocusChange(empId);
            }}
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent rounded-xl border border-[#f87941]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f87941] text-white flex items-center justify-center font-bold text-sm shadow">
              {(currentEmpRecord?.firstName?.[0] || currentUser?.firstName?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {currentEmpRecord?.firstName || currentUser?.firstName} {currentEmpRecord?.lastName || currentUser?.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Designation: <span className="text-[#f87941] font-semibold">{empDesignation}</span> • Department: <span className="font-semibold">{currentEmpRecord?.department || 'General'}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-[#f87941] border-[#f87941]/30">
            Personal Profile
          </Badge>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200 dark:border-zinc-800">
        {isAdmin ? (
          [
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
              onClick={() => setActiveTab(t.id)}
              className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
            >
              <t.icon className="h-3.5 w-3.5 mr-1.5" /> {t.label}
            </Button>
          ))
        ) : (
          [
            { id: 'my_learning', label: 'My Courses & Progress', icon: GraduationCap },
            { id: 'catalogue', label: 'Course Catalogue', icon: BookOpen },
            { id: 'schedules', label: 'Class Calendar', icon: Calendar },
            { id: 'skills', label: 'My Skills Matrix', icon: Table },
            { id: 'certifications', label: 'Certifications & Exam Centre', icon: Award }
          ].map(t => (
            <Button
              key={t.id}
              variant={activeTab === t.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(t.id)}
              className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
            >
              <t.icon className="h-3.5 w-3.5 mr-1.5" /> {t.label}
            </Button>
          ))
        )}
      </div>

      {/* =========================================================================
          EMPLOYEE TAB 1: MY COURSES & PROGRESS
      ========================================================================== */}
      {!isAdmin && activeTab === 'my_learning' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Personal KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-[#f87941]/10 rounded-xl"><GraduationCap className="h-5 w-5 text-[#f87941]" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Enrolled Courses</p>
                  <h3 className="text-2xl font-bold">{myEnrollments.length} Courses</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">In Progress</p>
                  <h3 className="text-2xl font-bold">{myInProgressCount} Tracks</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Completed Tracks</p>
                  <h3 className="text-2xl font-bold">{myCompletedCount} Done</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl"><Award className="h-5 w-5 text-indigo-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">CE Credits Earned</p>
                  <h3 className="text-2xl font-bold">{myCeCreditsEarned} Credits</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Tracks Grid */}
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-[#f87941]" />
                  Active Learning Tracks & Course Progress
                </CardTitle>
                <CardDescription>Track completion status, update milestone progress, or review materials.</CardDescription>
              </div>
              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs" onClick={() => setActiveTab('catalogue')}>
                Browse Catalogue <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {myEnrollments.map(e => (
                  <div key={e.id} className="p-5 border rounded-2xl hover:border-[#f87941]/40 transition-all bg-card space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#f87941] font-bold bg-[#f87941]/10 px-2 py-0.5 rounded">
                            {e.training_programs?.code || 'COURSE'}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {e.training_programs?.title || 'Training Program'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {e.training_programs?.description || 'No description provided.'}
                        </p>
                      </div>
                      <Badge className={`capitalize font-bold border-none px-3 py-1 ${
                        e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {e.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Course Completion Progress</span>
                        <span className="text-[#f87941]">{e.progress_percentage || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#f87941] to-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${e.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs text-muted-foreground border-t">
                      <div className="flex flex-wrap gap-4 text-[11px]">
                        <span>Duration: <strong className="text-slate-800 dark:text-slate-200">{e.training_programs?.duration_hours || 0} Hours</strong></span>
                        <span>Credits: <strong className="text-slate-800 dark:text-slate-200">{e.training_programs?.ce_credits || 0} CE Pts</strong></span>
                        <span>Mode: <strong className="text-slate-800 dark:text-slate-200">{e.training_programs?.delivery_method || 'Self-Paced'}</strong></span>
                      </div>

                      {e.status !== 'completed' ? (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8 border-[#f87941]/30 text-[#f87941] hover:bg-[#f87941]/5 flex-1 sm:flex-none"
                            onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, false)}
                          >
                            +25% Progress
                          </Button>
                          <Button 
                            size="sm" 
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                            onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, true)}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Track Fully Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {myEnrollments.length === 0 && (
                  <div className="text-center py-12 space-y-3">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto stroke-1" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">You are not enrolled in any courses yet.</p>
                    <p className="text-xs text-muted-foreground">Browse the company learning catalogue and self-enroll in technical, compliance, or leadership tracks.</p>
                    <Button className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs mt-2" onClick={() => setActiveTab('catalogue')}>
                      Browse Course Catalogue
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          ADMIN TAB 1: EXECUTIVE DASHBOARD
      ========================================================================== */}
      {isAdmin && activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground font-semibold">Completion Ratio</p>
                  <h3 className="text-2xl font-bold">
                    {enrollments.length > 0 ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100) : 100}%
                  </h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl"><BookOpen className="h-5 w-5 text-indigo-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Published Courses</p>
                  <h3 className="text-2xl font-bold">{programs.length} Modules</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl"><Award className="h-5 w-5 text-amber-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Logged Certifications</p>
                  <h3 className="text-2xl font-bold">{certificationsList.length} Accreditations</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#f87941]" />
                  Competency Framework & Skills Coverage
                </CardTitle>
                <CardDescription>Live database mapping of required competencies against workforce matrix records.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-3 border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Company Designation Framework</span>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">
                      {competencies.length} Competencies Active
                    </Badge>
                  </div>
                  <p className="text-slate-500">
                    Target skills configured for roles: {Array.from(new Set(competencies.map(c => c.designation))).join(', ') || 'None set'}.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-[#f87941]/30 hover:bg-[#f87941]/5 text-[#f87941]" onClick={() => setActiveTab('enrolments')}>
                      Nominate Employee
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-slate-500" onClick={() => setActiveTab('competency')}>
                      Manage Framework
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-3 border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Classroom Scheduling Index</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                      {sessions.length} Sessions Scheduled
                    </Badge>
                  </div>
                  <p className="text-slate-500">
                    Instructors directory has {instructors.length} registered trainers with active course delivery slots.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50" onClick={() => setActiveTab('schedules')}>
                      View Schedules
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader><CardTitle className="text-md">Popular Learning Modules</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs">
                {programs.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="p-3 border rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{p.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.category} • {p.difficulty_level} • {p.duration_hours}h</p>
                    </div>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">#{i + 1}</Badge>
                  </div>
                ))}
                {programs.length === 0 && <p className="text-slate-400 italic py-4 text-center">No catalogued courses found in database.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LEARNING CATALOGUE (Admin & Employee)
      ========================================================================== */}
      {activeTab === 'catalogue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Admin Course Creation Form */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-[#f87941]" /> Define Catalogue Course
                  </CardTitle>
                  <CardDescription>Configure course parameters, difficulty, pricing, and credits.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={createProgram} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="prog-code">Course Code</Label>
                        <Input id="prog-code" placeholder="e.g. GIT-101" value={progCode} onChange={e => setProgCode(e.target.value)} required className="h-8 text-xs mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="prog-title">Course Title</Label>
                        <Input id="prog-title" placeholder="Advanced Git" value={progTitle} onChange={e => setProgTitle(e.target.value)} required className="h-8 text-xs mt-1" />
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
                          <option value="Security">Security</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="prog-subcategory">Subcategory</Label>
                        <Input id="prog-subcategory" placeholder="e.g. CI/CD" value={progSubcat} onChange={e => setProgSubcat(e.target.value)} className="h-8 text-xs mt-1" />
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
                        <Input id="prog-inst" placeholder="Trainer name" value={progInstructor} onChange={e => setProgInstructor(e.target.value)} className="h-8 text-xs mt-1" />
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
                    <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                      {submitting ? 'Publishing...' : 'Publish Course Program'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Catalogue List */}
          <div className={isAdmin ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-md">Course Catalogue Directory</CardTitle>
                    <CardDescription>Browse available training modules, curriculum, and enroll.</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search courses..."
                        value={catalogueSearch}
                        onChange={e => setCatalogueSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <select
                      value={catalogueCategoryFilter}
                      onChange={e => setCatalogueCategoryFilter(e.target.value)}
                      className="border rounded-lg px-2 bg-transparent text-xs border-input h-8 outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Technical">Technical</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Security">Security</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Leadership">Leadership</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {filteredPrograms.map(p => {
                    const isEnrolled = enrollments.some(e => e.program_id === p.id && (!selectedEmpId || e.employee_id === selectedEmpId));
                    return (
                      <div key={p.id} className="p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#f87941] font-bold bg-[#f87941]/10 px-1.5 py-0.5 rounded">
                              {p.code || 'LMS'}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.title}</span>
                          </div>
                          <p className="text-slate-500 leading-relaxed">{p.description || 'No description recorded.'}</p>
                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                            <span>Category: <strong className="text-slate-600 dark:text-slate-300">{p.category}</strong></span>
                            <span>Difficulty: <strong className="text-slate-600 dark:text-slate-300">{p.difficulty_level}</strong></span>
                            <span>Duration: <strong className="text-slate-600 dark:text-slate-300">{p.duration_hours}h</strong></span>
                            <span>Credits: <strong className="text-slate-600 dark:text-slate-300">{p.ce_credits || 0} pts</strong></span>
                            <span>Method: <strong className="text-slate-600 dark:text-slate-300">{p.delivery_method}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isEnrolled ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold px-3 py-1 text-xs">
                              <Check className="h-3 w-3 mr-1" /> Enrolled
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-semibold h-8"
                              onClick={() => selfEnroll(p.id)}
                              disabled={submitting}
                            >
                              Enroll Now
                            </Button>
                          )}
                          {isAdmin && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 h-8 w-8"
                              onClick={() => deleteProgram(p.id, p.title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredPrograms.length === 0 && (
                    <p className="text-slate-400 italic py-8 text-center">No courses match the criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CLASS SCHEDULES / CALENDAR (Admin & Employee)
      ========================================================================== */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Admin Schedule Creation Form */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-[#f87941]" /> Schedule Class Session
                  </CardTitle>
                  <CardDescription>Book trainer, classroom, meeting link, and capacity.</CardDescription>
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
                        <Input id="sess-link" placeholder="https://meet.google.com/..." value={sessLink} onChange={e => setSessLink(e.target.value)} className="h-8 text-xs mt-1" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="sess-capacity">Capacity Limit</Label>
                        <Input id="sess-capacity" type="number" value={sessCapacity} onChange={e => setSessCapacity(e.target.value)} className="h-8 text-xs mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="sess-wait">Waitlist Limit</Label>
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
          )}

          {/* Schedules List */}
          <div className={isAdmin ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Scheduled Training Classes</CardTitle>
                <CardDescription>Live classroom, workshop, and webinar session slots.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {sessions.map(s => (
                    <div key={s.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            {s.training_programs?.title || 'Course Session'}
                          </p>
                          <p className="text-slate-400 mt-0.5">Instructor: {s.training_instructors?.name || 'Assigned Lead'}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase tracking-wider font-bold">
                          {s.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#f87941]" /> Start: {new Date(s.start_date).toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#f87941]" /> Venue: {s.venue || 'Virtual Online'}</span>
                        {s.meeting_link && (
                          <a href={s.meeting_link} target="_blank" rel="noreferrer" className="text-[#f87941] underline flex items-center gap-1 font-semibold">
                            <Share2 className="h-3.5 w-3.5" /> Join Live Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && <p className="text-slate-400 italic py-8 text-center">No active class schedules mapped yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN TAB 4: NOMINATIONS & ENROLMENTS
      ========================================================================== */}
      {isAdmin && activeTab === 'enrolments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><UserCheck className="h-4.5 w-4.5 text-[#f87941]" /> Nominate Employee</CardTitle>
                <CardDescription>Nominate any employee into course or scheduled session.</CardDescription>
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
                  {enrollments.map(e => {
                    const empName = employees.find(emp => emp.id === e.employee_id);
                    return (
                      <div key={e.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{e.training_programs?.title || 'Program'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Enrolled: <strong className="text-slate-700 dark:text-slate-300">{empName ? `${empName.firstName} ${empName.lastName}` : `Employee #${e.employee_id}`}</strong> • Mode: <span className="font-semibold uppercase text-slate-500">{e.enrolment_type || 'self'}</span>
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <Badge className={`capitalize font-semibold border-none ${e.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{e.status}</Badge>
                              <p className="text-[10px] text-slate-400 mt-1">{e.progress_percentage}% completed</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-rose-500 h-8 w-8 p-0" onClick={() => deleteEnrollment(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {e.status !== 'completed' && (
                          <div className="flex gap-2 mt-4 justify-end border-t pt-3">
                            <Button size="sm" variant="outline" className="text-xs h-7 border-[#f87941]/30 text-[#f87941] hover:bg-[#f87941]/5" onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, false)}>+25% Progress</Button>
                            <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateEnrollmentProgress(e.id, e.progress_percentage, true)}>Complete Track</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {enrollments.length === 0 && <p className="text-slate-400 italic py-8 text-center">No logged enrolments mapped in learning tracks.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5 / EMPLOYEE TAB: SKILLS MATRIX & COMPETENCY FRAMEWORK
      ========================================================================== */}
      {((isAdmin && activeTab === 'competency') || (!isAdmin && activeTab === 'skills')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            {/* Add Competency Constraint (Admin Only) */}
            {isAdmin && (
              <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Competency Rule</CardTitle>
                  <CardDescription>Model expected skill proficiencies by organizational roles.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={createCompetencyRule} className="space-y-3 text-xs">
                    <div>
                      <Label htmlFor="comp-designation">Select Designation</Label>
                      <select id="comp-designation" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={compDesignation} onChange={e => setCompDesignation(e.target.value)}>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Senior Software Engineer">Senior Software Engineer</option>
                        <option value="Lead Architect">Lead Architect</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                        <option value="QA Engineer">QA Engineer</option>
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
            )}

            {/* Add Skill to Matrix (Both Admin & Employee) */}
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                  <Plus className="h-4.5 w-4.5 text-[#f87941]" />
                  {isAdmin ? 'Add Employee Skill Matrix' : 'Add Skill to My Profile'}
                </CardTitle>
                <CardDescription>Log technical competencies and years of experience.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={addSkill} className="space-y-3 text-xs">
                  {isAdmin && (
                    <div>
                      <Label htmlFor="matrix-emp">Select Employee Target</Label>
                      <select id="matrix-emp" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={selectedEmpId || ''} onChange={e => {
                        const empId = Number(e.target.value);
                        handleEmployeeFocusChange(empId);
                      }}>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="matrix-skill">Skill Name</Label>
                    <Input id="matrix-skill" placeholder="e.g. React.js, TypeScript, Docker" value={skillName} onChange={e => setSkillName(e.target.value)} required className="h-9 mt-1 text-xs" />
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
                      <Input id="matrix-exp" type="number" placeholder="2" value={skillExp} onChange={e => setSkillExp(e.target.value)} className="h-9 mt-1 text-xs" />
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
            {/* Target Skill Framework */}
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">
                  {isAdmin ? 'Designations Target Skill Framework' : `Expected Competencies for ${empDesignation}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(isAdmin ? competencies : designationCompetencies).map(c => (
                    <div key={c.id} className="p-3 border rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{c.designation}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Skill requirement: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.skill_name}</span></p>
                      </div>
                      <Badge className="bg-slate-150 text-slate-700 border-none font-bold uppercase tracking-wider">{c.required_level}</Badge>
                    </div>
                  ))}
                  {(isAdmin ? competencies : designationCompetencies).length === 0 && (
                    <p className="col-span-full text-slate-400 italic py-6 text-center">No competency constraints registered for this designation yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Active Skills Matrix from DB */}
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">
                  {isAdmin 
                    ? `Active Skills Matrix (${employees.find(emp => emp.id === selectedEmpId)?.firstName || 'Selected Employee'})` 
                    : 'My Logged Technical Skills Matrix'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {skills.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{s.skill_name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{s.years_of_experience || 0} yrs experience</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={`capitalize font-semibold border-none ${
                          s.proficiency_level === 'expert' ? 'bg-purple-500/10 text-purple-500' :
                          s.proficiency_level === 'advanced' ? 'bg-[#f87941]/10 text-[#f87941]' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {s.proficiency_level}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-rose-500 h-6 w-6 p-0" onClick={() => deleteSkill(s.id, s.skill_name)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="col-span-full text-slate-400 italic py-8 text-center">No skill records logged in database yet. Add your skills using the form.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6 / EMPLOYEE TAB: ACCREDITATIONS & EXAM CENTRE (100% DB-BACKED)
      ========================================================================== */}
      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add Certification Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-[#f87941]" /> 
                  {isAdmin ? 'Add Vendor Accreditation' : 'Upload My Certification'}
                </CardTitle>
                <CardDescription>Log credential verification, issuing organization, and validity dates.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={saveCertification} className="space-y-3 text-xs">
                  {isAdmin && (
                    <div>
                      <Label htmlFor="cert-emp">Accredited Employee</Label>
                      <select id="cert-emp" className="w-full border rounded-lg p-2 mt-1 bg-transparent text-xs border-input h-9 outline-none" value={certEmployeeId || ''} onChange={e => {
                        const empId = Number(e.target.value);
                        handleEmployeeFocusChange(empId);
                      }}>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                      </select>
                    </div>
                  )}
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
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Logging...' : 'Save Certification Record'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Database-Backed Interactive Exam Suite */}
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Timer className="h-4.5 w-4.5 text-[#f87941]" /> Interactive Exam Suite (Database Powered)
                  </CardTitle>
                  <CardDescription>Live assessments configured in company training database.</CardDescription>
                </div>
                {!quizActive && assessments.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedAssessmentId || ''}
                      onChange={e => setSelectedAssessmentId(Number(e.target.value))}
                      className="border rounded-lg px-2 bg-transparent text-xs border-input h-8 outline-none max-w-[200px]"
                    >
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                    <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs h-8" onClick={startQuiz}>
                      Start Exam Paper
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {quizActive && activeAssessment ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                      <span className="font-bold text-red-500">{activeAssessment.title}</span>
                      <span className="flex items-center gap-1.5 font-bold text-red-500">
                        <Clock className="h-4 w-4 animate-spin" /> Timer: {Math.floor(quizTimer / 60)}m {quizTimer % 60}s
                      </span>
                    </div>

                    {!quizSubmitted ? (
                      <div className="space-y-4 pt-2">
                        {assessmentQuestions.map((q: any, idx: number) => (
                          <div key={q.id} className="p-4 border rounded-xl space-y-2.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{idx + 1}. {q.text}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt: string) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => selectQuizAnswer(q.id, opt)}
                                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all text-xs ${
                                    selectedQuizAnswers[q.id] === opt 
                                      ? 'border-[#f87941] bg-[#f87941]/5 font-semibold text-slate-800 dark:text-slate-200' 
                                      : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 mt-4" onClick={evaluateQuiz}>
                          Submit Exam Paper
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 border rounded-xl space-y-3 text-center animate-fadeIn">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                          quizScore >= (activeAssessment.pass_percentage || 70) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {quizScore >= (activeAssessment.pass_percentage || 70) ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
                        </div>
                        <h3 className="text-lg font-bold">Exam Result: {quizScore}%</h3>
                        <p className="text-slate-400">Passing score constraint: {activeAssessment.pass_percentage || 70}%</p>
                        <p className="text-slate-500 font-semibold">
                          {quizScore >= (activeAssessment.pass_percentage || 70) 
                            ? "Congratulations! Your digital certificate has been verified and registered directly into the database certifications table." 
                            : "You did not achieve the required threshold. Please review course materials and retry."}
                        </p>
                        <Button variant="outline" className="mt-2 text-slate-600 border-slate-200 text-xs h-8" onClick={() => setQuizActive(false)}>
                          Return to Exam Suite
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    {assessments.length > 0 ? (
                      <p className="italic">Select an assessment paper from the dropdown above and click "Start Exam Paper" to begin the timed test.</p>
                    ) : (
                      <p className="italic">No active exam papers registered in database.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accreditations List from DB */}
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">
                  {isAdmin ? 'Logged Accreditations & Certifications' : 'My Logged Certifications & Accreditations'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs">
                  {certificationsList.map(c => (
                    <div key={c.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.name}</p>
                        <p className="text-slate-500 mt-0.5">Issuing Body: <strong className="text-slate-700 dark:text-slate-300">{c.issuing_organization}</strong></p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Cred ID: {c.credential_id || 'N/A'} • Expiration: {c.expiry_date || 'Lifetime validity'}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none uppercase font-bold tracking-wider">{c.verification_status}</Badge>
                        <Button size="sm" variant="ghost" className="text-rose-500 h-8 w-8 p-0" onClick={() => deleteCertification(c.id, c.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {certificationsList.length === 0 && <p className="text-slate-400 italic py-6 text-center">No certifications logged in database for this profile.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN TAB 7: TRAINER REGISTRY
      ========================================================================== */}
      {isAdmin && activeTab === 'instructors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Trainer Profile</CardTitle>
                <CardDescription>Register qualifications, contractor hourly rates, and availability.</CardDescription>
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
                    {submitting ? 'Registering...' : 'Register Trainer Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Instructors & Mentors Directory</CardTitle>
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

      {/* =========================================================================
          ADMIN TAB 8: FORENSIC AUDIT LOGS & ATTENDANCE
      ========================================================================== */}
      {isAdmin && activeTab === 'audits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Live Session Attendance Records */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#f87941]" /> Live Session Attendance Ledger
                </CardTitle>
                <CardDescription>Verified attendance check-ins recorded in database for sessions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                {attendanceList.map(att => (
                  <div key={att.id} className="p-3 border rounded-xl space-y-1 hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Date: {att.date}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold uppercase text-[10px]">
                        {att.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Method: <strong className="text-slate-700 dark:text-slate-300 capitalize">{att.verification_method?.replace(/_/g, ' ') || 'Digital Check-in'}</strong>
                    </p>
                    {att.checkin_gps_lat && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        GPS: Lat {att.checkin_gps_lat}, Lng {att.checkin_gps_long}
                      </p>
                    )}
                  </div>
                ))}
                {attendanceList.length === 0 && (
                  <p className="text-slate-400 italic py-6 text-center">No attendance check-ins recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Immutable Forensic Audit Logs */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Immutable Compliance Forensic Audit Trail</CardTitle>
                <CardDescription>Live security and operational event logs from database audit trail.</CardDescription>
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
