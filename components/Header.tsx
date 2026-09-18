import { BookOpen, Gauge, GitBranch, Info } from "lucide-react";
import { GITHUB_REPO_URL, SITE_NAME } from "@/lib/site";

const NAV_ITEMS = [
  { href: "#pricing-sources", label: "Pricing Sources", icon: BookOpen },
  { href: "#about", label: "About", icon: Info },
];

const NAV_LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="#top"
          className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Gauge className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
            {SITE_NAME}
          </span>
        </a>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            <li>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={NAV_LINK_CLASS}
              >
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">GitHub</span>
                <span className="sr-only">GitHub repository (opens in a new tab)</span>
              </a>
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={NAV_LINK_CLASS}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sr-only sm:hidden">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
