import { formatMoney } from "../components/helperFunctions/helperFunctions";

/** wa.me link with a short, honest message (FT-037). WhatsApp renders the OG card for the URL. */
export function whatsappShareUrl({ title, url, raised = 0, goal = 0, currency = "", donated = 0 }: { title: string; url: string; raised?: number; goal?: number; currency?: string; donated?: number }) {
  const progress = goal > 0 ? ` ${formatMoney(raised, currency)} raised of ${formatMoney(goal, currency)}.` : "";
  const lead = donated > 0 ? `I just gave to "${title}".` : `Please support "${title}".`;
  const text = `${lead}${progress} Donations are held in escrow and every payout is published, so you can see where the money goes. ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
