export const GLASS_PANEL = "glass-panel rounded-[32px] border border-white/20 shadow-2xl";
export const GLASS_CARD = "glass-card rounded-3xl";

export const BUTTON_BASE = "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed";
export const BUTTON_VARIANTS = {
  primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 border border-indigo-500/20",
  secondary: "glass-button text-gray-700 dark:text-gray-200 hover:bg-white/40 dark:hover:bg-white/10",
  ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
};

export const INPUT_AUTH = "w-full pl-11 pr-3 py-3.5 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400";
export const INPUT_SETTINGS = "w-full bg-gray-50 dark:bg-black/20 p-3 rounded-xl outline-none border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-black/40 transition-all font-medium";

export const TOAST_CONTAINER = "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right fade-in duration-300";
export const TOAST_ERROR = "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
export const TOAST_SUCCESS = "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400";
export const TOAST_INFO = "bg-white/80 dark:bg-zinc-800/80 border-indigo-500/20 text-zinc-800 dark:text-zinc-200";