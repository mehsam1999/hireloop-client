import { Banner } from "@/components/homepage/banner"
import { Features } from "@/components/homepage/features"

export default function Page() {
  return (
    <div className="min-h-svh bg-[#050506] text-white">
      <Banner />
      <Features />
    </div>
  )
}
