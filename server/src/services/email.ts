import type { Config } from "../config";
import { log } from "../logger";

export interface PlanEmail {
  to: string;
  name: string;
  planUrl: string;
  labName: string;
  matchPct: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function renderPlanEmail({ name, planUrl, labName, matchPct }: PlanEmail) {
  const safeName = escapeHtml(name);
  const safeLab = escapeHtml(labName);
  const safeUrl = escapeHtml(planUrl);

  const text =
    `Hi ${name},\n\n` +
    `Your personalised BitElevate plan is ready. Your best-fit lab is the ${labName} (${matchPct}% match).\n\n` +
    `Open your plan: ${planUrl}\n\n` +
    `This is guidance based on the public BitElevate curriculum, not a guarantee.`;

  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#181c1d">` +
    `<h2 style="color:#006067">Your BitElevate plan is ready</h2>` +
    `<p>Hi ${safeName},</p>` +
    `<p>Your best-fit lab is the <strong>${safeLab}</strong> (${matchPct}% match).</p>` +
    `<p><a href="${safeUrl}" style="display:inline-block;background:#006067;color:#fff;` +
    `padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Open my plan</a></p>` +
    `<p style="color:#4a5758;font-size:13px">This is guidance based on the public BitElevate ` +
    `curriculum, not a guarantee.</p></div>`;

  return { subject: `Your BitElevate plan: ${labName}`, text, html };
}

/**
 * Sends the plan link through Resend. Returns whether the email was accepted, so the UI can be
 * honest about it. Never throws — a failed email must not lose the learner's request.
 */
export async function sendPlanEmail(config: Pick<Config, "email">, email: PlanEmail): Promise<boolean> {
  if (!config.email) return false;
  const { subject, text, html } = renderPlanEmail(email);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.email.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: config.email.from, to: [email.to], subject, text, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      log.warn(`Email provider rejected the request (${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    log.warn("Email send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
