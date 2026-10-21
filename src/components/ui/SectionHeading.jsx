import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";

/**
 * Large heading + optional intro paragraph (theme pattern). A small label above the heading
 * is shown only where a section passes `eyebrow` (About and Our products on the home page).
 */
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
