import InnerHero from "@/components/sections/InnerHero";
import ShowcaseRow from "@/components/sections/ShowcaseRow";
import ExpertiseLists from "@/components/sections/ExpertiseLists";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Signage & Road Safety Solutions",
  description:
    "Tailor-made, modular, braille and fire & safety signage, emergency lights, road signs and road safety products by Insta Mark.",
  path: "/solutions",
});

export default async function SolutionsPage() {
  const [groups, home, heroImage] = await Promise.all([
    categoryService.listCategoriesByGroup(),
    pageSectionService.getHomeContent(),
    pageSectionService.getPageHeroImage("solutions"),
  ]);
  const rows = groups.flatMap((g) => g.items.map((c) => ({ category: c })));
  // Two photos per solution (big + small, as in the theme's service blocks): the cover
  // chosen in admin first, then executed work (R-8.2).
  const photos = Object.fromEntries(
    await Promise.all(
      rows.map(async (r) => [
        r.category.slug,
        await categoryService.getCategoryPhotos(r.category.slug, 2),
      ]),
    ),
  );

  return (
    <>
      <InnerHero
        image={heroImage}
        title="Complete Signage & Road Safety Solutions"
        lead={home.about.text}
        breadcrumbs={[{ label: "Solutions", href: "/solutions" }]}
      />
      <section className="section">
        <div className="container">
          {rows.map((r, i) => (
            <ShowcaseRow
              key={r.category.slug}
              category={r.category}
              images={photos[r.category.slug]}
              number={i + 1}
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </section>
      <ExpertiseLists expertise={home.expertise} />
    </>
  );
}
