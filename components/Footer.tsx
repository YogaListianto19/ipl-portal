export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="hidden sm:block border-t border-rose-100 bg-white/60 mt-auto">
      <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center gap-1">
        <p className="text-xs text-slate-400 text-center">
          © {year} <span className="font-semibold text-rose-700">Portal IPL Rossela</span> — G-Land Katapang Residence
        </p>
        <p className="text-[11px] text-slate-300">
          Developed &amp; maintained by <span className="text-slate-400 font-medium">Tim Pengurus Blok Rossela</span>
        </p>
      </div>
    </footer>
  )
}
