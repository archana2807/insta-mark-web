import InnerHero from "@/components/sections/InnerHero";
import ShowcaseRow from "@/components/sections/ShowcaseRow";
import CtaPanel from "@/components/sections/CtaPanel";
import {
  getCategoriesByGroup,
  getCategoryCoverImage,
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
  const [groups, home, heroImage] = await Promise.all([
    getCategoriesByGroup(),
    getHomeContent(),
    getPageHeroImage("solutions"),
  ]);
  const rows = groups.flatMap((g) => g.items.map((c) => ({ category: c, groupLabel: g.label })));
  const covers = await Promise.all(rows.map((r) => getCategoryCoverImage(r.category.slug)));

  return (
    <>
      <InnerHero
        label="Our solutions"
        image={heroImage}
        title="Complete signage & road safety solutions"
        lead={home.about.text}
        breadcrumbs={[{ label: "Solutions", href: "/solutions" }]}
      />
      <section className="section pt-4">
        <div className="container">
          {rows.map((r, i) => (
            <ShowcaseRow
              key={r.category.slug}
              category={r.category}
              groupLabel={r.groupLabel}
              cover={covers[i]}
              number={i + 1}
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </section>
      <CtaPanel cta={home.cta} />
    </>
  );
}
