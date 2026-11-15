/** Build-time configuration (Vite exposes only VITE_* variables to the browser). */
export const ENROL_URL: string =
  import.meta.env.VITE_ENROL_URL || "https://www.cynbit.in/bitelevate";

export const REPO_URL = "https://github.com/Aman-ydav/cynbit-assessment";

/**
 * Link to the official enrolment page, tagged so Cynbit's own analytics can attribute
 * enrolments to this tool. (`lab` is ignored by the current page; see the integration notes.)
 */
export function enrolUrl(labId: string): string {
  const url = new URL(ENROL_URL);
  url.searchParams.set("lab", labId);
  url.searchParams.set("utm_source", "path_generator");
  url.searchParams.set("utm_medium", "plan_page");
  url.searchParams.set("utm_content", labId);
  return url.toString();
}
