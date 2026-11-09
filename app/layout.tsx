import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

import { cn } from "@/lib/utils"
import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"
import { ThemeProvider } from "next-themes"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Navbar></Navbar>
          <main className="flex-1">{children}</main>
          <Footer></Footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
