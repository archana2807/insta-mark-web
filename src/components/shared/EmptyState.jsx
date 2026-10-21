/**
 * Empty-list message for card lists.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function EmptyState({ children }) {
  return <p className="text-secondary mb-0">{children}</p>;
}

/**
 * Empty-list message inside a table body.
 * @param {{ colSpan: number, children: import("react").ReactNode }} props
 */
export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-secondary">
        {children}
      </td>
    </tr>
  );
}
