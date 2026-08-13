"use client";

import { Suspense, type ReactNode } from "react";
import { SchoolProvider } from "@/components/SchoolProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <SchoolProvider>{children}</SchoolProvider>
    </Suspense>
  );
}
