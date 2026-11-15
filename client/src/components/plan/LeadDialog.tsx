import { zodResolver } from "@hookform/resolvers/zod";
import { leadInputSchema, type LeadInput } from "@bitelevate/shared";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import type { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api, type LeadResponse } from "@/lib/api";
import { getSessionId, track } from "@/lib/analytics";

type FormValues = z.input<typeof leadInputSchema>;

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planCode: string;
  emailEnabled: boolean;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-destructive mt-1.5 text-sm font-medium">
      {message}
    </p>
  );
}

/**
 * Asked only after the learner has seen their plan, with explicit consent. Optional email of
 * the plan is shown only when the server can actually send it, so we never promise what we can't do.
 */
export function LeadDialog({ open, onOpenChange, planCode, emailEnabled }: LeadDialogProps) {
  const [result, setResult] = useState<(LeadResponse & { email: string }) | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormValues, unknown, LeadInput>({
    resolver: zodResolver(leadInputSchema),
    mode: "onTouched",
    defaultValues: {
      planCode,
      name: "",
      email: "",
      phone: "",
      wantsEmail: emailEnabled,
      wantsAdvisor: true,
      consent: false as unknown as true,
      website: "",
      sessionId: getSessionId(),
    },
  });
  const { register, control, handleSubmit, formState, setError, reset } = form;
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (open) track("lead_form_opened");
  }, [open]);

  async function onSubmit(values: LeadInput) {
    setFormError(null);
    try {
      const response = await api.createLead({ ...values, planCode, sessionId: getSessionId() });
      setResult({ ...response, email: values.email });
    } catch (caught) {
      if (caught instanceof ApiError && caught.issues?.length) {
        for (const issue of caught.issues) {
          const field = issue.path.split(".")[0] as keyof FormValues;
          if (field in values) setError(field, { message: issue.message });
        }
      } else if (caught instanceof ApiError && caught.status === 429) {
        setFormError("Too many attempts. Please wait a few minutes and try again.");
      } else if (caught instanceof ApiError && caught.isUnavailable) {
        setFormError("We couldn't reach the server. Please check your connection and try again.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  async function deleteMyData() {
    if (!result) return;
    setDeleting(true);
    try {
      await api.deleteLead(result.deleteToken);
      toast.success("Your details were deleted.");
      setResult(null);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("We couldn't delete your details right now. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next && result) setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        {result ? (
          <div className="py-2 text-center">
            <span className="bg-success-soft text-success mx-auto grid size-14 place-items-center rounded-2xl">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <DialogHeader className="mt-4 items-center text-center">
              <DialogTitle className="text-2xl">Request saved</DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                {result.emailSent
                  ? `We've emailed your plan link to ${result.email}. `
                  : ""}
                Your details are saved for Cynbit&rsquo;s team, who can use them to get in touch
                about BitElevate.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button type="button" onClick={() => close(false)}>
                Back to my plan
              </Button>
              <Button type="button" variant="ghost" onClick={deleteMyData} disabled={deleting}>
                {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete my details
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Talk to an advisor</DialogTitle>
              <DialogDescription className="leading-relaxed">
                Optional. You&rsquo;ve already seen your plan — share your details only if you&rsquo;d
                like a person to follow up.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 space-y-5">
              <div>
                <Label htmlFor="lead-name">Your name</Label>
                <Input
                  id="lead-name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "lead-name-error" : undefined}
                  className="mt-2 h-11"
                  {...register("name")}
                />
                <FieldError id="lead-name-error" message={errors.name?.message} />
              </div>

              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "lead-email-error" : undefined}
                  className="mt-2 h-11"
                  {...register("email")}
                />
                <FieldError id="lead-email-error" message={errors.email?.message} />
              </div>

              <div>
                <Label htmlFor="lead-phone">
                  Phone / WhatsApp <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="lead-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "lead-phone-error" : undefined}
                  className="mt-2 h-11"
                  {...register("phone")}
                />
                <FieldError id="lead-phone-error" message={errors.phone?.message} />
              </div>

              {/* Honeypot: invisible to people, tempting to bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
                </label>
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-semibold">How should we follow up?</legend>

                {emailEnabled && (
                  <Controller
                    control={control}
                    name="wantsEmail"
                    render={({ field }) => (
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="lead-wants-email"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="lead-wants-email" className="font-normal leading-snug">
                          Email me this plan
                        </Label>
                      </div>
                    )}
                  />
                )}

                <Controller
                  control={control}
                  name="wantsAdvisor"
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="lead-wants-advisor"
                        checked={Boolean(field.value)}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="lead-wants-advisor" className="font-normal leading-snug">
                        I&rsquo;d like an advisor to contact me
                      </Label>
                    </div>
                  )}
                />
                <FieldError id="lead-channel-error" message={errors.wantsAdvisor?.message} />
              </fieldset>

              <div>
                <Controller
                  control={control}
                  name="consent"
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="lead-consent"
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={errors.consent ? "lead-consent-error" : undefined}
                        className="mt-0.5"
                      />
                      <Label htmlFor="lead-consent" className="text-muted-foreground block font-normal leading-snug">
                        <span>
                          I agree to be contacted about BitElevate and that my details are stored for
                          that purpose. I can delete them at any time.{" "}
                          <Link
                            to="/privacy"
                            target="_blank"
                            className="text-primary font-semibold underline underline-offset-2"
                          >
                            Privacy notice
                          </Link>
                        </span>
                      </Label>
                    </div>
                  )}
                />
                <FieldError id="lead-consent-error" message={errors.consent?.message} />
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Send my request"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
