'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Check, 
  Upload, 
  FileText, 
  Shield, 
  DollarSign, 
  Users, 
  Briefcase, 
  User, 
  PhoneCall, 
  Info,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const STEPS = [
  { id: 'personal', name: 'Personal Info', icon: User, desc: 'Name, contact, ID details' },
  { id: 'work', name: 'Work Profile', icon: Briefcase, desc: 'Role, department, manager' },
  { id: 'payroll', name: 'Payroll & CTC', icon: DollarSign, desc: 'Salary, bank account, taxes' },
  { id: 'documents', name: 'Documents', icon: FileText, desc: 'KYC, resume, certificates' },
  { id: 'access', name: 'System Access', icon: Shield, desc: 'Credentials & permissions' },
  { id: 'emergency', name: 'Emergency Contact', icon: PhoneCall, desc: 'Primary contact person' },
  { id: 'additional', name: 'Additional Info', icon: Info, desc: 'Social profile & bio' },
  { id: 'review', name: 'Review & Submit', icon: Check, desc: 'Verify all details' },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState('personal');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Section observer refs
  const sectionRefs = {
    personal: useRef<HTMLDivElement>(null),
    work: useRef<HTMLDivElement>(null),
    payroll: useRef<HTMLDivElement>(null),
    documents: useRef<HTMLDivElement>(null),
    access: useRef<HTMLDivElement>(null),
    emergency: useRef<HTMLDivElement>(null),
    additional: useRef<HTMLDivElement>(null),
    review: useRef<HTMLDivElement>(null),
  };

  // Form State
  const [formData, setFormData] = useState({
    // User Profile
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    username: '',
    officeEmail: '',
    accountExpiryDate: '',
    password: '',
    role: 'Employee',

    // Employee Profile
    employeeId: '',
    maritalStatus: '',
    bloodGroup: '',
    nationality: '',
    personalIdNumber: '',
    department: '',
    designation: '',
    employmentType: 'Full-Time',
    dateOfJoining: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    managerId: '',
    status: 'active',
    probationPeriod: '',
    confirmationDate: '',
    workLocation: '',
    workShift: '',
    noticePeriod: '',

    // Compensation & Payroll
    salary: '',
    hourlyRate: '',
    ctc: '',
    currency: 'INR',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    branchName: '',
    pfNumber: '',
    uanNumber: '',
    esiNumber: '',
    panNumber: '',
    aadhaarNumber: '',

    // Documents Urls
    aadhaarCardUrl: '',
    panCardUrl: '',
    addressProofUrl: '',
    educationCertificateUrl: '',
    experienceCertificateUrl: '',
    resumeUrl: '',

    // Permissions (custom json string / array)
    permissions: '["read:dashboard"]',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    emergencyContactAddress: '',

    // Additional Info
    languagesKnown: '',
    linkedinProfile: '',
    githubProfile: '',
    previousCompany: '',
    referralSource: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Fetch potential managers
  useEffect(() => {
    async function fetchManagers() {
      setLoadingManagers(true);
      try {
        const token = getStoredSessionToken();
        const res = await fetch('/api/users?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter admin and managers
          const candidates = data.filter((u: any) => u.role === 'Admin' || u.role === 'Manager');
          setManagers(candidates);
        }
      } catch (err) {
        console.error('Error fetching managers:', err);
      } finally {
        setLoadingManagers(false);
      }
    }
    fetchManagers();
  }, []);

  // Step-specific validation for wizard navigation
  const validateStep = (stepId: string) => {
    const newErrors: Record<string, string> = {};

    if (stepId === 'personal') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Valid email is required';
      }
    } else if (stepId === 'work') {
      if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
      if (!formData.department.trim()) newErrors.department = 'Department is required';
      if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
      if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Joining Date is required';
    } else if (stepId === 'access') {
      if (!formData.password) {
        newErrors.password = 'Initial password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(STEPS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    if (!validateStep(activeStep)) {
      toast.error('Please resolve validation errors before continuing.');
      return;
    }
    const currentIndex = STEPS.findIndex((s) => s.id === activeStep);
    if (currentIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepId: string) => {
    const targetIdx = STEPS.findIndex((s) => s.id === stepId);
    const currentIdx = STEPS.findIndex((s) => s.id === activeStep);

    if (targetIdx > currentIdx) {
      if (!validateStep(activeStep)) {
        toast.error('Please resolve validation errors in the current section.');
        return;
      }
    }

    setActiveStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Document Upload Handler (simulated with cloud secure URL string)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    // Simulate premium upload delay
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: `https://supabase-storage-mock.secure/docs/${file.name}`,
      }));
      setUploadingField(null);
      toast.success(`${file.name} uploaded successfully!`);
    }, 1200);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Personal info
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    // Work info
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Joining Date is required';

    // System access
    if (!formData.password) {
      newErrors.password = 'Initial password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please check validation errors in the form.');
      // Scroll to the first error section
      if (errors.firstName || errors.lastName || errors.email) {
        setActiveStep('personal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (errors.employeeId || errors.department || errors.designation) {
        setActiveStep('work');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (errors.password) {
        setActiveStep('access');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const token = getStoredSessionToken();

      // 1. Create User
      const userPayload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone || undefined,
        username: formData.username || undefined,
        middleName: formData.middleName || undefined,
        gender: formData.gender,
        officeEmail: formData.officeEmail || undefined,
        accountExpiryDate: formData.accountExpiryDate || undefined,
      };

      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userPayload)
      });

      if (!userRes.ok) {
        const errorData = await userRes.json();
        throw new Error(errorData.message || 'Failed to register authentication user account');
      }

      const createdUser = await userRes.json();
      const newUserId = createdUser.id; // Legacy numeric user ID

      // 2. Create Employee Linked Profile
      const employeePayload = {
        userId: newUserId,
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        employmentType: formData.employmentType,
        dateOfJoining: formData.dateOfJoining,
        dateOfBirth: formData.dateOfBirth || undefined,
        managerId: formData.managerId ? Number(formData.managerId) : undefined,
        status: formData.status,
        probationPeriod: formData.probationPeriod || undefined,
        confirmationDate: formData.confirmationDate || undefined,
        workLocation: formData.workLocation || undefined,
        workShift: formData.workShift || undefined,
        noticePeriod: formData.noticePeriod || undefined,
        
        salary: formData.salary ? Number(formData.salary) : undefined,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
        ctc: formData.ctc ? Number(formData.ctc) : undefined,
        currency: formData.currency,
        bankName: formData.bankName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        ifscCode: formData.ifscCode || undefined,
        branchName: formData.branchName || undefined,
        pfNumber: formData.pfNumber || undefined,
        uanNumber: formData.uanNumber || undefined,
        esiNumber: formData.esiNumber || undefined,
        panNumber: formData.panNumber || undefined,
        aadhaarNumber: formData.aadhaarNumber || undefined,

        aadhaarCardUrl: formData.aadhaarCardUrl || undefined,
        panCardUrl: formData.panCardUrl || undefined,
        addressProofUrl: formData.addressProofUrl || undefined,
        educationCertificateUrl: formData.educationCertificateUrl || undefined,
        experienceCertificateUrl: formData.experienceCertificateUrl || undefined,
        resumeUrl: formData.resumeUrl || undefined,

        permissions: formData.permissions ? JSON.parse(formData.permissions) : undefined,

        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        emergencyContactAddress: formData.emergencyContactAddress || undefined,

        languagesKnown: formData.languagesKnown || undefined,
        linkedinProfile: formData.linkedinProfile || undefined,
        githubProfile: formData.githubProfile || undefined,
        previousCompany: formData.previousCompany || undefined,
        referralSource: formData.referralSource || undefined,
        notes: formData.notes || undefined,
        gender: formData.gender,
      };

      const employeeRes = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(employeePayload)
      });

      if (!employeeRes.ok) {
        const errorData = await employeeRes.json();
        throw new Error(errorData.message || 'Failed to create employee profile mapping');
      }

      toast.success('Employee successfully onboarded!');
      router.push('/dashboard/employees');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during employee creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#fdfcfc] md:text-3xl">Add New Employee</h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">Create a complete employee profile and onboard them into the organization.</p>
        </div>
        <Link href="/dashboard/employees">
          <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* Left Side: Sticky Progress Tracker */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-none">
          <div className="flex flex-col gap-1 border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 ml-4 py-2">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === step.id;
              const isCompleted = idx < STEPS.findIndex((s) => s.id === activeStep);
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className="flex items-start gap-4 pl-4 py-3 text-left relative transition-all duration-300 group outline-none"
                >
                  {/* Indicator Line segment */}
                  <div className={`absolute left-[-1px] top-0 bottom-0 w-[2px] transition-all duration-300 ${
                    isActive ? 'bg-[#f87941]' : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`} />
                  
                  {/* Step index sphere */}
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-300 text-xs font-bold ${
                    isActive 
                      ? 'border-[#f87941] bg-[#f87941] text-white shadow-[0_0_12px_rgba(248,121,65,0.2)]' 
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-[#e6e4e6]/30 dark:border-[#2f3035]/30 bg-white dark:bg-[#1E1F22] text-[#b1b1b1] group-hover:border-[#e6e4e6]/50 dark:group-hover:border-[#2f3035]/50 group-hover:text-slate-700 dark:group-hover:text-zinc-100'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                  </div>

                  <div>
                    <span className={`block text-sm font-semibold transition-all duration-300 ${
                      isActive ? 'text-[#f87941] font-bold' : 'text-[#b1b1b1] group-hover:text-slate-700 dark:group-hover:text-zinc-100'
                    }`}>
                      {step.name}
                    </span>
                    <span className="block text-xs text-[#b1b1b1]/70 mt-0.5 line-clamp-1">{step.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Section Content */}
        <div className="lg:col-span-9 flex flex-col gap-8">

        {/* Right Side: Active Section Content */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {/* Section 1: Personal Info */}
          {activeStep === 'personal' && (
          <div ref={sectionRefs.personal} id="personal" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#f87941]" /> Personal Information
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Basic personal, identification, and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="firstName" className="text-slate-700 dark:text-[#fdfcfc]">First Name <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <span className="text-xs text-red-500 mt-1 block">{errors.firstName}</span>}
                </div>
                <div>
                  <Label htmlFor="middleName" className="text-slate-700 dark:text-[#fdfcfc]">Middle Name</Label>
                  <Input 
                    id="middleName" 
                    name="middleName" 
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-slate-700 dark:text-[#fdfcfc]">Last Name <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <span className="text-xs text-red-500 mt-1 block">{errors.lastName}</span>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700 dark:text-[#fdfcfc]">Primary Email <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="personal@company.com"
                  />
                  {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-700 dark:text-[#fdfcfc]">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-slate-700 dark:text-[#fdfcfc]">Gender</Label>
                  <select 
                    id="gender" 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Male" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Male</option>
                    <option value="Female" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Female</option>
                    <option value="Other" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-slate-700 dark:text-[#fdfcfc]">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                </div>
                <div>
                  <Label htmlFor="maritalStatus" className="text-slate-700 dark:text-[#fdfcfc]">Marital Status</Label>
                  <select 
                    id="maritalStatus" 
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select status</option>
                    <option value="Single" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Single</option>
                    <option value="Married" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Married</option>
                    <option value="Divorced" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Divorced</option>
                    <option value="Widowed" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Widowed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="bloodGroup" className="text-slate-700 dark:text-[#fdfcfc]">Blood Group</Label>
                  <Input 
                    id="bloodGroup" 
                    name="bloodGroup" 
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. O+, A-"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality" className="text-slate-700 dark:text-[#fdfcfc]">Nationality</Label>
                  <Input 
                    id="nationality" 
                    name="nationality" 
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Indian"
                  />
                </div>
                <div>
                  <Label htmlFor="personalIdNumber" className="text-slate-700 dark:text-[#fdfcfc]">Personal ID Number (SSN/Govt ID)</Label>
                  <Input 
                    id="personalIdNumber" 
                    name="personalIdNumber" 
                    value={formData.personalIdNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter personal identification number"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                    disabled={true}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 2: Work Info */}
          {activeStep === 'work' && (
          <div ref={sectionRefs.work} id="work" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#f87941]" /> Work Profile
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Positioning, manager relationship, location, and dates.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="employeeId" className="text-slate-700 dark:text-[#fdfcfc]">Employee ID <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="employeeId" 
                    name="employeeId" 
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="EMP-0000"
                  />
                  {errors.employeeId && <span className="text-xs text-red-500 mt-1 block">{errors.employeeId}</span>}
                </div>
                <div>
                  <Label htmlFor="department" className="text-slate-700 dark:text-[#fdfcfc]">Department <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="department" 
                    name="department" 
                    value={formData.department}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Engineering"
                  />
                  {errors.department && <span className="text-xs text-red-500 mt-1 block">{errors.department}</span>}
                </div>
                <div>
                  <Label htmlFor="designation" className="text-slate-700 dark:text-[#fdfcfc]">Designation <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="designation" 
                    name="designation" 
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Senior Developer"
                  />
                  {errors.designation && <span className="text-xs text-red-500 mt-1 block">{errors.designation}</span>}
                </div>
                <div>
                  <Label htmlFor="employmentType" className="text-slate-700 dark:text-[#fdfcfc]">Employment Type</Label>
                  <select 
                    id="employmentType" 
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Full-Time" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Full-Time</option>
                    <option value="Part-Time" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Part-Time</option>
                    <option value="Contract" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Contract</option>
                    <option value="Intern" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Intern</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateOfJoining" className="text-slate-700 dark:text-[#fdfcfc]">Date of Joining <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="dateOfJoining" 
                    name="dateOfJoining" 
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                  {errors.dateOfJoining && <span className="text-xs text-red-500 mt-1 block">{errors.dateOfJoining}</span>}
                </div>
                <div>
                  <Label htmlFor="managerId" className="text-slate-700 dark:text-[#fdfcfc]">Reporting Manager</Label>
                  <select 
                    id="managerId" 
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                    disabled={loadingManagers}
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Reporting Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">{m.firstName} {m.lastName} ({m.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="probationPeriod" className="text-slate-700 dark:text-[#fdfcfc]">Probation Period (months)</Label>
                  <Input 
                    id="probationPeriod" 
                    name="probationPeriod" 
                    type="number"
                    value={formData.probationPeriod}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. 6"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmationDate" className="text-slate-700 dark:text-[#fdfcfc]">Confirmation Date</Label>
                  <Input 
                    id="confirmationDate" 
                    name="confirmationDate" 
                    type="date"
                    value={formData.confirmationDate}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                </div>
                <div>
                  <Label htmlFor="workLocation" className="text-slate-700 dark:text-[#fdfcfc]">Work Location</Label>
                  <Input 
                    id="workLocation" 
                    name="workLocation" 
                    value={formData.workLocation}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Bangalore Office"
                  />
                </div>
                <div>
                  <Label htmlFor="workShift" className="text-slate-700 dark:text-[#fdfcfc]">Work Shift</Label>
                  <Input 
                    id="workShift" 
                    name="workShift" 
                    value={formData.workShift}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. General (9 AM - 6 PM)"
                  />
                </div>
                <div>
                  <Label htmlFor="noticePeriod" className="text-slate-700 dark:text-[#fdfcfc]">Notice Period (days)</Label>
                  <Input 
                    id="noticePeriod" 
                    name="noticePeriod" 
                    type="number"
                    value={formData.noticePeriod}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. 90"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 3: Compensation & Payroll */}
          {activeStep === 'payroll' && (
          <div ref={sectionRefs.payroll} id="payroll" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#f87941]" /> Compensation & Payroll
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Salary structure, bank details, tax compliance numbers.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="salary" className="text-slate-700 dark:text-[#fdfcfc]">Monthly Base Salary</Label>
                  <Input 
                    id="salary" 
                    name="salary" 
                    type="number"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate" className="text-slate-700 dark:text-[#fdfcfc]">Hourly Rate</Label>
                  <Input 
                    id="hourlyRate" 
                    name="hourlyRate" 
                    type="number"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="ctc" className="text-slate-700 dark:text-[#fdfcfc]">CTC (Cost to Company) Annual</Label>
                  <Input 
                    id="ctc" 
                    name="ctc" 
                    type="number"
                    value={formData.ctc}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-slate-700 dark:text-[#fdfcfc]">Salary Currency</Label>
                  <Input 
                    id="currency" 
                    name="currency" 
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="INR"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName" className="text-slate-700 dark:text-[#fdfcfc]">Bank Name</Label>
                  <Input 
                    id="bankName" 
                    name="bankName" 
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccountNumber" className="text-slate-700 dark:text-[#fdfcfc]">Account Number</Label>
                  <Input 
                    id="bankAccountNumber" 
                    name="bankAccountNumber" 
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode" className="text-slate-700 dark:text-[#fdfcfc]">IFSC Code</Label>
                  <Input 
                    id="ifscCode" 
                    name="ifscCode" 
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="HDFC0001234"
                  />
                </div>
                <div>
                  <Label htmlFor="branchName" className="text-slate-700 dark:text-[#fdfcfc]">Branch Name</Label>
                  <Input 
                    id="branchName" 
                    name="branchName" 
                    value={formData.branchName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter branch name"
                  />
                </div>
                <div>
                  <Label htmlFor="pfNumber" className="text-slate-700 dark:text-[#fdfcfc]">Provident Fund (PF) No.</Label>
                  <Input 
                    id="pfNumber" 
                    name="pfNumber" 
                    value={formData.pfNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="PF-000000"
                  />
                </div>
                <div>
                  <Label htmlFor="uanNumber" className="text-slate-700 dark:text-[#fdfcfc]">Universal Account Number (UAN)</Label>
                  <Input 
                    id="uanNumber" 
                    name="uanNumber" 
                    value={formData.uanNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="100XXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="esiNumber" className="text-slate-700 dark:text-[#fdfcfc]">ESI Number</Label>
                  <Input 
                    id="esiNumber" 
                    name="esiNumber" 
                    value={formData.esiNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="ESI No."
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber" className="text-slate-700 dark:text-[#fdfcfc]">PAN Number</Label>
                  <Input 
                    id="panNumber" 
                    name="panNumber" 
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <Label htmlFor="aadhaarNumber" className="text-slate-700 dark:text-[#fdfcfc]">Aadhaar Number</Label>
                  <Input 
                    id="aadhaarNumber" 
                    name="aadhaarNumber" 
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="12-digit number"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 4: Documents & Compliance */}
          {activeStep === 'documents' && (
          <div ref={sectionRefs.documents} id="documents" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#f87941]" /> Documents & Compliance
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Onboarding attachments, proof of identity, educational qualifications.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {[
                  { id: 'aadhaarCardUrl', label: 'Aadhaar Card Copy' },
                  { id: 'panCardUrl', label: 'PAN Card Copy' },
                  { id: 'addressProofUrl', label: 'Address Proof' },
                  { id: 'educationCertificateUrl', label: 'Educational Certificates' },
                  { id: 'experienceCertificateUrl', label: 'Experience Letters' },
                  { id: 'resumeUrl', label: 'Resume/CV' },
                ].map((doc) => (
                  <div key={doc.id} className="border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg p-4 bg-[#e6e4e6]/5 dark:bg-[#2f3035]/5 flex flex-col justify-between min-h-[140px] hover:border-[#f87941]/50 transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.label}</span>
                      <p className="text-xs text-slate-500 dark:text-[#b1b1b1] mt-1">Upload verified PDF or image copy.</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Label htmlFor={doc.id} className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 text-slate-700 dark:text-[#fdfcfc] px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        {uploadingField === doc.id ? 'Uploading...' : 'Choose File'}
                      </Label>
                      <input 
                        type="file" 
                        id={doc.id} 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, doc.id)}
                        disabled={uploadingField !== null}
                      />
                      {formData[doc.id as keyof typeof formData] ? (
                        <span className="text-xs text-[#f87941] flex items-center gap-1.5 font-medium">
                          <Check className="h-3.5 w-3.5" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-[#b1b1b1]">No file uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-2 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 5: System Access */}
          {activeStep === 'access' && (
          <div ref={sectionRefs.access} id="access" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#f87941]" /> System Access & Credentials
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Establish authentication parameters and roles.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="username" className="text-slate-700 dark:text-[#fdfcfc]">Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    value={formData.username}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. john.doe"
                  />
                </div>
                <div>
                  <Label htmlFor="officeEmail" className="text-slate-700 dark:text-[#fdfcfc]">Office/Work Email</Label>
                  <Input 
                    id="officeEmail" 
                    name="officeEmail" 
                    type="email"
                    value={formData.officeEmail}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-700 dark:text-[#fdfcfc]">Initial Password <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="••••••••"
                  />
                  {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
                </div>
                <div>
                  <Label htmlFor="role" className="text-slate-700 dark:text-[#fdfcfc]">System Role</Label>
                  <select 
                    id="role" 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Employee" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Employee</option>
                    <option value="Manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Manager</option>
                    <option value="Admin" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Admin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="accountExpiryDate" className="text-slate-700 dark:text-[#fdfcfc]">Account Expiry Date</Label>
                  <Input 
                    id="accountExpiryDate" 
                    name="accountExpiryDate" 
                    type="date"
                    value={formData.accountExpiryDate}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="permissions" className="text-slate-700 dark:text-[#fdfcfc]">Custom System Permissions (JSON string)</Label>
                  <Input 
                    id="permissions" 
                    name="permissions" 
                    value={formData.permissions}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder='["read:dashboard"]'
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 6: Emergency Contact */}
          {activeStep === 'emergency' && (
          <div ref={sectionRefs.emergency} id="emergency" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-[#f87941]" /> Emergency Contact
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Primary family member or legal contact details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="emergencyContactName" className="text-slate-700 dark:text-[#fdfcfc]">Contact Name</Label>
                  <Input 
                    id="emergencyContactName" 
                    name="emergencyContactName" 
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelationship" className="text-slate-700 dark:text-[#fdfcfc]">Relationship</Label>
                  <Input 
                    id="emergencyContactRelationship" 
                    name="emergencyContactRelationship" 
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Spouse, Father"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-slate-700 dark:text-[#fdfcfc]">Phone Number</Label>
                  <Input 
                    id="emergencyContactPhone" 
                    name="emergencyContactPhone" 
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="emergencyContactAddress" className="text-slate-700 dark:text-[#fdfcfc]">Full Residential Address</Label>
                  <textarea 
                    id="emergencyContactAddress" 
                    name="emergencyContactAddress" 
                    value={formData.emergencyContactAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 outline-none" 
                    placeholder="Enter full address details"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 7: Additional Info */}
          {activeStep === 'additional' && (
          <div ref={sectionRefs.additional} id="additional" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#f87941]" /> Additional Information
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Social footprints, languages, referrals, and custom notes.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="languagesKnown" className="text-slate-700 dark:text-[#fdfcfc]">Languages Known</Label>
                  <Input 
                    id="languagesKnown" 
                    name="languagesKnown" 
                    value={formData.languagesKnown}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. English, Hindi"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinProfile" className="text-slate-700 dark:text-[#fdfcfc]">LinkedIn Profile URL</Label>
                  <Input 
                    id="linkedinProfile" 
                    name="linkedinProfile" 
                    value={formData.linkedinProfile}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label htmlFor="githubProfile" className="text-slate-700 dark:text-[#fdfcfc]">GitHub Profile URL</Label>
                  <Input 
                    id="githubProfile" 
                    name="githubProfile" 
                    value={formData.githubProfile}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="previousCompany" className="text-slate-700 dark:text-[#fdfcfc]">Previous Company</Label>
                  <Input 
                    id="previousCompany" 
                    name="previousCompany" 
                    value={formData.previousCompany}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Previous Employer Name"
                  />
                </div>
                <div>
                  <Label htmlFor="referralSource" className="text-slate-700 dark:text-[#fdfcfc]">Referral Source / Channel</Label>
                  <Input 
                    id="referralSource" 
                    name="referralSource" 
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Job Board, In-house"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="notes" className="text-slate-700 dark:text-[#fdfcfc]">Internal HR Notes</Label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 outline-none" 
                    placeholder="Any specific comments or notes regarding candidates onboarding..."
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 8: Review & Confirm */}
          {activeStep === 'review' && (
          <div ref={sectionRefs.review} id="review" className="scroll-mt-24">
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-[#f87941]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#f87941]" /> Review & Confirm
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Please review primary information prior to profile compilation.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-4 border border-gray-200 dark:border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Onboarding Name</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {formData.firstName} {formData.middleName} {formData.lastName || '(None)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Personal Email</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{formData.email || '(None)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Employee ID & Role</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {formData.employeeId || '(None)'} ({formData.designation || '(None)'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">System Access Role</span>
                    <span className="text-[#f87941] font-semibold">{formData.role}</span>
                  </div>
                </div>

                {/* Wizard Navigation Footer */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <div className="flex gap-4">
                    <Link href="/dashboard/employees">
                      <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc]">
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleSubmit} 
                      className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Onboarding...
                        </>
                      ) : (
                        <>
                          Complete Onboarding <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
