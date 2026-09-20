import { Brand } from "@/components/Brand";
import { ADMIN_WHATSAPP, OPERATOR_NAME, SITE_NAME } from "@/lib/config";

export const metadata = { title: `Privacy | ${SITE_NAME}` };

// TEMPLATE: review this text, fill in the details, and have it checked against
// Kenya's Data Protection Act before you launch. It is not legal advice.
export default function PrivacyPage() {
  return (
    <div className="site">
      <header className="topbar">
        <Brand />
      </header>
      <main className="narrow">
        <div className="prose">
          <h1 className="h1" style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}>How your details are used</h1>

          <h2>Who runs this</h2>
          <p>
            {SITE_NAME} is run by {OPERATOR_NAME}.
            {ADMIN_WHATSAPP && <> You can reach the admin on WhatsApp at 254111986901.</>}
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>The name you type when you join.</li>
            <li>Your WhatsApp number.</li>
            <li>A PIN, which we store only as a scrambled hash, never as plain text.</li>
            <li>Whether you have downloaded the file, and when you joined.</li>
          </ul>

          <h2>What happens to it</h2>
          <p>
            Your name and number are added to a contact file. When the file is released, everyone who has joined
            can download it. That means other members, and anyone they share the file with, will have your name and number.
            Once the file is released it cannot be recalled.
          </p>
          <p>We do not sell your details or use them for anything except building and sharing this contact file.</p>

          <h2>Your choices</h2>
          <ul>
            <li>Before the file is released, you can remove yourself any time from your account page.</li>
            <li>After it is released, we can still delete your entry from our list, but we can&apos;t remove your number from copies of the file that have already been downloaded.</li>
            <li>To ask for your details to be deleted or corrected, message the admin from the number you registered with.</li>
          </ul>

          <h2>Keeping it safe</h2>
          <p>
            The list is stored in a private database that is not readable from the public website. Only the admin
            can view the full list. Log-in attempts are rate-limited.
          </p>
        </div>
      </main>
    </div>
  );
}
