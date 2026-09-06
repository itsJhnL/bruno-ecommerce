/**
 * The no-flash script.
 *
 * This must run BEFORE first paint, synchronously, in <head> — otherwise a
 * light-mode visitor sees a black flash on every navigation. It cannot be a
 * React effect and it cannot be deferred.
 *
 * It reads the stored preference, resolves "system" against the media query,
 * and stamps `data-theme` on <html>. Everything else in the design system keys
 * off that attribute.
 *
 * Kept deliberately tiny and dependency-free — it is inlined into every page.
 */
export const THEME_STORAGE_KEY = "bruno-theme";

const script = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var s=localStorage.getItem(k);
var m=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
var t=(s==="light"||s==="dark")?s:(s==="system"?m:"dark");
var e=document.documentElement;
e.setAttribute("data-theme",t);
e.style.colorScheme=t;
}catch(_){document.documentElement.setAttribute("data-theme","dark");}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
