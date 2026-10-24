// Company-level copy, verbatim from "Website_Content_Insta_Mark.pdf"
// (Homepage, About Us, Projects and Contact sections).

export const home = {
  hero: {
    // Client feedback (21 Oct 2026): the big H1 names the business; the tagline is a
    // smaller line directly under it (no small label above the headline).
    title: "Architectural Signage & Road Safety",
    tagline: "Signage That Guides. Safety That Lasts.",
    text: "From intelligent wayfinding and architectural signage to road safety solutions, Insta Mark delivers end-to-end design, manufacturing, and installation for spaces that are smarter, safer, and built to perform.",
    // No buttons in the banner (client, 23 Oct 2026).
  },
  about: {
    title: "Creating Signage That Makes Every Space Smarter",
    // The two paragraphs of the client's content document, word for word.
    paragraphs: [
      "Insta Mark is one of India’s leading providers of architectural signage, wayfinding systems, and road safety solutions. We serve diverse sectors with solutions that combine functionality, aesthetics, durability, and compliance.",
      "From design and manufacturing to installation, we deliver precision-engineered signage that enhances navigation, strengthens branding, and improves safety across commercial, residential, healthcare, and infrastructure projects.",
    ],
    text: "Insta Mark is one of India’s leading providers of architectural signage, wayfinding systems, and road safety solutions. We serve diverse sectors with solutions that combine functionality, aesthetics, durability, and compliance. From design and manufacturing to installation, we deliver precision-engineered signage that enhances navigation, strengthens branding, and improves safety across commercial, residential, healthcare, and infrastructure projects.",
  },
  expertise: {
    architectural: [
      "Architectural Signage",
      "Wayfinding Signage",
      "Directional Signage",
      "Branding Signage",
      "Internal Signage",
      "External Signage",
      "Modular Signage",
      "Braille Signage",
      "General Signage",
      "Parking Signage",
      "Fire & Safety Signage",
      "Emergency Exit Signage",
    ],
    roadSafety: [
      "Traffic Sign Boards",
      "Reflective Road Signs",
      "Speed Breakers",
      "Bollards",
      "Delineators",
      "Wheel Stoppers",
      "Convex Mirrors",
      "Parking Safety Products",
      "Road Safety Accessories",
    ],
  },
  quote: "We craft ideas into impactful signage experiences.",
  // Big line that scrolls across the page under the About block (theme "marquee" text).
  marquee: "Signage and Road Safety Solutions",
  // Logos of projects we have worked on, from the company profile PDF (client feedback,
  // 21 Oct 2026). The first five also sit under the banner; all of them are in "Trusted by
  // Leading Brands". Swap in clean files from the client when they arrive.
  projectLogos: [
    {
      name: "Reliance Industries Limited",
      src: "/images/clients/reliance.png",
      width: 158,
      height: 109,
    },
    { name: "Nykaa", src: "/images/clients/nykaa.png", width: 144, height: 42 },
    { name: "Rustomjee", src: "/images/clients/rustomjee.png", width: 176, height: 32 },
    { name: "Nirlon", src: "/images/clients/nirlon.png", width: 164, height: 36 },
    {
      name: "Brookfield Properties",
      src: "/images/clients/brookfield-properties.png",
      width: 158,
      height: 70,
    },
    { name: "Godrej", src: "/images/clients/godrej.png", width: 157, height: 58 },
    { name: "Jusco", src: "/images/clients/jusco.png", width: 97, height: 132 },
    {
      name: "Shapoorji Pallonji",
      src: "/images/clients/shapoorji-pallonji.png",
      width: 171,
      height: 97,
    },
    { name: "Jaslok Hospital", src: "/images/clients/jaslok-hospital.png", width: 160, height: 76 },
    { name: "Adani Realty", src: "/images/clients/adani-realty.png", width: 166, height: 84 },
    { name: "MMRDA", src: "/images/clients/mmrda.png", width: 167, height: 124 },
    { name: "Tata Projects", src: "/images/clients/tata-projects.png", width: 171, height: 95 },
    { name: "Client logo", src: "/images/clients/client-13.png", width: 180, height: 67 },
  ],
  trustedBy: {
    title: "Trusted by Leading Brands",
    text: "Our commitment to quality, innovation, and timely execution has earned the trust of leading developers, architects, contractors, and organizations across India.",
  },
  cta: {
    title: "Let's Build Smarter Spaces Together.",
    text: "Whether you're developing a commercial complex, healthcare facility, residential township, airport, retail destination, or infrastructure project, Insta Mark is your trusted partner for complete signage and road safety solutions.",
    primaryCta: { label: "Get a Free Consultation", href: "/contact#contact-form" },
    secondaryCta: { label: "Contact Our Team", href: "/contact" },
  },
};

export const whyChooseUs = [
  {
    title: "End-to-End Expertise",
    text: "Complete support from survey to installation.",
    icon: "arrow-repeat",
  },
  {
    title: "Design-Driven Approach",
    text: "Functional and aesthetically aligned signage systems.",
    icon: "vector-pen",
  },
  {
    title: "Premium Manufacturing",
    text: "Advanced production and quality materials.",
    icon: "gear-wide-connected",
  },
  { title: "Custom Solutions", text: "Tailored to architecture and branding.", icon: "rulers" },
  {
    title: "Timely Project Execution",
    text: "Reliable delivery schedules.",
    icon: "clock-history",
  },
  { title: "Nationwide Service", text: "Project execution across India.", icon: "geo-alt" },
];

