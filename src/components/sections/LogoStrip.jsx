import Image from "next/image";

/** "Trusted by" client logos (from admin). Renders nothing until logos exist. */
export default function LogoStrip({ logos }) {
  if (!logos?.length) return null;
  return (
    <ul className="logo-strip list-unstyled mb-0" aria-label="Clients">
      {logos.map((l) => {
        const img = (
          <Image
            src={l.logo.src}
            alt={l.logo.alt || `${l.name} logo`}
            width={l.logo.width}
            height={l.logo.height}
            sizes="160px"
          />
        );
        return (
          <li key={l.name}>
            {l.websiteUrl ? (
              <a href={l.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
                {img}
              </a>
            ) : (
              img
            )}
          </li>
        );
      })}
    </ul>
  );
}
