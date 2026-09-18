import { Gauge } from "lucide-react";
import { GITHUB_REPO_URL, SITE_NAME } from "@/lib/site";

const FOOTER_LINKS = [
  { href: GITHUB_REPO_URL, label: "GitHub Repository", external: true },
  { href: "#pricing-sources", label: "Pricing Sources", external: false },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              {SITE_NAME}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Built with Next.js and TypeScript.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="rounded-sm text-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
