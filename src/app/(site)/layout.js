import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import Icon from "@/components/ui/Icon";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import * as settingService from "@/server/modules/settings/setting.service";
import { organizationJsonLd } from "@/lib/seo";

/** Public website shell: header, footer, floating contact buttons. */
export default async function SiteLayout({ children }) {
  const [site, nav, groups, categories, footerCta] = await Promise.all([
    settingService.getSite(),
    pageSectionService.getNavigation(),
    categoryService.listCategoriesByGroup(),
    categoryService.listCategories(),
    pageSectionService.getFooterCta(),
  ]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header
        nav={nav}
        solutionGroups={groups.map((g) => ({
          ...g,
          // Category icons come from the DB; render them here (server, full icon
          // set) so the client bundle only carries a small icon subset.
          items: g.items.map((c) => ({ ...c, iconNode: <Icon name={c.icon} /> })),
        }))}
      />
      <main id="main">{children}</main>
      <Footer site={site} categories={categories} cta={footerCta} />
      <FloatingActions contact={site.contact} />
      <GoogleAnalytics id={process.env.NEXT_PUBLIC_GA_ID} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd(site) }}
      />
    </>
  );
}
