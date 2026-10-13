import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import Icon from "@/components/ui/Icon";
import {
  getCategories,
  getCategoriesByGroup,
  getNavigation,
  getProjectsPageContent,
  getSite,
} from "@/lib/data";
import { organizationJsonLd } from "@/lib/seo";

/** Public website shell: header, footer, floating contact buttons. */
export default async function SiteLayout({ children }) {
  const [site, nav, groups, categories, projectsPage] = await Promise.all([
    getSite(),
    getNavigation(),
    getCategoriesByGroup(),
    getCategories(),
    getProjectsPageContent(),
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
      <Footer site={site} categories={categories} ctaTitle={projectsPage.cta} />
      <FloatingActions contact={site.contact} />
      <GoogleAnalytics id={process.env.NEXT_PUBLIC_GA_ID} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd(site) }}
      />
    </>
  );
}
