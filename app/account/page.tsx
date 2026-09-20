import { redirect } from "next/navigation";
import { AccountActions } from "@/components/AccountActions";
import { AvatarPile } from "@/components/AvatarPile";
import { Brand } from "@/components/Brand";
import { CHANNEL_URL, SITE_NAME, SITE_URL } from "@/lib/config";
import { countContacts, getCurrentContact, getSettings } from "@/lib/contacts";
import { formatPhone } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata = { title: `My account | ${SITE_NAME}` };

export default async function AccountPage() {
  const me = await getCurrentContact();
  if (!me) redirect("/");

  const [settings, total] = await Promise.all([getSettings(), countContacts()]);
  const shareText = `Get your number saved on hundreds of phones: ${SITE_URL}`;

  return (
    <div className="site">
      <header className="topbar">
        <Brand />
      </header>

      <main className="narrow stack" style={{ gap: "2rem" }}>
        <section>
          <h1 className="h2" style={{ fontSize: "2.2rem" }}>Hi, {me.name.split(" ")[0]}</h1>
          <p className="lede" style={{ marginTop: "0.5rem" }}>
            You&apos;re on the list as <strong>{me.name}</strong>, {formatPhone(me.phone)}.
          </p>
        </section>

        {settings.file_released ? (
          <section className="card stack">
            <h2 className="h3" style={{ marginBottom: 0 }}>The file is ready</h2>
            <p>Download it, then open it on your phone to save everyone&apos;s number.</p>
            <a className="btn btn-block" href="/api/vcf" download>
              Download the contact file
            </a>
            <div>
              <p className="label">To import it</p>
              <ol className="prose" style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", gap: "0.4rem" }}>
                <li><strong>Android:</strong> tap the downloaded file, choose Contacts, then save to your account.</li>
                <li><strong>iPhone:</strong> tap the file, choose Contacts, then Add All Contacts.</li>
                <li>Post a status and watch for new viewers.</li>
              </ol>
            </div>
          </section>
        ) : (
          <section className="plain-card stack">
            <h2 className="h3" style={{ marginBottom: 0 }}>Waiting for the list to fill</h2>
            <p>
              The download button appears here when the file is released. Share the link so it fills faster.
            </p>
            <AvatarPile total={total} capacity={settings.capacity} />
            <div className="row">
              {SITE_URL && (
                <a className="btn btn-small" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                  Share on WhatsApp
                </a>
              )}
              {CHANNEL_URL && (
                <a className="btn btn-ghost btn-small" href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Follow updates
                </a>
              )}
            </div>
          </section>
        )}

        <AccountActions canRemove={!settings.file_released} />
      </main>
    </div>
  );
}
