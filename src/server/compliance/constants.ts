// Catalog of all 12 Supported Compliance Operations Domains
export const COMPLIANCE_DOMAINS = [
  { id: 'Policy Acceptance', name: 'Policy Acceptance', description: 'Tracks employee digital signatures & acknowledgements on NDA, Code of Conduct & IT Policies.', slaHours: 24 },
  { id: 'Mandatory Training', name: 'Mandatory Training', description: 'Monitors completion of POSH, Information Security, Cyber Awareness & Ethics training.', slaHours: 48 },
  { id: 'Labour Compliance', name: 'Labour Compliance', description: 'Enforces statutory Labour Law rules, maximum weekly hours & mandatory rest gap regulations.', slaHours: 24 },
  { id: 'Document Compliance', name: 'Document Compliance', description: 'Validates mandatory KYC, government ID proofs, passport copies & tax identification documents.', slaHours: 48 },
  { id: 'Background Verification', name: 'Background Verification (BGV)', description: 'Tracks criminal background checks, past employment verification & address audits.', slaHours: 72 },
  { id: 'Medical Compliance', name: 'Medical Compliance', description: 'Monitors pre-employment medical fitments, drug screening & annual health checkup records.', slaHours: 48 },
  { id: 'Contract Compliance', name: 'Contract Compliance', description: 'Ensures active employment agreements, consultant SOWs & non-compete covenants.', slaHours: 48 },
  { id: 'Visa Compliance', name: 'Visa & Work Authorization', description: 'Tracks work permit validity, H-1B / L1 / Green Card expiration dates & legal stay compliance.', slaHours: 72 },
  { id: 'Certification Compliance', name: 'Certification Compliance', description: 'Verifies professional engineering licenses, cloud architecture & skill certifications.', slaHours: 72 },
  { id: 'Shift Compliance', name: 'Shift & Rest Gap Compliance', description: 'Monitors rotational night shift differentials & 11-hour mandatory rest gap rules.', slaHours: 12 },
  { id: 'Attendance Compliance', name: 'Attendance & Overtime Rules', description: 'Ensures biometrics punch accuracy & statutory overtime hour capping.', slaHours: 24 },
  { id: 'Payroll Compliance', name: 'Statutory Payroll & Tax', description: 'Monitors PF, ESI, Professional Tax, TDS withholding & annual Form 16 issuance.', slaHours: 24 }
];
