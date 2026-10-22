import Link from "next/link";
import Gallery from "@/components/sections/Gallery";
import ProjectCard from "@/components/sections/ProjectCard";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import * as projectService from "@/server/modules/projects/project.service";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";

export const metadata = pageMetadata({
  title: "Projects",
  description:
    "Executed signage and road safety projects by Insta Mark — residential towers, airports, hospitals, campuses, retail and parking facilities across India.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const [page, work, home, projects] = await Promise.all([
    pageSectionService.getProjectsPageContent(),
    categoryService.listExecutedWork(),
    pageSectionService.getHomeContent(),
    projectService.listProjects(),
  ]);

  return (
    <>
      {/* Hero like the reference's portfolio page: a big centred title, the client's sentence
          under it, and (ours) quick links to each category further down. No photo. */}
      <section className="portfolio-hero" aria-labelledby="page-title">
        <div className="container">
          <div className="load-stagger">
            <h1 id="page-title" className="portfolio-hero__title">
              {page.title}
            </h1>
            <div className="portfolio-hero__body">
              <p className="portfolio-hero__text">{page.text}</p>
              <nav aria-label="Jump to category">
                <ul className="portfolio-hero__links">
                  {work.map(({ category, images }) => (
                    <li key={category.slug}>
                      <Link href={`#${category.slug}`}>
                        {category.name} <span>({images.length})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: breadcrumbJsonLd([
              { label: "Home", href: "/" },
              { label: "Projects", href: "/projects" },
            ]),
          }}
        />
      </section>

      {projects.length > 0 && (
        <section className="section pt-4" aria-labelledby="featured-projects-title">
          <div className="container">
            <h2 id="featured-projects-title" className="mb-5">
              Featured projects
            </h2>
            <div className="row g-4 gy-5">
              {projects.map((p) => (
                <div className="col-sm-6 col-lg-4" key={p.slug}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {work.map(({ category, images }, i) => (
        <section
          key={category.slug}
          id={category.slug}
          className={`section ${i % 2 === 1 ? "bg-surface" : ""}`}
          aria-labelledby={`${category.slug}-title`}
        >
          <div className="container">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-5">
              <div>
                <h2 id={`${category.slug}-title`} className="mb-0">
                  {category.name}
                </h2>
              </div>
              <Link href={`/solutions/${category.slug}`} className="link-arrow">
                About this solution <Icon name="arrow-right" />
              </Link>
            </div>
            <Gallery images={images} label={`${category.name} projects`} />
          </div>
        </section>
      ))}
    </>
  );
}
