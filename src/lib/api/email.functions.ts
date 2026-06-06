import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendEmailOtp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      otp: z.string().length(6),
      type: z.enum(["verification", "reset"]),
    })
  )
  .handler(async ({ data }) => {
    const { email, otp, type } = data;

    // Read Resend API Key from server environment
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[SIMULATED EMAIL] No RESEND_API_KEY found in environment variables.`);
      console.log(`[SIMULATED EMAIL] OTP Code for ${email} (${type}): ${otp}`);
      return {
        success: false,
        simulated: true,
        message: "SMTP/Resend API Key is not configured on the server. Fell back to simulation mode.",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "VendorBridge Auth <onboarding@resend.dev>",
          to: email,
          subject: type === "verification" 
            ? "Verify Your Email - VendorBridge" 
            : "Reset Your Password - VendorBridge",
          html: `
            <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-bottom: 16px;">VendorBridge Authentication</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                Hello,
              </p>
              <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                Use the following verification code to complete your ${type === "verification" ? "registration / login" : "password reset"} request:
              </p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                This code will expire in 10 minutes. If you did not request this email, please ignore it.
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Resend API error:", errText);
        return {
          success: false,
          simulated: true,
          message: `Failed to send email via Resend API (HTTP ${response.status}). Fell back to simulation.`,
        };
      }

      return {
        success: true,
        simulated: false,
        message: "Email sent successfully via Resend API.",
      };
    } catch (err) {
      console.error("Error calling Resend API:", err);
      return {
        success: false,
        simulated: true,
        message: "An error occurred while sending email. Fell back to simulation.",
      };
    }
  });
