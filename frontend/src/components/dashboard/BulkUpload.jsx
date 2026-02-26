import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { authService } from "../../services/auth.service";

export const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      parseCSV(selectedFile);
    }
  };

  // Maps CSV column headers (case-insensitive) to the exact field names the API expects
  const HEADER_MAP = {
    name: "name",
    email: "email",
    password: "password",
    role: "role",
    rollno: "rollNo",
    branchname: "branchName",
    guardianemail: "guardianEmail",
    guardianphone: "guardianPhone",
    department: "department",
  };

  const mapHeaders = (rawHeaders) =>
    rawHeaders.map((h) => HEADER_MAP[h.trim().toLowerCase()] || h.trim());

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error("CSV file is empty or missing headers.");
        }

        const headers = mapHeaders(lines[0].split(","));
        const requiredHeaders = ["name", "email", "password", "role"];

        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          throw new Error(`Missing required columns: ${missing.join(", ")}`);
        }

        const parsedData = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || "";
          });
          parsedData.push(rowObj);
        }

        setPreview(parsedData.slice(0, 5)); // Preview first 5
      } catch (err) {
        setError(err.message);
        setFile(null);
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        const headers = mapHeaders(lines[0].split(","));

        const fullData = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(",").map((v) => v.trim());
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || "";
          });
          fullData.push(rowObj);
        }

        const res = await authService.bulkRegister(fullData);
        setResult(res);
        setFile(null);
        setPreview([]);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to upload bulk users",
        );
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-4 sm:p-8 mb-8">
      <div className="mb-6">
        <p>
          Upload a CSV file. The CSV must include:{" "}
          <strong className="text-slate-700">
            name, email, password, role
          </strong>{" "}
        </p>

        <p>
          For students, also include:{" "}
          <strong className="text-slate-700">
            rollNo, branchName, guardianEmail, guardianPhone
          </strong>{" "}
        </p>
        <p>
          For teachers: <strong className="text-slate-700">department</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
            Upload File
          </h4>
          {/* File Drop Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative h-48">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Click to browse or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">CSV files only</p>
          </div>

          {error && (
            <div className="mt-4 flex items-center p-4 bg-red-50 rounded-xl text-red-700 border border-red-100 animation-fade-in">
              <ShieldAlert className="h-5 w-5 mr-3 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-4 p-5 bg-emerald-50 rounded-xl border border-emerald-100 animation-fade-in">
              <div className="flex items-center text-emerald-800 font-bold mb-2">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {result.message}
              </div>
              <ul className="text-sm text-emerald-700 list-disc list-inside space-y-1">
                <li>
                  Created: <strong>{result.createdCount}</strong> new users
                </li>
                <li>
                  Skipped: <strong>{result.skippedCount}</strong>{" "}
                  existing/invalid rows
                </li>
              </ul>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto border-t border-emerald-200/50 pt-2 text-xs text-red-600">
                  {result.errors.map((e, idx) => (
                    <div key={idx}>{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {file && !error && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium border border-slate-200 px-1.5 py-0.5 rounded inline-block mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`py-2 px-5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center shrink-0 ${
                  isUploading
                    ? "bg-indigo-100 text-indigo-500 cursor-wait"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                }`}
              >
                {isUploading ? "Uploading..." : "Upload Data"}
              </button>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
            Data Preview
          </h4>
          {preview.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 truncate max-w-[120px]">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[150px]">
                          {row.email}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                          <span
                            className={`px-2 py-0.5 rounded-md ${row.role?.toUpperCase() === "TEACHER" ? "bg-indigo-50 text-indigo-700" : "bg-green-50 text-green-700"}`}
                          >
                            {row.role?.toUpperCase() || "STUDENT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 text-center font-medium">
                Showing first {preview.length} rows
              </div>
            </div>
          ) : (
            <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50/50">
              <p className="text-sm font-medium text-slate-400">
                Preview will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
