import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";
import { AvatarPile } from "@/components/AvatarPile";
import { Brand } from "@/components/Brand";
import { ADMIN_WHATSAPP, CHANNEL_URL, SITE_NAME } from "@/lib/config";
import { countContacts, getSettings, type Settings } from "@/lib/contacts";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  let settings: Settings | null = null;
  let total = 0;
  try {
    [settings, total] = await Promise.all([getSettings(), countContacts()]);
  } catch (e) {
    console.error("home page data error:", e);
  }

  const loggedIn = !!(await getSession("user"));
  const capacity = settings?.capacity ?? 0;
  const full = !!settings && total >= capacity;
  const state = !settings ? null : settings.file_released ? "ready" : settings.registration_open && !full ? "open" : "closed";

  return (
    <div className="site">
      <header className="topbar">
        <Brand />
        {loggedIn && <Link className="toplink" href="/account">My account</Link>}
      </header>

      <main className="grid">
        <section className="hero">
          <h1 className="h1">Get your number saved on hundreds of phones in one tap.</h1>
          <p className="lede">
            Join the list. When it fills, every member gets one file that saves everyone&apos;s number.
            Your WhatsApp Status then reaches people who would never have seen it.
          </p>
          {settings && <AvatarPile total={total} capacity={capacity} />}
          {state && (
            <span className={`pill ${state === "ready" ? "pill-ready" : state === "open" ? "pill-open" : "pill-closed"}`}>
              {state === "ready" ? "File is ready to download" : state === "open" ? "Registration is open" : full ? "The list is full" : "Registration is closed"}
            </span>
          )}
        </section>

        <AuthPanel
          registrationOpen={!!settings?.registration_open}
          full={full}
          unavailable={!settings}
          channelUrl={CHANNEL_URL}
          adminWhatsapp={ADMIN_WHATSAPP}
        />

        <section className="how">
          <h2 className="h2">How it works</h2>
          <ol className="steps">
            <li><div><strong>Join.</strong> Give your name, WhatsApp number and a PIN.</div></li>
            <li><div><strong>Share the link.</strong> The more people join, the more phones you land on.</div></li>
            <li><div><strong>Log in when the file is ready.</strong> The download button appears in your account.</div></li>
            <li><div><strong>Open the file and import.</strong> Your phone saves every number in one go.</div></li>
          </ol>
        </section>

        <section className="faq">
          <h2 className="h2">Questions</h2>
          <details>
            <summary>What is a VCF file?</summary>
            <p>A VCF (vCard) is the standard file for sharing contacts. Open it on your phone and every contact inside is saved to your address book. Android, iPhone and Google Contacts all support it.</p>
          </details>
          <details>
            <summary>Why would I join?</summary>
            <p>People can only see your WhatsApp Status if they have your number saved. One file puts you in the address books of everyone who downloads it, so you don&apos;t have to ask people one by one.</p>
          </details>
          <details>
            <summary>Who gets to see my number?</summary>
            <p>Everyone who downloads the file, and they can keep it or share it. Once the file is released it can&apos;t be taken back, so only join if you&apos;re comfortable with that. Expect the odd message from strangers.</p>
          </details>
          <details>
            <summary>Does it cost anything?</summary>
            <p>No. Joining is free.</p>
          </details>
          <details>
            <summary>I forgot my PIN.</summary>
            <p>Message the admin on WhatsApp from the number you registered with, and they can reset it for you.</p>
          </details>
          <details>
            <summary>Can I take my number off the list?</summary>
            <p>Yes, any time before the file is released. Log in and choose &quot;Remove my number&quot; in your account.</p>
          </details>
        </section>
      </main>

      <footer className="foot">
        <span>{SITE_NAME}</span>
        <Link href="/privacy">Privacy</Link>
        {CHANNEL_URL && (
          <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">WhatsApp channel</a>
        )}
      </footer>
    </div>
  );
}
