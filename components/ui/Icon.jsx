import SvgIcon from "./SvgIcon";
import { ICONS } from "./icons.generated";

/**
 * Icon for SERVER components (full generated set, incl. category/industry
 * icons from the database). Client components must use ClientIcon instead,
 * otherwise the whole icon map is shipped to the browser.
 */
export default function Icon(props) {
  return <SvgIcon map={ICONS} {...props} />;
}
