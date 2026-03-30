import Link from "next/link";
import { Utensils, GraduationCap, Store, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-mesh text-on-surface min-h-[100dvh] flex flex-col items-center justify-between overflow-hidden selection:bg-primary-container selection:text-surface-dim">
      {/* Top Section: Brand Identity */}
      <header className="w-full pt-16 flex flex-col items-center text-center px-8">
        {/* Logo with Glow Halo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-container/20 blur-3xl rounded-full" />
          <div className="relative flex items-center justify-center w-20 h-20 glass-card rounded-2xl glow-border">
            <Utensils size={36} className="text-primary-container" />
          </div>
        </div>

        <h1 className="font-extrabold text-4xl tracking-tighter text-on-surface mb-2">
          CampusBite
        </h1>
        <p className="text-xs uppercase font-semibold tracking-[0.2em] text-primary">
          Discover. Swipe. Eat.
        </p>
      </header>

      {/* Center Section: Role Selection Cards */}
      <main className="w-full max-w-sm px-6 flex flex-col gap-6 py-12">
        {/* Student Card */}
        <Link
          href="/auth/student"
          className="group relative w-full glass-card rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 glow-border overflow-hidden"
        >
          <div className="mb-4 bg-primary-container/20 p-3 rounded-xl">
            <GraduationCap size={28} className="text-primary-container" />
          </div>
          <h2 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
            I&apos;m a Student
          </h2>
          <p className="text-on-surface/60 text-sm leading-relaxed max-w-[80%]">
            Swipe through campus menus and grab your next meal in seconds.
          </p>
          <div className="mt-6 flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <span>Start Exploring</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Kiosk Owner Card */}
        <Link
          href="/auth/kiosk"
          className="group relative w-full glass-card rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:scale-[1.02] active:scale-95 glow-border overflow-hidden"
        >
          <div className="mb-4 bg-primary-container/20 p-3 rounded-xl">
            <Store size={28} className="text-primary-container" />
          </div>
          <h2 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
            I&apos;m a Kiosk Owner
          </h2>
          <p className="text-on-surface/60 text-sm leading-relaxed max-w-[80%]">
            Manage your digital menu and reach more hungry students daily.
          </p>
          <div className="mt-6 flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <span>Dashboard Login</span>
            <ArrowRight size={14} />
          </div>
        </Link>
      </main>

      {/* Bottom Section: Footer */}
      <footer className="w-full pb-10 px-8 flex flex-col items-center gap-4">
        <div className="w-12 h-[1px] bg-outline-variant/30" />
        <p className="text-[10px] text-on-surface/40 uppercase tracking-[0.2em] font-medium">
          © 2024 LPU Campus Food Network
        </p>
        <div className="mt-2 w-32 h-1 bg-surface-bright/20 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary-container/40 rounded-full" />
        </div>
      </footer>
    </div>
  );
}
