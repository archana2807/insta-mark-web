import Icon from "@/components/ui/Icon";
/** Bordered tile grid with icons — Industries We Serve / Why Choose Us. */
export default function IconGrid({ items, cols = "col-6 col-md-4 col-lg-3" }) {
  return (
    <ul className="row g-0 icon-grid list-unstyled mb-0">
      {items.map((item) => (
        <li className={cols} key={item.name ?? item.title}>
          <div className="icon-tile">
            <Icon name={item.icon} />
            <h3>{item.name ?? item.title}</h3>
            {item.text && <p>{item.text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
