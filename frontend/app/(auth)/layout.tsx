export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl tracking-tight">KH<span className="text-[#FF0011]">3</span></h1>
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mt-1">Group CRM</p>
        </div>
        {children}
      </div>
    </div>
  );
}
