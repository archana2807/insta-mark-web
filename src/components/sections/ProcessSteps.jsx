import Reveal from "@/components/ui/Reveal";
import { pad2 } from "@/lib/format";

/** Theme counters row: title, text, rule, big number. */
export default function ProcessSteps({ steps }) {
  const cols = steps.length >= 5 ? "col-sm-6 col-lg" : "col-sm-6 col-lg-3";
  return (
    <Reveal as="ol" stagger={200} className="row g-4 g-lg-5 list-unstyled mb-0">
      {steps.map((step, i) => (
        <li className={cols} key={step.title}>
          <div className="process-step d-flex flex-column">
            <h3>{step.title}</h3>
            <p className="flex-grow-1">{step.text}</p>
            <div className="process-step__number" aria-hidden="true">
              {pad2(i + 1)}
            </div>
          </div>
        </li>
      ))}
    </Reveal>
  );
}
