# Localisation (FT-043)

Fund&Trace's UI strings live in `FundandTrace/src/i18n/messages.ts`.

- **Languages:** English (source), French (francophone West/Central Africa:
  Côte d'Ivoire, Senegal, Cameroon…) and Swahili (Kenya, Tanzania, Uganda).
- **Status:** French and Swahili are first drafts written without a native
  reviewer. Before marketing either language, have a native speaker check every
  string (especially legal wording on the donate page) and the `/terms` and
  `/privacy` pages, which are still English-only.
- **Coverage:** the donate flow (the highest-value page), the footer language
  switcher and `<html lang>`. Other pages fall back to English.
- **Choosing a language:** saved choice (`ft_lang` cookie) → browser language →
  English. The server renders English and the client switches after mount, so
  there is no hydration mismatch; translated pages are not separately indexed.
- **Adding strings:** add the English key first, then translations. Missing
  keys fall back to English per key. `src/i18n/__tests__/i18n.test.ts` fails if
  a translation drops or adds a `{placeholder}`.
- **Adding a language:** add it to `LOCALES` and `MESSAGES`. Hausa, Yoruba,
  Igbo, Twi and Amharic are good next candidates; commission translations
  rather than machine-translating.
