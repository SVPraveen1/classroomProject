# Leave Approval Feature - Implementation Summary

## Overview
Complete leave approval system allowing students to request leave for past absences or future dates, and teachers to review/approve requests with automatic attendance marking.

---

## What Was Built

### Database Changes (Prisma Schema)
**New Model: `LeaveRequest`**
- `id` - Auto-increment primary key
- `studentId` - Foreign key to User
- `sessionId` - Optional FK (for past session requests)
- `subject` - Required string (for future date requests)
- `leaveDate` - Optional date (for future requests)
- `reason` - Text field
- `status` - Enum: PENDING / APPROVED / REJECTED
- `reviewedBy` - FK to User (teacher who reviewed)
- `reviewComment` - Optional teacher feedback
- `reviewedAt` - Timestamp
- `createdAt`, `updatedAt`

**New Enum: `LeaveStatus`**
- PENDING (default)
- APPROVED
- REJECTED

**Modified Model: `Attendance`**
- Added `isLeaveApproved` boolean (default false)
- When true, shows "Leave Approved" badge in UI
- `distanceMeters = -1` for leave-approved attendance

**Migration:** `20260418100000_add_leave_request_feature/migration.sql`

---

## Backend Implementation

### New Files
1. **`backend/services/leave.service.js`** (477 lines)
   - `requestLeaveForSession()` - Student requests leave for specific past session
   - `requestLeaveForFutureDate()` - Student requests leave for future date+subject
   - `getStudentLeaveRequests()` - Fetch student's own requests
   - `getTeacherPendingRequests()` - Fetch pending requests for teacher's subjects
   - `getSessionLeaveRequests()` - Fetch requests for specific session
   - `reviewLeaveRequest()` - Approve/reject with comment
   - `_markAttendanceForApprovedLeave()` - Internal: upsert Attendance records
   - `_removeAttendanceForRejectedLeave()` - Internal: delete leave-approved attendance
   - `autoMarkLeaveForNewSession()` - Called when teacher creates session, auto-marks approved leave requests
   - `cancelLeaveRequest()` - Student cancels pending request

2. **`backend/controllers/leave.controller.js`** (67 lines)
   - Thin wrapper around leave.service methods

3. **`backend/routes/leave.js`** (61 lines)
   **Student routes:**
   - `POST /api/leave/request/session` - Request leave for past session
   - `POST /api/leave/request/future` - Request leave for future date
   - `GET /api/leave/my-requests` - Get my requests
   - `DELETE /api/leave/:requestId` - Cancel pending request
   
   **Teacher routes:**
   - `GET /api/leave/pending` - Get all pending requests for my subjects
   - `GET /api/leave/session/:sessionId` - Get requests for specific session
   - `POST /api/leave/:requestId/review` - Approve/reject with comment

### Modified Files
1. **`backend/server.js`**
   - Added route: `app.use("/api/leave", require("./routes/leave"))`

2. **`backend/services/session.service.js`**
   - Imported `leaveService`
   - Added call to `leaveService.autoMarkLeaveForNewSession()` after creating session
   - Modified `getSessionHistory()` to include `isLeaveApproved` in attendees array

3. **`backend/services/email.service.js`**
   - Added `sendLeaveStatusNotification()` method
   - Sends HTML email to student (+ guardian CC) when leave is approved/rejected
   - Includes reason, teacher comment, status badge

---

## Frontend Implementation

### New Files
1. **`frontend/src/services/leave.service.js`** (53 lines)
   - Axios wrappers for all leave API endpoints

2. **`frontend/src/components/dashboard/StudentLeaveRequest.jsx`** (239 lines)
   **Two-tab interface:**
   - **Past Sessions Tab:** Dropdown of absent sessions, reason field, submit
   - **Future Date Tab:** Subject dropdown, date picker, reason field, submit
   - **My Requests Section:** Table showing all requests with status badges
   - Cancel button for pending requests
   - Shows teacher review comments

3. **`frontend/src/components/dashboard/TeacherLeaveManagement.jsx`** (238 lines)
   - Dedicated "Leave Requests" tab in teacher dashboard
   - Lists all pending requests across all teacher's subjects
   - Review modal with approve/reject dropdown + comment field
   - Auto-refreshes after review

### Modified Files
1. **`frontend/src/pages/StudentDashboard.jsx`**
   - Added "Leave Requests" tab (FileText icon)
   - Integrated `<StudentLeaveRequest />` component

2. **`frontend/src/pages/TeacherDashboard.jsx`**
   - Added "Leave Requests" tab (FileText icon)
   - Integrated `<TeacherLeaveManagement />` component

3. **`frontend/src/components/dashboard/TeacherSessionList.jsx`**
   - Added leave request fetching when session is expanded
   - Shows "Leave Requests" section inside session detail view (amber highlight box)
   - Displays pending requests with "Review" button
   - Shows approved/rejected requests with status badges
   - Review modal for quick approval from session view
   - Shows "Leave Approved" badge on attendance records where `isLeaveApproved = true`

---

## User Flows

### Student: Request Leave for Past Session
1. Student opens "Leave Requests" tab
2. Selects "Past Sessions" sub-tab
3. Sees dropdown of sessions where they were absent
4. Selects session, enters reason, submits
5. Request appears in "My Requests" with "Pending" badge
6. Receives email notification when teacher reviews

