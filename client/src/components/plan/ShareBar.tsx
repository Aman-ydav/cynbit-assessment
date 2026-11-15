import { LABS, type Plan } from "@bitelevate/shared";
import { Link2, MessageCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { copyText, planUrl, whatsappUrl } from "@/lib/share";

export function ShareBar({ plan, code }: { plan: Plan; code: string }) {
  const lab = LABS[plan.primary.labId];
  const url = () => planUrl(code);

  async function copy() {
    const ok = await copyText(url());
    track("plan_link_copied", { lab: lab.id });
    if (ok) toast.success("Link copied", { description: "Anyone with it can see this plan." });
    else toast.error("Couldn't copy automatically", { description: url() });
  }

  return (
    <div
      className="no-print grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-2.5"
      role="group"
      aria-label="Share or save your plan"
    >
      <Button asChild variant="outline" className="bg-card px-2 sm:px-4">
        <a
          href={whatsappUrl(`My BitElevate plan: ${lab.name} (${plan.primary.matchPct}% match).`, url())}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("plan_shared", { channel: "whatsapp", lab: lab.id })}
        >
          <MessageCircle /> WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" className="bg-card px-2 sm:px-4" onClick={copy}>
        <Link2 /> Copy link
      </Button>
      <Button
        type="button"
        variant="outline"
        className="bg-card px-2 sm:px-4"
        aria-label="Print or save as PDF"
        onClick={() => {
          track("plan_printed", { lab: lab.id });
          window.print();
        }}
      >
        <Printer /> Print
      </Button>
    </div>
  );
}
