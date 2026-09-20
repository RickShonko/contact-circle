import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${SITE_NAME} home`}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="12" cy="16" r="10" fill="var(--cobalt)" />
        <circle cx="21" cy="16" r="10" fill="var(--sun)" style={{ mixBlendMode: "multiply" }} />
      </svg>
      {SITE_NAME}
    </Link>
  );
}
