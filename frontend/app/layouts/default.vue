<template>
  <div class="site-shell">
    <a href="#main" class="skip-link">К содержимому</a><SiteHeader />
    <main id="main"><slot /></main>
    <footer class="site-footer container">
      <BrandLogo />
      <p>Меньше смотреть. Больше писать код.</p>
      <span>JavaScript / TypeScript / Backend</span>
      <NuxtLink to="/legal-documents" class="text-link"
        >Правовые документы</NuxtLink
      >
    </footer>
    <p class="music-credit container">
      Музыка:
      <a
        href="https://www.scottbuckley.com.au/library/reverie/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Reverie — Scott Buckley
      </a>
      ·
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        >CC BY 4.0</a
      >
    </p>
    <div class="container"><LegalLinks /></div>
    <AuthorSupport />
    <AnalyticsConsent />
  </div>
</template>
