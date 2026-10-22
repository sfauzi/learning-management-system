import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, user, locale] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    getLocale(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        siteName={settings.site_name}
        tagline={settings.site_tagline}
        isAuthed={!!user}
        locale={locale}
      />
      <div className="flex-1">{children}</div>
      <SiteFooter settings={settings} />
    </div>
  );
}
