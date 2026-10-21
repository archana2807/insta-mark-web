import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function ProjectCard({ project: p, headingLevel = "h3" }) {
  const Title = headingLevel;
  return (
    <Link href={`/projects/${p.slug}`} className="project-card">
      <div className="project-card__media">
        {p.cover ? (
          <Image
            src={p.cover.src}
            alt={p.cover.alt}
            fill
            sizes="(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw"
          />
        ) : (
          <div className="category-hero__placeholder h-100" aria-hidden="true">
            <Icon name="buildings" />
          </div>
        )}
      </div>
      <Title>{p.title}</Title>
      <div className="project-card__meta">
        {[p.clientName, p.city, p.year].filter(Boolean).join(" · ")}
      </div>
    </Link>
  );
}
