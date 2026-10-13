/**
 * Renders a Bootstrap Icons SVG from a generated path map. Path data comes from
 * the bootstrap-icons package at build time (trusted), never from user input —
 * unknown names fall back to "signpost".
 */
export default function SvgIcon({ map, name, className = "", label }) {
  const body = map[name] ?? map.signpost ?? "";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="currentColor"
      className={`bi ${className}`.trim()}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true, focusable: "false" })}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
