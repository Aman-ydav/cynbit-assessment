import { Router } from "express";
import { z } from "zod";
import type { Config } from "../config";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  cookieOptions,
  isValidAdminToken,
  requireAdmin,
  safeEqual,
  signAdminToken,
} from "../middleware/adminAuth";
import { HttpError } from "../middleware/errors";
import { createLimiter, type RateLimits } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { LeadModel } from "../models/Lead";
import { csvRow, getStats } from "../services/stats";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

const leadView = (lead: Awaited<ReturnType<typeof listLeads>>[number]) => ({
  id: String(lead._id),
  name: lead.name,
  email: lead.email,
  phone: lead.phone ?? "",
  lab: lead.primaryLab,
  wantsAdvisor: lead.wantsAdvisor,
  wantsEmail: lead.wantsEmail,
  emailSent: Boolean(lead.emailSentAt),
  createdAt: lead.createdAt,
});

// Never expose the delete-token hash, even to the admin.
const listLeads = (limit: number) =>
  LeadModel.find({}, { deleteTokenHash: 0 }).sort({ createdAt: -1 }).limit(limit).lean();

export function adminRouter(config: Config, limits: RateLimits): Router {
  const router = Router();
  const guard = requireAdmin(config);

  router.post("/login", createLimiter(limits.adminLogin), validateBody(loginSchema), (req, res) => {
    const { password } = req.body as z.infer<typeof loginSchema>;
    if (!safeEqual(password, config.adminPassword)) {
      throw new HttpError(401, "invalid_credentials", "That password is not correct.");
    }
    res.cookie(ADMIN_COOKIE, signAdminToken(config), {
      ...cookieOptions(config),
      maxAge: SESSION_HOURS * 60 * 60 * 1000,
    });
    res.json({ ok: true });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(ADMIN_COOKIE, cookieOptions(config));
    res.status(204).end();
  });

  /**
   * Auth probe for the dashboard. Answers 200 either way so an anonymous visit does not log a
   * failed request; dev-credential hints are only revealed to an authenticated session.
   */
  router.get("/me", (req, res) => {
    const authenticated = isValidAdminToken(req.cookies?.[ADMIN_COOKIE], config);
    res.setHeader("Cache-Control", "no-store");
    res.json(
      authenticated ? { authenticated, usingDevDefaults: config.usingDevAdminDefaults } : { authenticated },
    );
  });

  // Everything below needs a valid session, and is rate-limited per IP.
  router.use(createLimiter(limits.admin), guard);

  router.get("/stats", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await getStats());
  });

  router.get("/leads", async (req, res) => {
    const requested = Number.parseInt(String(req.query.limit ?? "100"), 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 500) : 100;
    res.setHeader("Cache-Control", "no-store");
    res.json({ leads: (await listLeads(limit)).map(leadView) });
  });

  router.get("/leads.csv", async (_req, res) => {
    const leads = (await listLeads(5000)).map(leadView);
    const header = ["created_at", "name", "email", "phone", "recommended_lab", "wants_advisor", "wants_email", "email_sent"];
    const rows = leads.map((lead) =>
      csvRow([
        new Date(lead.createdAt).toISOString(),
        lead.name,
        lead.email,
        lead.phone,
        lead.lab,
        lead.wantsAdvisor,
        lead.wantsEmail,
        lead.emailSent,
      ]),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bitelevate-leads.csv"');
    res.setHeader("Cache-Control", "no-store");
    res.send(`${[csvRow(header), ...rows].join("\r\n")}\r\n`);
  });

  return router;
}
