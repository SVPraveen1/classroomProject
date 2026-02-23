import React from "react";
import { Loader2 } from "lucide-react";

export const GlobalLoader = ({
  fullScreen = false,
  message = "Loading...",
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-6 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
};
