export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Contact Circle";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
export const CHANNEL_URL = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "";
export const ADMIN_WHATSAPP = (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "").replace(/\D/g, "");
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_OPERATOR_NAME || "the site operator";

export function fileSlug(): string {
  return SITE_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "contacts";
}
