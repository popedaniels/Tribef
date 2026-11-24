// PostCSS plugin: run PurgeCSS on GLOBAL stylesheets only (Bootstrap, the
// design system, vendor CSS). CSS modules are already scoped per component
// and are left alone. Production builds only.
const purgecss = require("@fullhuman/postcss-purgecss").default || require("@fullhuman/postcss-purgecss");

const purge = purgecss({
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./layouts/**/*.{js,jsx,ts,tsx}", "./store/**/*.{js,ts}"],
  // Keep anything whose class is only added at runtime by a library or by
  // string building we can't see statically.
  safelist: {
    standard: [/^ft-/, /^is-/, /^was-validated$/, /^show$/, /^fade$/, /^active$/, /^disabled$/, /^dark/, /^light/, /^sr-only/, /^visually-hidden/],
    deep: [/^carousel/, /^slide/, /^control-/, /^thumb/, /^dot/, /nprogress/, /^recharts/, /^react-loader/, /^modal/, /^tooltip/, /^popover/, /^collapse/, /^collapsing/],
    greedy: [/data-theme/, /aria-/],
  },
  defaultExtractor: (content) => content.match(/[\w-/:%.]+(?<!:)/g) || [],
  // Custom properties are declared in one stylesheet and used in others (and
  // in CSS modules); per-file purging would drop them, so keep them all.
  variables: false,
  keyframes: false,
  fontFace: false,
});

module.exports = () => ({
  postcssPlugin: "purge-global-only",
  OnceExit(root, helpers) {
    const file = root.source?.input?.file || "";
    if (process.env.NODE_ENV !== "production" || process.env.PURGE_CSS === "off") return undefined;
    if (!file || /\.module\.(s?css|sass)$/.test(file)) return undefined;
    return purge.OnceExit(root, helpers);
  },
});
module.exports.postcss = true;
