export const GLASS_PANEL = "holo-panel rounded-3xl";
export const GLASS_CARD = "holo-card rounded-2xl";

export const BUTTON_BASE = "flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed uppercase text-xs sm:text-sm";

export const BUTTON_VARIANTS = {
  primary: "bg-indigo-600/90 text-white backdrop-blur-md shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/30",
  secondary: "bg-white/5 text-gray-200 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
  ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  danger: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
};

export const INPUT_AUTH = "w-full pl-11 pr-4 py-4 rounded-2xl bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(99,102,241,0.1)] outline-none transition-all placeholder:text-gray-600 text-white backdrop-blur-sm";
export const INPUT_SETTINGS = "w-full bg-black/20 p-3.5 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 focus:bg-black/40 transition-all font-medium text-white backdrop-blur-sm";

export const TOAST_CONTAINER = "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right fade-in duration-500";
export const TOAST_ERROR = "bg-red-950/60 border-red-500/30 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.1)]";
export const TOAST_SUCCESS = "bg-emerald-950/60 border-emerald-500/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
export const TOAST_INFO = "bg-zinc-900/80 border-white/10 text-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.05)]";