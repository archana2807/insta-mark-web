import Eyebrow from "./Eyebrow";
import Reveal from "@/components/ui/Reveal";

/** Eyebrow + large heading + optional intro paragraph (theme pattern). */
export default function SectionHeading({
  eyebrow,
  title,
  text,
  as: Tag = "h2",
  center = false,
  className = "",
}) {
  return (
    <Reveal
      stagger={150}
      className={`section-heading ${center ? "text-center" : ""} ${className}`.trim()}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag className="h2">{title}</Tag>
      {text && <p className={`lead-text ${center ? "mx-auto" : ""}`.trim()}>{text}</p>}
    </Reveal>
  );
}
