"use client";

import { SCHOOLS, schoolShortLabel, type School } from "@/lib/school";
import { useSchool } from "@/components/SchoolProvider";

export default function SchoolPicker({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { school, setSchool, ready } = useSchool();

  return (
    <div
      role="group"
      aria-label="School"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 3,
        borderRadius: 10,
        background: "#F4F4F0",
        border: "1px solid #E8E8E3",
        opacity: ready ? 1 : 0.7,
      }}
    >
      {SCHOOLS.map((s: School) => {
        const active = school === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setSchool(s)}
            style={{
              padding: compact ? "5px 10px" : "7px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: compact ? 12 : 13,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: active ? "#FFFFFF" : "transparent",
              color: active ? "#3B3BFF" : "#4A4A44",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              letterSpacing: "-0.01em",
            }}
          >
            {schoolShortLabel(s)}
          </button>
        );
      })}
    </div>
  );
}
