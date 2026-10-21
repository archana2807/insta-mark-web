import SvgIcon from "./SvgIcon";
import { CLIENT_ICONS } from "./icons.client.generated";

/** Icon for CLIENT components — small subset (see CLIENT_ICONS in scripts/build-icons.js). */
export default function ClientIcon(props) {
  return <SvgIcon map={CLIENT_ICONS} {...props} />;
}
