import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { attendanceService } from "../services/attendance.service";

export const useStudentDashboard = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, scanning, geolocating, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [distance, setDistance] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

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
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false,
      );

      scanner.render(
        (data) => {
          scanner.clear();
          setScanResult(data);
          processAttendance(data);
        },
        (err) => {
          /* Ignore frequent scan errors */
        },
      );

      return () => {
        scanner
          .clear()
          .catch((error) => console.error("Failed to clear scanner", error));
      };
    }
  }, [status]);

  const processAttendance = (sessionId) => {
    setStatus("geolocating");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await attendanceService.markAttendance(
            sessionId,
            latitude,
            longitude,
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

  const resetState = () => {
    setScanResult(null);
    setStatus("idle");
    setErrorMessage("");
    setDistance(null);
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
  };
};
