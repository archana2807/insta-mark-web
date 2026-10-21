import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/sections/PageHero";
import Gallery from "@/components/sections/Gallery";
import EnquirySection from "@/components/sections/EnquirySection";
import * as categoryService from "@/server/modules/categories/category.service";
import * as projectService from "@/server/modules/projects/project.service";
import * as settingService from "@/server/modules/settings/setting.service";
import { pageMetadata } from "@/lib/seo";

// Projects are created in the admin panel; new slugs render on first request.
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await projectService.listProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await projectService.getProject(slug);
  if (!p) return {};
  const where = [p.city, p.year].filter(Boolean).join(", ");
  return pageMetadata({
    title: p.title,
    description:
      p.description?.slice(0, 155) ??
      `Signage executed by Insta Mark${p.clientName ? ` for ${p.clientName}` : ""}${where ? ` (${where})` : ""}.`,
    path: `/projects/${slug}`,
    image: p.cover,
  });
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const [p, site, categories] = await Promise.all([
    projectService.getProject(slug),
    settingService.getSite(),
    categoryService.listCategories(),
  ]);
  if (!p) notFound();

  const facts = [
    ["Client", p.clientName],
    ["Location", p.city],
    ["Year", p.year],
    ["Sector", p.industry],
  ].filter(([, v]) => v);

  return (
    <>
      <PageHero
        title={p.title}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: p.title, href: `/projects/${p.slug}` },
        ]}
      />
      <section className="pb-7">
        <div className="container">
          <div className="row g-4 g-lg-5">
            <div className="col-lg-7">
              {p.cover && (
                <div className="position-relative mb-4" style={{ aspectRatio: "4 / 3" }}>
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt}
                    fill
                    priority
                    sizes="(min-width: 992px) 58vw, 100vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              {p.description && (
                <p className="lead-text" style={{ whiteSpace: "pre-line", maxWidth: "none" }}>
                  {p.description}
                </p>
              )}
            </div>
            <div className="col-lg-4 offset-lg-1">
              {facts.length > 0 && (
                <ul className="contact-list mb-4">
                  {facts.map(([k, v]) => (
                    <li key={k}>
                      <div>
                        <small>{k}</small>
                        <span>{v}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {p.categories.length > 0 && (
                <>
                  <h2 className="h5">Solutions used</h2>
                  <ul className="tag-list">
                    {p.categories.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/solutions/${c.slug}`}>{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {p.images.length > 1 && (
        <section className="section pt-0" aria-labelledby="gallery-title">
          <div className="container">
            <h2 id="gallery-title" className="mb-5">
              Project gallery
            </h2>
            <Gallery images={p.images} label={`${p.title} photos`} />
          </div>
        </section>
      )}

      <EnquirySection
        title="Planning a similar project?"
        text="Tell us about your site and we will recommend the right signage solution."
        categories={categories}
        defaultRequirement={p.categories[0]?.name}
        contact={site.contact}
      />
    </>
  );
}
