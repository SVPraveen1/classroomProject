import { useState, useEffect, useRef, useCallback } from "react";
import { sessionService } from "../services/session.service";

const POLL_INTERVAL_MS = 4000; // Poll every 4 seconds for near-real-time updates

export const useTeacherDashboard = () => {
  const [session, setSession] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Keep a ref to the latest session so the polling interval never reads a stale closure
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchAttendees = useCallback(async (sessionId) => {
    try {
      const res = await sessionService.getSessionAttendees(sessionId);
      setAttendees(res.attendees || []);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  }, []);

  const fetchSessionData = useCallback(async () => {
    try {
      const res = await sessionService.getActiveSession();
      if (res.session) {
        setSession(res.session);
        fetchAttendees(res.session.id);
      } else {
        setSession(null);
        setAttendees([]);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  }, [fetchAttendees]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await sessionService.getSessionHistory();
      setSubjects(res.subjects || []);
      setAllStudents(res.allStudents || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, []);

  // Initial data fetch + attendee polling
  useEffect(() => {
    fetchSessionData();
    fetchHistory();

    const interval = setInterval(() => {
      const currentSession = sessionRef.current; // Always read the latest value
      if (currentSession) {
        fetchAttendees(currentSession.id);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchSessionData, fetchAttendees, fetchHistory]);

  const startSession = (subject) => {
    setLoading(true);
    setError("");
    setLocationStatus("Acquiring high-accuracy GPS location...");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationStatus("GPS acquired. Starting session...");

          const res = await sessionService.startSession(
            latitude,
            longitude,
            subject || "General",
          );
          setSession(res.session);
          setAttendees([]);
          setLocationStatus("");
        } catch (err) {
          setError(err.response?.data?.error || "Failed to start session.");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setError(geoError.message || "Location access denied or unavailable.");
        setLoading(false);
        setLocationStatus("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await sessionService.endSession(session.id);
      setSession(null);
      fetchHistory(); // Refresh history after ending
    } catch (err) {
      console.error("Failed to end session");
    }
  };

  const handleOverride = async (sessionId, studentId, currentStatus) => {
    const newStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
    await sessionService.overrideAttendance(sessionId, studentId, newStatus);
  };

  return {
    session,
    attendees,
    loading,
    error,
    locationStatus,
    subjects,
    allStudents,
    selectedSubject,
    setSelectedSubject,
    startSession,
    endSession,
    handleOverride,
    fetchHistory,
  };
};
