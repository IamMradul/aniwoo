'use client';

import { useGSAPAnimations } from '@/hooks/useGSAPAnimations';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useGSAPAnimations();
  return <>{children}</>;
}
