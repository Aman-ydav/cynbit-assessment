import type { LabId } from "@bitelevate/shared";
import {
  BrainCircuit,
  FlaskConical,
  Layers,
  LayoutDashboard,
  PenTool,
  Server,
  type LucideIcon,
} from "lucide-react";

export const LAB_ICON: Record<LabId, LucideIcon> = {
  fullstack: Layers,
  python_backend: Server,
  ai_vector: BrainCircuit,
  frontend_ops: LayoutDashboard,
  qa_automation: FlaskConical,
  uiux_design: PenTool,
};

/** Soft tint + dark text pairs (all >= 4.5:1) so each lab is recognisable at a glance. */
export const LAB_TINT: Record<LabId, string> = {
  fullstack: "bg-[#dff1f3] text-[#00474c]",
  python_backend: "bg-[#e5eeff] text-[#12457a]",
  ai_vector: "bg-[#eee9ff] text-[#46298f]",
  frontend_ops: "bg-[#fff0d2] text-[#6e4300]",
  qa_automation: "bg-[#dff3e8] text-[#14543a]",
  uiux_design: "bg-[#ffe5ed] text-[#80193f]",
};
