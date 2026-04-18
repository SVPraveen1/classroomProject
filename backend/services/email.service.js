const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  /**
   * Send a custom email from the teacher to a student.
   * Optionally CC the guardian email.
   */
  async sendEmail({ to, cc, subject, message, teacherName }) {
    if (!to || !subject || !message) {
      const error = new Error("Recipient, subject, and message are required.");
      error.status = 400;
      throw error;
    }

    // Build the CC list (filter out empty values)
    const ccList = cc ? [cc].filter(Boolean) : [];

    const { data, error } = await resend.emails.send({
      from: "Classroom Attendance <onboarding@resend.dev>",
      to: [to],
      cc: ccList.length > 0 ? ccList : undefined,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <div style="background: #4f46e5; color: white; padding: 20px 24px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">Classroom Attendance System</h2>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              Sent by <strong>${teacherName || "Your Teacher"}</strong> via Classroom Attendance System
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      const err = new Error(error.message || "Failed to send email via Resend");
      err.status = 500;
      throw err;
    }

    return { message: "Email sent successfully", emailId: data?.id };
  }

  /**
   * Send leave request status notification to student (+ guardian CC)
   * @param {Object} student - { email, guardianEmail, name }
   * @param {string} status - 'APPROVED' | 'REJECTED'
   * @param {Object} leaveDetails - { subject, date, reason, reviewComment, reviewerName }
   */
  async sendLeaveStatusNotification(student, status, leaveDetails) {
    const { email, guardianEmail, name } = student;
    const { subject, date, reason, reviewComment, reviewerName } = leaveDetails;

    const isApproved = status === "APPROVED";
    const statusColor = isApproved ? "#10b981" : "#ef4444";
    const statusText = isApproved ? "Approved" : "Rejected";

    const formattedDate = date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

    const ccList = guardianEmail ? [guardianEmail].filter(Boolean) : [];

    const { data, error } = await resend.emails.send({
      from: "Classroom Attendance <onboarding@resend.dev>",
      to: [email],
      cc: ccList.length > 0 ? ccList : undefined,
      subject: `Leave Request ${statusText} - ${subject}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <div style="background: ${statusColor}; color: white; padding: 20px 24px; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">Leave Request ${statusText}</h2>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 15px; line-height: 1.7;">
              Dear <strong>${name}</strong>,
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.7;">
              Your leave request for <strong>${subject}</strong> on <strong>${formattedDate}</strong> has been <strong>${statusText.toLowerCase()}</strong>.
            </p>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">Your Reason:</p>
              <p style="margin: 0; color: #334155; font-size: 14px;">${reason}</p>
            </div>

            ${
              reviewComment
                ? `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 13px; font-weight: 600;">Teacher's Comment:</p>
                <p style="margin: 0; color: #78350f; font-size: 14px;">${reviewComment}</p>
              </div>
            `
                : ""
            }

            ${
              isApproved
                ? `
              <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 16px 0;">
                ✓ Your attendance has been marked as present for this session.
              </p>
            `
                : ""
            }

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              Reviewed by <strong>${reviewerName || "Your Teacher"}</strong> via Classroom Attendance System
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send leave notification email:", error);
      // Don't throw — let the leave approval succeed even if email fails
    }

    return { message: "Leave notification sent", emailId: data?.id };
  }
}

module.exports = new EmailService();
