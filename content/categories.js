// Product categories — copy taken verbatim from the client's
// "Website_Content_Insta_Mark.pdf" (Product Category Pages).
// Shape mirrors the `categories` table in prisma/schema.prisma so the seed
// script can insert it as-is.

export const categories = [
  {
    slug: "tailor-made-signage",
    name: "Tailor-made Signage",
    group: "architectural",
    icon: "vector-pen",
    shortDescription:
      "Bespoke signage that integrates with your architecture, brand identity and operations.",
    overview:
      "Every space has unique communication and branding needs. Insta Mark designs and manufactures tailor-made signage solutions that seamlessly integrate with your architecture, brand identity, and operational requirements. From premium corporate offices and hospitals to retail destinations, airports, and residential developments, our bespoke signage systems are engineered for aesthetics, durability, and functionality.",
    features: [
      "Custom Design",
      "Architectural Integration",
      "Premium Materials",
      "Complete Design-to-Installation",
      "Indoor & Outdoor Applications",
    ],
    applications:
      "Corporate offices, luxury hotels, premium residential projects, hospitals, airports, shopping malls, educational campuses, government buildings, industrial facilities, and branded retail environments where customized signage is required.",
  },
  {
    slug: "modular-signs",
    name: "Modular Signs",
    group: "architectural",
    icon: "grid-1x2",
    shortDescription:
      "Flexible sign systems with replaceable panels for quick, consistent content updates.",
    overview:
      "Our modular signage systems offer flexibility, consistency, and ease of maintenance. Designed for dynamic environments, these signs allow quick content updates while maintaining a professional appearance. Ideal for hospitals, commercial buildings, educational institutions, airports, and corporate offices.",
    features: [
      "Easy Panel Replacement",
      "Future-Ready Design",
      "Uniform Branding",
      "Low Maintenance",
      "Long Service Life",
    ],
    applications:
      "Hospitals, corporate offices, universities, business parks, IT campuses, airports, commercial buildings, government institutions, and locations where sign content needs regular updating.",
  },
  {
    slug: "general-signs",
    name: "General Signs",
    group: "architectural",
    icon: "signpost-split",
    shortDescription:
      "Clear directional, informational and identification signs for everyday navigation.",
    overview:
      "General signs provide clear communication for everyday navigation, identification, and information. Manufactured using premium materials and precision fabrication, they are suitable for offices, malls, hotels, industries, residential complexes, and public infrastructure.",
    features: [
      "Directional Signs",
      "Informational Signs",
      "Identification Signs",
      "Reception Signs",
      "Department Signage",
    ],
    applications:
      "Offices, factories, warehouses, schools, hospitals, residential societies, commercial complexes, shopping malls, parking areas, and public buildings for identification and information.",
  },
  {
    slug: "braille-signs",
    name: "Braille Signs",
    group: "architectural",
    icon: "universal-access",
    shortDescription:
      "Accessible Braille and raised-text signage that helps visually impaired users navigate independently.",
    overview:
      "Designed for accessibility and compliance, our Braille signage enables visually impaired users to navigate buildings independently. Manufactured according to accessibility standards, these signs are ideal for hospitals, educational institutions, public buildings, hotels, airports, and commercial facilities.",
    features: [
      "Braille & Raised Text",
      "ADA-inspired Accessibility",
      "Durable Materials",
      "Indoor & Public Spaces",
    ],
    applications:
      "Hospitals, educational institutions, hotels, airports, railway stations, government offices, public infrastructure, commercial buildings, and accessible facilities complying with universal accessibility standards.",
  },
  {
    slug: "fire-safety-signs",
    name: "Fire & Safety Signs",
    group: "architectural",
    icon: "fire",
    shortDescription:
      "Fire exit, hazard and assembly point signs for emergency preparedness and compliance.",
    // TODO(client): the PDF's "Overview" for this category repeats the
    // applications list. This sentence is built from that text — please confirm.
    overview:
      "Fire & safety signage for emergency preparedness across industrial plants, factories, warehouses, hospitals, hotels, shopping malls, commercial buildings, educational institutions, residential complexes, and public infrastructure.",
    features: [
      "Fire Exit Signs",
      "Hazard Signs",
      "Assembly Point Signs",
      "Emergency Information",
      "Safety Compliance",
    ],
    applications:
      "Suitable for commercial buildings, hospitals, airports, hospitality, educational institutions, industrial facilities, residential townships, infrastructure projects, and government developments, depending on project requirements.",
  },
  {
    slug: "emergency-lights",
    name: "Emergency Lights",
    group: "architectural",
    icon: "lightbulb",
    shortDescription: "LED emergency lighting that keeps exits visible during power failures.",
    overview:
      "Reliable emergency lighting systems ensure visibility during power failures and emergency situations. Our emergency lights support safe evacuation in commercial buildings, hospitals, hotels, educational institutions, industrial facilities, and public infrastructure.",
    features: [
      "LED Technology",
      "Energy Efficient",
      "Long Backup",
      "Easy Installation",
      "Safety Compliance",
    ],
    applications:
      "Staircases, emergency exits, hospitals, hotels, shopping malls, schools, office buildings, manufacturing facilities, parking structures, airports, and public buildings to support safe evacuation during power failures.",
  },
  {
    slug: "road-signs",
    name: "Road Signs",
    group: "road-safety",
    icon: "sign-turn-right",
    shortDescription:
      "High-visibility regulatory, warning and directional road signs built to traffic standards.",
    overview:
      "Insta Mark manufactures high-quality road signs engineered for maximum visibility, durability, and compliance with traffic safety standards. Designed for highways, expressways, industrial parks, smart cities, airports, residential developments, and municipal infrastructure.",
    features: [
      "Regulatory Signs",
      "Warning Signs",
      "Directional Signs",
      "Informational Signs",
      "Reflective Sign Boards",
    ],
    applications:
      "National highways, expressways, municipal roads, smart cities, industrial parks, airports, logistics parks, residential townships, construction zones, and infrastructure projects.",
  },
  {
    slug: "road-safety-products",
    name: "Road Safety Products",
    group: "road-safety",
    icon: "cone-striped",
    shortDescription:
      "Speed breakers, bollards, convex mirrors, wheel stoppers and parking safety products.",
    overview:
      "Our road safety products improve traffic management and create safer environments for motorists and pedestrians. Built using durable materials, they withstand harsh weather and heavy usage across highways, industrial facilities, parking areas, and commercial developments.",
    features: [
      "Speed Breakers",
      "Bollards",
      "Delineators",
      "Convex Mirrors",
      "Wheel Stoppers",
      "Parking Safety",
      "Traffic Accessories",
    ],
    applications:
      "Highways, toll plazas, industrial premises, warehouses, logistics parks, parking facilities, fuel stations, ports, airports, residential societies, commercial complexes, and traffic management projects.",
  },
];

export const categoryGroups = {
  architectural: "Architectural Signage",
  "road-safety": "Road Safety Solutions",
};

/** content group key ↔ database enum `CategoryGroup`. */
export const groupToEnum = { architectural: "ARCHITECTURAL", "road-safety": "ROAD_SAFETY" };
export const enumToGroup = Object.fromEntries(Object.entries(groupToEnum).map(([k, v]) => [v, k]));
