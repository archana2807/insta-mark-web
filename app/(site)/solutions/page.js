import InnerHero from "@/components/sections/InnerHero";
import ShowcaseRow from "@/components/sections/ShowcaseRow";
import CtaPanel from "@/components/sections/CtaPanel";
import ExpertiseLists from "@/components/sections/ExpertiseLists";
import {
  getCategoriesByGroup,
  getExecutedWork,
  getHomeContent,
  getPageHeroImage,
} from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Signage & Road Safety Solutions",
  description:
    "Tailor-made, modular, braille and fire & safety signage, emergency lights, road signs and road safety products by Insta Mark.",
  path: "/solutions",
});

export default async function SolutionsPage() {
  const [groups, home, heroImage, work] = await Promise.all([
    getCategoriesByGroup(),
    getHomeContent(),
    getPageHeroImage("solutions"),
    getExecutedWork(),
  ]);
  const rows = groups.flatMap((g) => g.items.map((c) => ({ category: c, groupLabel: g.label })));
  // Two executed-work photos per solution (big + small, as in the theme's service blocks).
  const photos = Object.fromEntries(work.map((g) => [g.category.slug, g.images.slice(0, 2)]));

  return (
    <>
      <InnerHero
        label="Our solutions"
        image={heroImage}
        title="Complete signage & road safety solutions"
        lead={home.about.text}
        breadcrumbs={[{ label: "Solutions", href: "/solutions" }]}
      />
      <section className="section">
        <div className="container">
          {rows.map((r, i) => (
            <ShowcaseRow
              key={r.category.slug}
              category={r.category}
              groupLabel={r.groupLabel}
              images={photos[r.category.slug]}
              number={i + 1}
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </section>
      <ExpertiseLists expertise={home.expertise} />
      <CtaPanel cta={home.cta} />
    </>
  );
}
