"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { label: "Browse Jobs", href: "jobs" },
  { label: "Company", href: "company" },
  { label: "Pricing", href: "pricing" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050506] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="hireloop home" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="hireloop"
            width={154}
            height={44}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <span aria-hidden className="h-4 w-px bg-white/15" />

          <Link
            href="/sign-in"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Sign In
          </Link>

          <Button
            nativeButton={false}
            render={<Link href="/get-started" />}

            className="h-9 rounded-lg bg-[#6d4dfb] px-4 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_8px_24px_-8px_rgba(109,77,251,0.9)] transition-colors hover:bg-[#7c5cff]"
          >
            Get Started
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/80 transition-colors hover:bg-white/5 hover:text-white md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-white/5 bg-[#050506] transition-[max-height] duration-300 ease-out md:hidden",
          open ? "max-h-80" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign In
          </Link>

          <Button
            nativeButton={false}
            render={<Link href="/get-started" onClick={() => setOpen(false)} />}
            className="mt-2 h-10 rounded-lg bg-[#6d4dfb] px-4 text-sm font-medium text-white hover:bg-[#7c5cff]"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
