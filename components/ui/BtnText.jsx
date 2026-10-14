/**
 * Button label with the theme's hover effect: the text slides up and a copy
 * rises in from below. Pass a plain string. Works in server and client components.
 */
export default function BtnText({ children }) {
  return (
    <span className="btn-switch" data-text={children}>
      <span>{children}</span>
    </span>
  );
}
