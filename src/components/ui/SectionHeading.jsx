import Reveal from "@/components/ui/Reveal";

/** Large heading + optional intro paragraph (theme pattern; no small label above). */
export default function SectionHeading({
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
      <Tag className="h2">{title}</Tag>
      {text && <p className={`lead-text ${center ? "mx-auto" : ""}`.trim()}>{text}</p>}
    </Reveal>
  );
}
