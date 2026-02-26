import React, { useState, useRef, useCallback } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Upload,
  ImageIcon,
} from "lucide-react";

export const StudentScanner = ({
  status,
  setStatus,
  scanResult,
  errorMessage,
  distance,
  resetState,
  scanImageFile,
  uploadError,
  onSuccessViewRecords,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (file && file.type.startsWith("image/")) {
        setFileName(file.name);
        scanImageFile(file);
      }
    },
    [scanImageFile],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-lg mx-auto">
      {/* Hidden div for Html5Qrcode image scanning */}
      <div id="image-reader" style={{ display: "none" }}></div>

      {status === "idle" && (
        <div className="text-center py-10">
          <Camera className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Ready to Scan</h3>
          <p className="text-gray-500 text-sm mt-2 mb-6 px-4">
            Ensure you are physically inside the classroom before scanning.
            Location permissions are required.
          </p>
          <button
            onClick={() => setStatus("scanning")}
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Camera className="h-5 w-5 mr-2" />
            Open Camera Scanner
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400 font-medium">
                or upload a QR image
              </span>
            </div>
          </div>

          {/* Drag & Drop + Click Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200
              ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                  : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                handleFile(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-col items-center gap-3">
              {isDragging ? (
                <>
                  <Upload className="h-10 w-10 text-indigo-500 animate-bounce" />
                  <p className="text-sm font-medium text-indigo-600">
                    Drop your image here!
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-white rounded-full shadow-sm border border-gray-200">
                    <ImageIcon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drag & drop a QR image here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      or click to browse files
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File name display */}
          {fileName && !uploadError && (
            <p className="mt-3 text-xs text-gray-500 truncate">📎 {fileName}</p>
          )}

          {/* Upload error message */}
          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{uploadError}</p>
              <p className="text-xs text-red-400 mt-1">
                Try a clearer image or use the camera scanner instead.
              </p>
            </div>
          )}
        </div>
      )}

      {status === "scanning" && (
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-4 animate-pulse text-indigo-600">
            Scanning for QR Code...
          </h3>
          <div
            id="reader"
            className="w-full overflow-hidden rounded-lg shadow-inner bg-gray-100"
          ></div>
          <button
            onClick={resetState}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {status === "geolocating" && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-16 w-16 text-blue-500 animate-bounce mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Verifying Location...
          </h3>
          <p className="text-gray-500 text-sm mt-2">
            Checking your GPS coordinates against the classroom.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center py-10 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle2 className="mx-auto h-20 w-20 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold text-green-800">
            Attendance Marked!
          </h3>
          <p className="text-green-600 font-medium mt-2">
            Session ID: {scanResult?.substring(0, 8)}...
          </p>
          <p className="text-xs text-green-500 mt-4 opacity-75">
            Verified {Math.round(distance || 0)} meters from teacher
          </p>
          <button
            onClick={onSuccessViewRecords}
            className="mt-8 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow"
          >
            View subject records
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-10 bg-red-50 rounded-xl border border-red-200">
          <XCircle className="mx-auto h-20 w-20 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-800">
            Verification Failed
          </h3>
          <p className="text-red-700 font-medium mt-2 px-4">{errorMessage}</p>
          {distance && distance > 200 && (
            <p className="text-sm text-red-500 mt-4 bg-red-100 p-2 rounded inline-block">
              Calculated Distance: {Math.round(distance)}m (Limit: 200m)
            </p>
          )}
          <div className="mt-8">
            <button
              onClick={resetState}
              className="px-6 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded-md shadow-sm transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
