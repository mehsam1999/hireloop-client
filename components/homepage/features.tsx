import {
  Bookmark,
  Building2,
  ChartNoAxesColumnIncreasing,
  CircleDot,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Find your ideal job with advanced filters.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Salary Insights",
    description: "Get real salary data to negotiate confidently.",
  },
  {
    icon: Building2,
    title: "Top Companies",
    description: "Apply to vetted companies that are hiring.",
  },
  {
    icon: Bookmark,
    title: "Saved Jobs",
    description: "Manage apps & favorites on your dashboard.",
  },
  {
    icon: Sparkles,
    title: "One-Click Apply",
    description: "Simplify your job applications for an easier process.",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create professional resumes with modern templates.",
  },
  {
    icon: CircleDot,
    title: "Skill-Based Matching",
    description: "Discover jobs that match your skills and experience.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Resources",
    description: "Boost your career with quick interview tips.",
  },
]

export function Features() {
  return (
    <section className="bg-[#050506] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="size-1.5 rounded-[1px] bg-[#6d4dfb]" />
          <span className="text-[11px] font-medium tracking-[0.18em] text-white/60 uppercase">
            Features Job
          </span>
          <span aria-hidden className="size-1.5 rounded-[1px] bg-[#6d4dfb]" />
        </div>

        <h2 className="mx-auto mt-5 max-w-2xl text-center text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-[40px] lg:leading-[1.15]">
          Everything you need
          <br />
          to succeed
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#141417] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                <Icon className="size-[18px] text-white/65" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-sm font-medium text-white/90">{title}</h3>
                <p className="mt-1.5 max-w-[190px] text-xs leading-relaxed text-white/40">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
