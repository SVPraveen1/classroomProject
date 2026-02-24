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
}

module.exports = new EmailService();