### Student: Request Leave for Future Date
1. Student opens "Leave Requests" tab
2. Selects "Future Date" sub-tab
3. Picks subject from dropdown (subjects they've attended before)
4. Picks date from date picker
5. Enters reason, submits
6. When teacher creates session for that date+subject, attendance is auto-marked

### Teacher: Review from Dedicated Tab
1. Teacher opens "Leave Requests" tab
2. Sees list of all pending requests across all subjects
3. Clicks "Review" button
4. Modal opens: Approve/Reject dropdown + optional comment
5. Submits
6. If approved → Attendance record created/updated with `isLeaveApproved: true`
7. Email sent to student (+ guardian)

### Teacher: Review from Session Detail
1. Teacher opens "Subject Analytics" → clicks a subject → expands a session
2. If any leave requests exist for that session, sees amber "Leave Requests" box
3. Clicks "Review" on pending request
4. Modal opens: same flow as above

### Teacher: Toggle Approved ↔ Rejected Anytime
- Teacher can review the same request multiple times
- Status changes from Approved → Rejected delete the leave-approved attendance
- Status changes from Rejected → Approved create/restore attendance

---

## Key Design Decisions

### Two Request Types
**Past Session (sessionId set):**
- Student picks from list of absent sessions
- Request is tied to a specific session UUID
- On approval, marks that exact session

**Future Date (sessionId null, leaveDate set):**
- Student picks subject + date
- Request is date-based, no session exists yet
- On approval, waits for teacher to create session
- `autoMarkLeaveForNewSession()` checks approved requests and auto-marks

### Attendance Marking Logic
- `distanceMeters = -1` (sentinel value for leave-approved)
- `isLeaveApproved = true`
- Uses `upsert` so teacher can approve leave even if student already scanned (override)

### Email Notifications
- Sent via Resend (same config as existing email feature)
- Includes student email + guardian CC
- HTML template with color-coded status (green for approved, red for rejected)
- Teacher's comment displayed if provided

### Prevent Duplicate Requests
- Student can't submit multiple pending requests for same session
- Student can't submit multiple pending requests for same date+subject

### Cancel Requests
- Student can cancel only PENDING requests
- Approved/rejected requests cannot be deleted (audit trail)

---

## Testing Checklist

### Backend
- [ ] Migration applies successfully: `npx prisma migrate dev`
- [ ] Prisma client regenerated: `npx prisma generate`
- [ ] POST `/api/leave/request/session` creates PENDING request
- [ ] POST `/api/leave/request/future` creates future-date request
- [ ] GET `/api/leave/my-requests` returns student's requests
- [ ] GET `/api/leave/pending` filters by teacher's subjects
- [ ] POST `/api/leave/:id/review` with status=APPROVED creates Attendance
- [ ] POST `/api/leave/:id/review` with status=REJECTED deletes leave-approved Attendance
- [ ] DELETE `/api/leave/:id` only works for PENDING requests
- [ ] Auto-mark: Create session → approved leave requests auto-mark attendance
- [ ] Email sent on approval/rejection (check Resend dashboard)

### Frontend
- [ ] Student dashboard shows "Leave Requests" tab
- [ ] Past sessions dropdown populated with absent sessions
- [ ] Future date form accepts subject + date
- [ ] "My Requests" table shows status badges
- [ ] Cancel button only visible for PENDING
- [ ] Teacher dashboard shows "Leave Requests" tab
- [ ] Pending requests list loads
- [ ] Review modal opens, submits successfully
- [ ] Session detail view shows leave requests in amber box
- [ ] "Leave Approved" badge shows on attendance records

---

## Files Changed

### Backend (11 files)
**New:**
- `backend/services/leave.service.js`
- `backend/controllers/leave.controller.js`
- `backend/routes/leave.js`
- `backend/prisma/migrations/20260418100000_add_leave_request_feature/migration.sql`

**Modified:**
- `backend/prisma/schema.prisma`
- `backend/server.js`
- `backend/services/session.service.js`
- `backend/services/email.service.js`

### Frontend (7 files)
**New:**
- `frontend/src/services/leave.service.js`
- `frontend/src/components/dashboard/StudentLeaveRequest.jsx`
- `frontend/src/components/dashboard/TeacherLeaveManagement.jsx`

**Modified:**
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/components/dashboard/TeacherSessionList.jsx`

---

## Next Steps

1. **Run migration:**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Test locally:**
   ```bash
   npm run dev  # from project root
   ```

3. **Test flow:**
   - Login as student → request leave for past absence
   - Login as teacher → review and approve
   - Check student email (+ guardian if set)
   - Verify attendance marked in session

4. **For final review demo:**
   - Pre-create a few pending leave requests
   - Show teacher approval flow
   - Show email notification
   - Show "Leave Approved" badge in attendance list

---

## Feature Highlights for Evaluators

✅ **Subject-specific leave** (not whole-day blanket)  
✅ **Past + Future date support** (retroactive and proactive)  
✅ **Teacher ownership** (only subject teacher sees requests)  
✅ **Email notifications** (student + guardian CC)  
✅ **Audit trail** (review comment, reviewer ID, timestamp)  
✅ **Toggle status anytime** (teacher can change decision)  
✅ **Auto-mark future sessions** (when teacher creates session, checks approved leave)  
✅ **Visual distinction** ("Leave Approved" badge vs. GPS-scanned attendance)  
✅ **Optimistic UI** (instant feedback on review)

---

## Notes
- Leave-approved attendance has `distanceMeters = -1` (sentinel value)
- Session-based requests are linked via `sessionId`
- Future-date requests are linked via `subject` + `leaveDate`
- Email failures are logged but don't block leave approval
- Student can only cancel PENDING requests (approved/rejected are permanent)
