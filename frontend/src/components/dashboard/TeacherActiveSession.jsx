import React, { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, Users, CheckCircle2, BookOpen, Download } from "lucide-react";

export const TeacherActiveSession = ({
  session,
  attendees,
  loading,
  startSession,
}) => {
  const [subjectInput, setSubjectInput] = useState("");
  const qrRef = useRef(null);

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current || !session) return;
    const svgEl = qrRef.current.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const padding = 32;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `QR_${session.subject.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    img.src = url;
  }, [session]);

  if (!session) {
    return (
      <div className="text-center py-12 sm:py-24 bg-white shadow-sm border border-gray-100 rounded-2xl max-w-2xl mx-auto px-4 sm:px-6">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-10 w-10 text-indigo-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Start a New Session
        </h3>
        <p className="mt-2 text-md text-gray-500 mb-8 max-w-sm mx-auto">
          Enter your subject name to generate a unique geolocation-locked QR
          code for your students.
        </p>
        <div className="max-w-sm mx-auto space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="e.g. Data Structures, React 101"
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm font-medium transition-shadow"
            />
          </div>
          <button
            onClick={() => {
              startSession(subjectInput);
              setSubjectInput("");
            }}
            disabled={loading || !subjectInput.trim()}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting Session...
              </>
            ) : (
              "Generate Session QR"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* QR Code Panel */}
      <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

        <h3 className="text-xl font-extrabold text-slate-800 mb-2 flex items-center tracking-tight">
          <MapPin className="mr-2 text-indigo-500 w-5 h-5" /> Live Session
        </h3>
        <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 mb-6">
          {session.subject}
        </div>

        <div
          ref={qrRef}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transform transition-transform hover:scale-105 duration-300 mb-4"
        >
          <QRCodeSVG
            value={session.id}
            size={200}
            level="H"
            includeMargin={false}
            className="w-full max-w-[240px] h-auto"
          />
        </div>

        <button
          onClick={handleDownloadQR}
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download QR
        </button>

        <p className="text-sm font-medium text-slate-500 text-center px-4 max-w-xs">
          Students must scan this code using their GeoAttend app while in the
          classroom.
        </p>
      </div>

      {/* Attendees Panel */}
      <div className="lg:col-span-7 bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <Users className="mr-2 text-indigo-500 w-4 h-4" /> Verified
            Attendees
          </h3>
          <div className="flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700">
              {attendees.length} Present
            </span>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto bg-white"
          style={{ maxHeight: "400px" }}
        >
          <ul className="divide-y divide-slate-100">
            {attendees.length === 0 ? (
              <li className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  Waiting for students to start scanning...
                </p>
              </li>
            ) : (
              attendees.map((record) => (
                <li
                  key={record.id}
                  className="px-6 py-4 hover:bg-white transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center">
                      <span className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner border border-indigo-100">
                        {(record.student.rollNo || record.student.name)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-bold text-gray-900">
                          {record.student.rollNo || record.student.name}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {record.student.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Verified
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
