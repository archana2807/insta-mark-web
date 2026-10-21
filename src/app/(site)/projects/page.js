import Link from "next/link";
import InnerHero from "@/components/sections/InnerHero";
import Gallery from "@/components/sections/Gallery";
import CtaPanel from "@/components/sections/CtaPanel";
import Eyebrow from "@/components/ui/Eyebrow";
import ProjectCard from "@/components/sections/ProjectCard";
import * as categoryService from "@/server/modules/categories/category.service";
import * as pageSectionService from "@/server/modules/page-sections/page-section.service";
import * as projectService from "@/server/modules/projects/project.service";
import { pageMetadata } from "@/lib/seo";
import Icon from "@/components/ui/Icon";

export const metadata = pageMetadata({
  title: "Projects",
  description:
    "Executed signage and road safety projects by Insta Mark — residential towers, airports, hospitals, campuses, retail and parking facilities across India.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const [page, work, home, projects, heroImage] = await Promise.all([
    pageSectionService.getProjectsPageContent(),
    categoryService.listExecutedWork(),
    pageSectionService.getHomeContent(),
    projectService.listProjects(),
    pageSectionService.getPageHeroImage("projects"),
  ]);
  const total = work.reduce((n, g) => n + g.images.length, 0);

  return (
    <>
      <InnerHero
        label="Our work"
        image={heroImage}
        title={page.title}
        lead={page.text}
        breadcrumbs={[{ label: "Projects", href: "/projects" }]}
      >
        <nav aria-label="Jump to category" className="mt-5">
          <ul className="tag-list">
            {work.map(({ category, images }) => (
              <li key={category.slug}>
                <Link href={`#${category.slug}`}>
                  {category.name} <span className="text-secondary">({images.length})</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="small text-secondary mt-3 mb-0">{total} photos from executed sites</p>
        </nav>
      </InnerHero>

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
                <Eyebrow>{String(i + 1).padStart(2, "0")}</Eyebrow>
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

      <CtaPanel cta={home.cta} />
    </>
  );
}
