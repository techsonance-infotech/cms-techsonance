import { redirect } from 'next/navigation';

export default function AttendancePoliciesPage() {
  redirect('/dashboard/attendance?tab=attendance-settings');
}
