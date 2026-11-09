import Image from "next/image"
import Link from "next/link"

type FooterLink = { label: string; href: string }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Job discovery", href: "jobs" },
      { label: "Worker AI", href: "worker-ai" },
      { label: "Companies", href: "company" },
      { label: "Salary data", href: "salary" },
    ],
  },
  {
    title: "Navigations",
    links: [
      { label: "Help center", href: "help" },
      { label: "Career library", href: "careers" },
      { label: "Contact", href: "contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Brand Guideline", href: "brand" },
      { label: "Newsroom", href: "newsroom" },
    ],
  },
]

const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    highlighted: false,
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "Pinterest",
    href: "https://pinterest.com",
    highlighted: true,
    path: "M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    highlighted: false,
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-[#050506]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[3fr_repeat(3,0.85fr)] lg:gap-12">
          <div>
            <Link href="/" aria-label="hireloop home" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="hireloop"
                width={154}
                height={44}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-7 text-white/40">
              The AI-native career platform. Built for people who take their
              work seriously.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:contents">
            {columns.map((column) => (
              <nav
                key={column.title}
                aria-labelledby={`footer-${column.title}`}
              >
                <h2
                  id={`footer-${column.title}`}
                  className="text-sm font-medium text-[#8069ff]"
                >
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/45 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/[0.06] pt-8 sm:mt-16 lg:flex-row lg:items-center lg:justify-between lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-2.5">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className={
                  social.highlighted
                    ? "inline-flex size-9 items-center justify-center rounded-md bg-[#6d4dfb] text-white transition-colors hover:bg-[#7c5cff]"
                    : "inline-flex size-9 items-center justify-center rounded-md bg-white/[0.06] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  className="size-4"
                >
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/35 sm:flex-row sm:items-center sm:gap-8">
            <p>Copyright ©{currentYear} — Hireloop</p>
            <div className="flex items-center gap-2">
              <Link
                href="terms"
                className="transition-colors hover:text-white"
              >
                Terms &amp; Policy
              </Link>
              <span aria-hidden>–</span>
              <Link
                href="privacy"
                className="transition-colors hover:text-white"
              >
                Privacy Guideline
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
