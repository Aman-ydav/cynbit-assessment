import {
  COVERAGE_FLOOR,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  GROUP_LABEL,
  GROUP_ORDER,
  HOURS_OPTIONS,
  INTEREST_LIST,
  LAB_LIST,
  MAX_INTERESTS,
  PROGRAM,
  SKILLS,
  SKILL_IDS,
  STAGE_OPTIONS,
  type InterestId,
  type SkillId,
} from "@bitelevate/shared";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { OptionCard } from "@/components/wizard/OptionCard";
import type { Draft } from "@/components/wizard/useWizard";
import { Button } from "@/components/ui/button";

interface StepProps {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-heading mb-1 text-lg font-bold">{legend}</legend>
      {hint && <p className="text-muted-foreground mb-4 text-sm">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </fieldset>
  );
}

const toggle = <T extends string>(list: readonly T[], value: T, on: boolean): T[] =>
  on ? [...list.filter((item) => item !== value), value] : list.filter((item) => item !== value);

/** Interests that no lab covers well — shown honestly up front rather than after the fact. */
const hasNoLab = (id: InterestId) =>
  !LAB_LIST.some((lab) => (INTEREST_LIST.find((i) => i.id === id)?.coverage[lab.id] ?? 0) >= COVERAGE_FLOOR);

export function StepAbout({ draft, update }: StepProps) {
  return (
    <div className="space-y-10">
      <Group legend="Which year are you in?">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAGE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              compact
              type="radio"
              name="stage"
              value={option.value}
              checked={draft.stage === option.value}
              onChange={() => update({ stage: option.value })}
              title={option.label}
            />
          ))}
        </div>
      </Group>

      <Group legend="How much coding have you done?">
        <div className="grid gap-3 sm:grid-cols-3">
          {EXPERIENCE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              type="radio"
              name="experience"
              value={option.value}
              checked={draft.experience === option.value}
              onChange={() => update({ experience: option.value })}
              title={option.label}
              hint={option.hint}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}

export function StepGoal({ draft, update }: StepProps) {
  return (
    <Group legend="Pick the one that matters most" hint="You can only choose one — it shapes which lab and tips we lean towards.">
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            type="radio"
            name="goal"
            value={option.value}
            checked={draft.goal === option.value}
            onChange={() => update({ goal: option.value })}
            title={option.label}
            hint={option.hint}
          />
        ))}
      </div>
    </Group>
  );
}

export function StepInterests({ draft, update }: StepProps) {
  const chosen = draft.interests.length;
  const full = chosen >= MAX_INTERESTS;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          <strong className="text-foreground">{chosen}</strong> of {MAX_INTERESTS} chosen
          {chosen === 0 && " — or skip if you're not sure yet"}
          {full && " — deselect one to pick another"}
        </p>
        {chosen > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => update({ interests: [] })}>
            <X /> Clear
          </Button>
        )}
      </div>

      {GROUP_ORDER.map((group) => {
        const items = INTEREST_LIST.filter((interest) => interest.group === group);
        return (
          <Group key={group} legend={GROUP_LABEL[group]}>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((interest) => {
                const checked = draft.interests.includes(interest.id);
                return (
                  <OptionCard
                    key={interest.id}
                    compact
                    type="checkbox"
                    name="interests"
                    value={interest.id}
                    checked={checked}
                    disabled={full && !checked}
                    onChange={(on) => update({ interests: toggle(draft.interests, interest.id, on) })}
                    title={interest.label}
                    hint={
                      hasNoLab(interest.id) ? (
                        <>
                          {interest.blurb} ·{" "}
                          <span className="text-amber font-semibold">No dedicated lab yet</span>
                        </>
                      ) : (
                        interest.blurb
                      )
                    }
                  />
                );
              })}
            </div>
          </Group>
        );
      })}
    </div>
  );
}

export function StepTime({ draft, update }: StepProps) {
  return (
    <div className="space-y-10">
      <Group
        legend="How much time can you give each day?"
        hint={`BitElevate expects about ${PROGRAM.expectedHoursPerDay.min}–${PROGRAM.expectedHoursPerDay.max} hours a day for ${PROGRAM.durationDays} days.`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {HOURS_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              type="radio"
              name="hours"
              value={option.value}
              checked={draft.hoursPerDay === option.value}
              onChange={() => update({ hoursPerDay: option.value })}
              title={option.label}
              hint={option.hint}
            />
          ))}
        </div>
      </Group>

      <Group legend="Do you have exams in the next two months?">
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            type="radio"
            name="exams"
            value="yes"
            checked={draft.examsSoon === true}
            onChange={() => update({ examsSoon: true })}
            title="Yes, exams are coming up"
            hint={`You can pause for up to ${PROGRAM.examFreezeDays} days with the exam freeze — we'll plan for it.`}
          />
          <OptionCard
            type="radio"
            name="exams"
            value="no"
            checked={draft.examsSoon === false}
            onChange={() => update({ examsSoon: false })}
            title="No, I'm clear"
            hint="No exam freeze needed in your timeline."
          />
        </div>
      </Group>
    </div>
  );
}

export function StepSkills({ draft, update }: StepProps) {
  return (
    <Group
      legend="Tick only what you've really done"
      hint="It makes your prep estimate accurate. Nothing ticked is perfectly fine — we'll plan the basics in."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {SKILL_IDS.map((id: SkillId) => (
          <OptionCard
            key={id}
            compact
            type="checkbox"
            name="skills"
            value={id}
            checked={draft.skills.includes(id)}
            onChange={(on) => update({ skills: toggle(draft.skills, id, on) })}
            title={SKILLS[id].label}
            hint={SKILLS[id].hint}
          />
        ))}
      </div>
    </Group>
  );
}
