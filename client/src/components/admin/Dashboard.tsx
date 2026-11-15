import {
  INTERESTS,
  LABS,
  type AdminLead,
  type AdminStats,
  type InterestId,
  type LabId,
} from "@bitelevate/shared";
import { Download, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BarList, ColumnChart, type Datum } from "@/components/admin/charts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STEPS } from "@/components/wizard/useWizard";
import { ApiError, api } from "@/lib/api";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const shortDay = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-card shadow-soft rounded-3xl border p-6 ${className ?? ""}`}>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-card shadow-soft rounded-3xl border p-4 sm:p-5">
      <p className="text-muted-foreground text-sm font-semibold">{label}</p>
      <p className="font-heading mt-2 text-3xl leading-none font-extrabold tabular-nums sm:text-4xl">{value}</p>
      {note && <p className="text-muted-foreground mt-2 text-sm">{note}</p>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

export function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStats, nextLeads] = await Promise.all([api.adminStats(), api.adminLeads()]);
      setStats(nextStats);
      setLeads(nextLeads.leads);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) onSignedOut();
      else setError("We couldn't load the analytics. Check the server connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [onSignedOut]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await api.adminLogout().catch(() => undefined);
    onSignedOut();
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-primary font-heading text-xs font-bold tracking-[0.16em] uppercase">Admin</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Funnel &amp; leads</h1>
        {stats && (
          <p className="text-muted-foreground mt-1 text-sm">
            Updated {dateTime.format(new Date(stats.generatedAt))} IST
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh
        </Button>
        <Button asChild variant="outline">
          <a href="/api/admin/leads.csv" download>
            <Download /> Export CSV
          </a>
        </Button>
        <Button type="button" variant="ghost" onClick={() => void signOut()}>
          <LogOut /> Sign out
        </Button>
      </div>
    </div>
  );

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        {header}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <DashboardSkeleton />
        )}
      </div>
    );
  }

  const started = stats.funnel[0]?.sessions ?? 0;
  const enrol = stats.funnel.find((row) => row.name === "enrol_clicked");

  const funnel: Datum[] = stats.funnel.map((row, index) => ({
    key: row.name,
    label: row.label,
    value: row.sessions,
    detail: index === 0 ? undefined : `${row.pctOfStarted}% of starters`,
  }));

  const stepData: Datum[] = STEPS.map((step, index) => ({
    key: String(index + 1),
    label: `${index + 1}. ${step.short}`,
    value: stats.steps.find((s) => s.step === index + 1)?.sessions ?? 0,
  }));

  const labs: Datum[] = stats.labs.map((row) => ({
    key: row.lab,
    label: LABS[row.lab as LabId]?.name ?? row.lab,
    value: row.plans,
    detail: `avg match ${row.avgMatch}%`,
  }));

  const unmatched: Datum[] = stats.unmatched.map((row) => ({
    key: row.interest,
    label: INTERESTS[row.interest as InterestId]?.label ?? row.interest,
    value: row.plans,
    detail: stats.totals.plans ? `${Math.round((row.plans / stats.totals.plans) * 100)}% of plans` : undefined,
  }));

  const daily: Datum[] = stats.daily.map((day) => ({
    key: day.date,
    label: shortDay.format(new Date(`${day.date}T00:00:00Z`)),
    value: day.plans,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      {header}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Quizzes started" value={started.toLocaleString("en-IN")} note="Unique sessions" />
        <StatCard label="Plans generated" value={stats.totals.plans.toLocaleString("en-IN")} note="All time" />
        <StatCard
          label="Clicked “Enrol”"
          value={(enrol?.sessions ?? 0).toLocaleString("en-IN")}
          note={started ? `${enrol?.pctOfStarted ?? 0}% of starters` : "No quizzes yet"}
        />
        <StatCard label="Leads" value={stats.totals.leads.toLocaleString("en-IN")} note="With consent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Conversion funnel"
          description="Sessions that started the quiz and then reached each stage. People who open a shared plan directly aren't counted."
        >
          <BarList data={funnel} empty="No quiz sessions yet. Build a plan to see the funnel fill in." />
        </Panel>

        <Panel
          title="Where people drop out of the quiz"
          description="Sessions that completed each step. A sharp fall between two steps shows where the quiz loses people."
        >
          <ColumnChart
            data={stepData}
            ariaLabel="Sessions that completed each of the five quiz steps"
            labelHeading="Step"
            valueHeading="Sessions"
            empty="No steps completed yet."
          />
        </Panel>

        <Panel title="Which labs get recommended" description="Plans generated per lab, with the average match strength.">
          <BarList data={labs} empty="No plans yet." />
        </Panel>

        <Panel
          title="Interests with no lab yet"
          description="Topics learners picked that no BitElevate lab covers — a direct signal of which lab to build next."
        >
          <BarList data={unmatched} empty="No unmatched interests so far." />
        </Panel>
      </div>

      <Panel title="Plans per day" description="Last 14 days, Indian time.">
        <ColumnChart
          data={daily}
          ariaLabel="Plans generated per day over the last 14 days"
          labelEvery={2}
          labelHeading="Date"
          valueHeading="Plans"
          empty="No plans in the last 14 days."
        />
      </Panel>

      <Panel title="Leads" description={`Most recent ${leads.length} of ${stats.totals.leads}. Details are shared only with consent.`}>
        {leads.length === 0 ? (
          <p className="text-muted-foreground bg-muted rounded-2xl px-4 py-6 text-center text-sm">
            No leads yet.
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When (IST)</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Recommended lab</TableHead>
                  <TableHead>Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {dateTime.format(new Date(lead.createdAt))}
                    </TableCell>
                    <TableCell className="font-semibold">{lead.name}</TableCell>
                    <TableCell>
                      <div>{lead.email}</div>
                      {lead.phone && <div className="text-muted-foreground text-xs">{lead.phone}</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {LABS[lead.lab as LabId]?.shortName ?? lead.lab}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.wantsAdvisor && <Badge variant="secondary">Advisor call</Badge>}
                        {lead.wantsEmail && (
                          <Badge variant="outline">{lead.emailSent ? "Plan emailed" : "Email requested"}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  );
}
