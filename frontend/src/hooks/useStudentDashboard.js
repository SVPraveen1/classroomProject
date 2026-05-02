import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { attendanceService } from "../services/attendance.service";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export const useStudentDashboard = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, scanning, geolocating, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [distance, setDistance] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const scannerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await attendanceService.getAttendanceHistory();
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (status === "scanning") {
      const html5Qrcode = new Html5Qrcode("reader");
      scannerRef.current = html5Qrcode;

      const startScanner = async () => {
        try {
          // Try back camera first (environment = rear camera)
          await html5Qrcode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              html5Qrcode.stop().then(() => {
                scannerRef.current = null;
                setScanResult(decodedText);
                processAttendance(decodedText);
              });
            },
            () => {}, // Ignore scan errors
          );
        } catch {
          try {
            // Fallback: try any available camera
            await html5Qrcode.start(
              { facingMode: "user" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                html5Qrcode.stop().then(() => {
                  scannerRef.current = null;
                  setScanResult(decodedText);
                  processAttendance(decodedText);
                });
              },
              () => {},
            );
          } catch (err) {
            setStatus("error");
            setErrorMessage(
              "Could not access camera. Please allow camera permissions and try again.",
            );
          }
        }
      };

      startScanner();

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current = null;
        }
      };
    }
  }, [status]);

  const processAttendance = (qrToken) => {
    setStatus("geolocating");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    // Generate device fingerprint before sending
    const fingerprint = getDeviceFingerprint();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await attendanceService.markAttendance(
            qrToken,
            latitude,
            longitude,
            fingerprint,
          );
          setDistance(res.distanceMeters);
          setStatus("success");
          fetchHistory(); // Refresh history after marking
        } catch (err) {
          setStatus("error");
          setErrorMessage(
            err.response?.data?.error ||
              err.response?.data?.message ||
              "Failed to mark attendance.",
          );
          if (err.response?.data?.distance) {
            setDistance(err.response.data.distance);
          }
        }
      },
      (geoError) => {
        setStatus("error");
        setErrorMessage(
          "Location access denied. We need your location to verify you are in class.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const [uploadError, setUploadError] = useState("");

  const scanImageFile = async (file) => {
    if (!file) return;
    setUploadError("");

    const html5Qrcode = new Html5Qrcode("image-reader");
    try {
      const result = await html5Qrcode.scanFileV2(file, true);
      setScanResult(result.decodedText);
      processAttendance(result.decodedText);
    } catch (err) {
      setUploadError(
        "No QR code found in the image. Please try a clearer image.",
      );
    } finally {
      html5Qrcode.clear();
    }
  };

  const resetState = () => {
    setScanResult(null);
    setStatus("idle");
    setErrorMessage("");
    setDistance(null);
    setUploadError("");
  };

  return {
    scanResult,
    status,
    setStatus,
    errorMessage,
    distance,
    subjects,
    selectedSubject,
    setSelectedSubject,
    resetState,
    fetchHistory,
    scanImageFile,
    uploadError,
  };
};
