
export const GLASS_PANEL = "glass-panel rounded-[32px] border border-white/20 shadow-2xl";
export const GLASS_CARD = "glass-card rounded-3xl";

export const BUTTON_BASE = "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
export const BUTTON_VARIANTS = {
  primary: "bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-500/20 backdrop-blur-sm",
  secondary: "glass-button bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 backdrop-blur-md border border-white/10",
  ghost: "text-gray-500 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 backdrop-blur-sm"
};

export const INPUT_AUTH = "w-full pl-11 pr-3 py-3.5 rounded-xl bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400";
export const INPUT_SETTINGS = "w-full bg-white/30 dark:bg-black/30 backdrop-blur-md p-3 rounded-xl outline-none border border-white/10 focus:border-indigo-500 focus:bg-white/50 dark:focus:bg-black/50 transition-all font-medium";

export const TOAST_CONTAINER = "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right fade-in duration-300";
export const TOAST_ERROR = "bg-red-500/20 border-red-500/20 text-red-600 dark:text-red-400 backdrop-blur-xl";
export const TOAST_SUCCESS = "bg-green-500/20 border-green-500/20 text-green-600 dark:text-green-400 backdrop-blur-xl";
export const TOAST_INFO = "bg-white/60 dark:bg-black/60 border-indigo-500/20 text-zinc-800 dark:text-zinc-200 backdrop-blur-xl";
