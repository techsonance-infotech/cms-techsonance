'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CapacityProjectsRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/employees/resource-allocation?tab=forecasting');
  }, [router]);

  return null;
}
