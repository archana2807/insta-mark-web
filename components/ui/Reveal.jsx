/**
 * Layout wrapper kept for existing call sites. The scroll fade-in was removed
 * (client: no fancy animation for site/procurement users), so content is
 * always shown immediately. `delay` is accepted and ignored.
 */
// eslint-disable-next-line no-unused-vars
export default function Reveal({ as: Tag = "div", delay, className = "", children, ...rest }) {
  return (
    <Tag className={className || undefined} {...rest}>
      {children}
    </Tag>
  );
}
