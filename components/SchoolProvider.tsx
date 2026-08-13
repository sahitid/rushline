"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  DEFAULT_SCHOOL,
  type School,
  normalizeSchool,
  resolveSchool,
  writeStoredSchool,
} from "@/lib/school";

type SchoolContextValue = {
  school: School;
  setSchool: (school: School) => void;
  ready: boolean;
};

const SchoolContext = createContext<SchoolContextValue>({
  school: DEFAULT_SCHOOL,
  setSchool: () => {},
  ready: false,
});

export function useSchool() {
  return useContext(SchoolContext);
}

function SchoolProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [school, setSchoolState] = useState<School>(DEFAULT_SCHOOL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = searchParams.get("school");
      let profileSchool: string | null = null;
      try {
        const sb = getSupabase();
        const { data } = await sb.auth.getUser();
        if (data.user) {
          const { data: prof } = await sb
            .from("profiles")
            .select("school")
            .eq("id", data.user.id)
            .maybeSingle();
          profileSchool = (prof?.school as string | null) ?? null;
        }
      } catch {
        /* guest */
      }
      if (cancelled) return;
      const next = resolveSchool({ querySchool: q, profileSchool });
      setSchoolState(next);
      writeStoredSchool(next);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const setSchool = useCallback(
    (next: School) => {
      const canonical = normalizeSchool(next) ?? DEFAULT_SCHOOL;
      setSchoolState(canonical);
      writeStoredSchool(canonical);

      const params = new URLSearchParams(searchParams.toString());
      params.set("school", canonical === "UC Berkeley" ? "berkeley" : "cornell");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      void (async () => {
        try {
          const sb = getSupabase();
          const { data } = await sb.auth.getUser();
          if (data.user) {
            await sb.from("profiles").update({ school: canonical }).eq("id", data.user.id);
          }
        } catch {
          /* ignore */
        }
      })();
    },
    [pathname, router, searchParams]
  );

  const value = useMemo(
    () => ({ school, setSchool, ready }),
    [school, setSchool, ready]
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  return <SchoolProviderInner>{children}</SchoolProviderInner>;
}