// Home page "The Working Process" (4 steps).
export const workingProcess = {
  title: "The Working Process",
  text: "From concept to completion, we deliver signage solutions with precision, quality, and seamless execution.",
  steps: [
    {
      title: "Site Survey",
      text: "Our experts assess the site, understand project requirements, and recommend suitable signage solutions based on space, functionality, and budget.",
    },
    {
      title: "Design Concept",
      text: "Our in-house design team develops customised signage concepts, aligning visuals, functionality, and brand identity with project requirements.",
    },
    {
      title: "Manufacturing",
      text: "We manufacture signage using quality materials, advanced production capabilities, and strict quality control to ensure durability and precision.",
    },
    {
      title: "Installation",
      text: "Our trained installation teams ensure accurate fitting, safety compliance, and seamless execution across diverse project environments.",
    },
  ],
};

// TODO(client): the About page lists "Industrial Facilities" where the home
// page says "Manufacturing Facilities" — using the home page list until confirmed.
export const industries = [
  { name: "Commercial Buildings", icon: "buildings" },
  { name: "Residential Townships", icon: "house-door" },
  { name: "Healthcare", icon: "hospital" },
  { name: "Airports", icon: "airplane" },
  { name: "Railways", icon: "train-front" },
  { name: "Shopping Malls", icon: "shop" },
  { name: "Hospitality", icon: "cup-hot" },
  { name: "Educational Institutions", icon: "mortarboard" },
  { name: "Financial Institutions", icon: "bank" },
  { name: "Warehousing", icon: "box-seam" },
  { name: "Manufacturing Facilities", icon: "gear-wide-connected" },
  { name: "Government & Infrastructure", icon: "bank2" },
];

export const faqs = [
  {
    question: "What types of signage does Insta Mark manufacture?",
    answer:
      "Architectural signage, wayfinding systems, branding signage, modular signs, braille signs, parking signage, fire and safety signs, emergency exit signage, and road safety products.",
  },
  {
    question: "Does Insta Mark provide custom signage solutions?",
    answer: "Yes. Every solution is tailored to project requirements and branding.",
  },
  {
    question: "Which industries does Insta Mark serve?",
    answer:
      "Commercial, residential, healthcare, airports, railways, retail, hospitality, education, industrial, and infrastructure.",
  },
  {
    question: "Does Insta Mark handle installation?",
    answer: "Yes. We provide end-to-end services including installation.",
  },
  {
    question: "Why choose Insta Mark?",
    answer:
      "Design, engineering, manufacturing, installation, and dependable project execution under one roof.",
  },
];

export const about = {
  whoWeAre:
    "Insta Mark is a leading architectural signage and road safety solutions company delivering end-to-end services from design and engineering to manufacturing and installation. Our solutions enhance navigation, strengthen brand identity, and improve safety across commercial, healthcare, hospitality, infrastructure, retail, residential, and public spaces.",
  vision:
    "To redefine environments through intelligent signage systems that combine innovation, aesthetics, and functionality.",
  mission:
    "To deliver durable, compliant, and customized signage solutions while maintaining the highest standards of quality, service, and execution.",
  whyChooseUs: [
    "End-to-end project execution",
    "In-house design and manufacturing",
    "Premium materials",
    "Nationwide installation",
    "Tailor-made solutions",
    "Strict quality control",
  ],
  solutions: [
    {
      title: "Architectural Signage",
      text: "Wayfinding, branding, directional, modular, braille, fire & safety, emergency exit, lobby directories, reception, parking, and custom signage.",
    },
    {
      title: "Road Safety Solutions",
      text: "Traffic signs, reflective signs, bollards, delineators, convex mirrors, wheel stoppers, speed breakers, parking safety products, and accessories.",
    },
    {
      title: "Custom Signage",
      text: "Every project is designed according to architecture, branding, compliance, and user experience.",
    },
  ],
  industriesApproach:
    "Every industry has unique navigation and compliance requirements. Our team develops customized signage systems that improve movement, communication, and safety.",
  manufacturing: {
    title: "Advanced Manufacturing",
    text: "Our facility combines advanced machinery with skilled craftsmanship to produce premium signage solutions.",
    capabilities: [
      "Laser Cutting",
      "CNC Routing",
      "UV Printing",
      "Digital Printing",
      "Powder Coating",
      "Fabrication",
      "Acrylic Processing",
      "Stainless Steel Fabrication",
      "Aluminium Fabrication",
      "Lamination",
      "Reflective Graphics",
      "Precision Finishing",
    ],
    quality:
      "Every product undergoes rigorous quality inspection before dispatch and installation.",
  },
  process: [
    { title: "Discovery", text: "Understanding project requirements and site survey." },
    { title: "Design", text: "Concept development and technical planning." },
    { title: "Manufacturing", text: "Precision production using premium materials." },
    { title: "Installation", text: "Professional on-site installation." },
    { title: "Support", text: "Inspection and post-installation assistance." },
  ],
};

export const contactPage = {
  title: "Get in Touch",
  text: "Looking for architectural signage or road safety solutions? Our team is ready to help from consultation to installation.",
};
