export const planUrl = (code: string) => `${window.location.origin}/plan/${code}`;

export const whatsappUrl = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

/** Copy text to the clipboard, falling back to a hidden textarea for older/insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
