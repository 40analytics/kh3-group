export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-10">
        <div>
          <h1 className="font-display text-2xl tracking-tight">
            KH<span className="text-[#FF0011]">3</span>
          </h1>
          <p className="text-xs font-medium tracking-widest uppercase text-background/60 mt-0.5">
            Group CRM
          </p>
        </div>
        <div className="space-y-4">
          <blockquote className="text-lg font-display leading-relaxed text-background/90">
            &ldquo;Streamline your sales pipeline, manage clients, and make
            data-driven decisions — all in one place.&rdquo;
          </blockquote>
          <p className="text-sm text-background/50">
            AI-Enhanced Business Performance Dashboard
          </p>
        </div>
        <p className="text-xs text-background/40">
          &copy; {new Date().getFullYear()} KH3 Group. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="lg:hidden text-center mb-8">
          <h1 className="font-display text-3xl tracking-tight">
            KH<span className="text-[#FF0011]">3</span>
          </h1>
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mt-1">
            Group CRM
          </p>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
