import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";

/**
 * Role selection component displayed as the first step of registration.
 * Renders two prominent cards for Student and Teacher roles.
 *
 * @param {Object} props
 * @param {Function} props.onSelect - Callback fired with "STUDENT" or "TEACHER"
 */
const RoleSelector = ({ onSelect }) => {
  const roles = [
    {
      value: "STUDENT",
      label: "Student",
      description: "Join classes & mark attendance",
      icon: GraduationCap,
      color: "indigo",
    },
    {
      value: "TEACHER",
      label: "Teacher",
      description: "Create sessions & manage classes",
      icon: BookOpen,
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 font-medium text-center mb-4">
        I am a...
      </p>
      <div className="grid grid-cols-2 gap-3">
        {roles.map(({ value, label, description, icon: Icon, color }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`group flex flex-col items-center p-5 rounded-xl border-2 border-slate-200 bg-white hover:border-${color}-400 hover:bg-${color}-50/50 transition-all duration-200 cursor-pointer active:scale-[0.97]`}
            style={{
              "--hover-border": color === "indigo" ? "#818cf8" : "#34d399",
              "--hover-bg":
                color === "indigo"
                  ? "rgba(238,242,255,0.5)"
                  : "rgba(236,253,245,0.5)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor =
                e.currentTarget.style.getPropertyValue("--hover-border");
              e.currentTarget.style.backgroundColor =
                e.currentTarget.style.getPropertyValue("--hover-bg");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                backgroundColor: color === "indigo" ? "#eef2ff" : "#ecfdf5",
              }}
            >
              <Icon
                className="h-6 w-6"
                style={{
                  color: color === "indigo" ? "#6366f1" : "#10b981",
                }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700">{label}</span>
            <span className="text-xs text-slate-400 mt-1 text-center">
              {description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
