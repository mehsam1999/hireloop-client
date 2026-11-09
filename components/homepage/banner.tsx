import Image from "next/image"
import {
  Briefcase,
  Building2,
  MapPin,
  Search,
  SearchCheck,
  Star,
} from "lucide-react"

const trending = ["Product Designer", "AI Engineering", "Devops Engineer"]

const stats = [
  { icon: Briefcase, value: "50K", label: "Active Jobs" },
  { icon: Building2, value: "12K", label: "Companies" },
  { icon: SearchCheck, value: "2M", label: "Job Seekers" },
  { icon: Star, value: "97%", label: "Satisfaction Rate" },
]

export function Banner() {
  return (
    <section className="relative overflow-hidden bg-[#050506] pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(109,77,251,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-star-field pointer-events-none absolute inset-x-0 top-0 h-[680px] opacity-70"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <span
            aria-hidden
            className="h-px w-10 bg-gradient-to-r from-transparent to-white/25 sm:w-24"
          />
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.08em] text-white/65 uppercase sm:text-[11px]">
            <Briefcase className="size-3.5 text-orange-500" />
            <span className="font-semibold text-orange-400">50,000+</span>
            <span>New Jobs This Month</span>
          </div>
          <span
            aria-hidden
            className="h-px w-10 bg-gradient-to-l from-transparent to-white/25 sm:w-24"
          />
        </div>

        {/* Heading */}
        <div className="mx-auto mt-7 max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[52px] lg:leading-[1.08]">
            Find Your Dream Job Today
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-balance text-white/55 sm:text-base">
            Hireloop connects top talent with world-class companies. Browse
            thousands of curated opportunities and land your next role — faster.
          </p>
        </div>

        {/* Search */}
        <form
          action="#"
          className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#141418] p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:rounded-full"
        >
          <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3 sm:px-4">
            <Search className="size-4 shrink-0 text-white/45" />
            <span className="sr-only">Job title, skill or company</span>
            <input
              type="text"
              placeholder="Job title, skill or company"
              className="h-11 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </label>

          <span
            aria-hidden
            className="hidden h-6 w-px shrink-0 bg-white/10 sm:block"
          />

          <label className="flex min-w-0 flex-1 items-center gap-2.5 border-t border-white/10 px-3 pt-2 sm:border-t-0 sm:px-4 sm:pt-0">
            <MapPin className="size-4 shrink-0 text-white/45" />
            <span className="sr-only">Location or Remote</span>
            <input
              type="text"
              placeholder="Location or Remote"
              className="h-11 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </label>

          <button
            type="submit"
            aria-label="Search jobs"
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#8367ff] to-[#6a48f5] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-8px_rgba(109,77,251,0.9)] transition-colors hover:from-[#9179ff] hover:to-[#7a5cff] sm:w-12"
          >
            <Search className="size-5" />
          </button>
        </form>

        {/* Trending */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/40">
          <span className="px-1">Trending Position</span>
          {trending.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/55 transition-colors hover:border-white/20 hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Globe + stats */}
      <div className="relative mt-2 sm:mt-0">
        <div className="relative mx-auto h-[300px] w-full max-w-7xl overflow-hidden sm:h-[420px] lg:h-[500px]">
          <Image
            src="/images/globe.png"
            alt="Globe representing opportunities around the world"
            width={1440}
            height={1882}
            priority
            className="absolute top-0 left-1/2 w-[130%] max-w-none -translate-x-1/2 -translate-y-[42%] opacity-95 sm:w-[115%] lg:w-full"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050506] to-transparent"
          />
          <p className="absolute inset-x-4 top-[30%] mx-auto max-w-2xl text-center text-xl font-medium tracking-tight text-balance text-white/85 drop-shadow-[0_2px_20px_rgba(0,0,0,0.65)] sm:top-[34%] sm:text-2xl lg:text-[28px] lg:leading-snug">
            Assisting over 15,000 job seekers
            <br className="hidden sm:block" /> find their dream positions.
          </p>
        </div>

        <div className="relative z-10 mx-auto -mt-16 w-full max-w-7xl px-4 sm:-mt-20 sm:px-6 lg:-mt-24 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-md sm:p-5"
              >
                <Icon className="size-4 text-white/55" strokeWidth={1.6} />
                <p className="mt-7 text-3xl font-semibold tracking-tight text-white sm:mt-9 sm:text-4xl">
                  {value}
                </p>
                <p className="mt-1 text-xs text-white/55 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
