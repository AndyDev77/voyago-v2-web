// Classes de boutons partagées (utilisables depuis les composants serveur comme client).
export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
  primary: "bg-primary text-[#062420] hover:bg-primary-dark glow-primary",
  gold: "bg-gold text-[#2a1f00] hover:bg-gold-dark glow-gold",
  ghost: "border border-line bg-surface-2/60 text-ink hover:border-primary/60 hover:text-primary",
  outline: "border border-primary text-primary hover:bg-primary hover:text-[#062420]",
  danger: "border border-coral/50 text-coral hover:bg-coral/10",
  dark: "bg-[#111] text-white hover:bg-black",
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base py-3.5",
};
