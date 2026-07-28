import { MongoClient } from "mongodb";

const COLLECTIONS = {
  projects: "projects",
  notes: "notes",
  experiences: "experiences",
  studies: "studies",
  resume: "resume",
};

const now = new Date();

const projects = [
  {
    seedKey: "dev-project-ai-concierge",
    devSeed: true,
    slug: "dev-portfolio-ai-concierge",
    title: "Portfolio AI Concierge",
    subtitle: "A conversational guide through my work",
    description:
      "A context-aware assistant that helps visitors discover projects, skills, and experience through a natural conversation.",
    content: `## The idea

Most portfolios make visitors hunt for information. This experiment turns the portfolio into a conversation: ask about a technology, a role, or a project and get a focused answer with useful links.

## What makes it interesting

- Retrieval is grounded in curated portfolio content.
- Streaming responses keep the interaction feeling immediate.
- Analytics capture useful product signals without storing sensitive raw data.
- Clear fallbacks keep the rest of the site fully usable when the AI service is offline.

## Outcome

The result is a friendlier way to explore the site while keeping every important piece of information available through regular pages.`,
    date: "2026-06-15T00:00:00.000Z",
    startDate: "2026-02-01T00:00:00.000Z",
    endDate: "2026-06-15T00:00:00.000Z",
    technologies: ["Next.js", "TypeScript", "MongoDB", "LangChain"],
    categories: ["AI", "Web", "Product"],
    status: "completed",
    isFeatured: true,
    links: {
      repo: "https://github.com/mathis-lambert/personal_website",
    },
    media: {
      thumbnailUrl: "/images/projects/personal-website/thumb.png",
      imageUrl: "/images/projects/personal-website/hero_section.png",
      gallery: [
        "/images/projects/personal-website/hero_section.png",
        "/images/projects/personal-website/architecture.png",
      ],
    },
    metrics: { stars: 24, users: 320 },
    role: "Full-stack AI engineer",
    teamSize: 1,
    highlights: [
      "Streaming chat experience",
      "Grounded portfolio retrieval",
      "Privacy-minded observability",
    ],
    color: "#ff7a59",
  },
  {
    seedKey: "dev-project-llm-workbench",
    devSeed: true,
    slug: "dev-local-llm-workbench",
    title: "Local LLM Workbench",
    subtitle: "Fast experiments, reproducible infrastructure",
    description:
      "A developer workspace for evaluating, serving, and observing open-weight language models on local GPU infrastructure.",
    content: `## Why I built it

Comparing models becomes slow when every experiment needs a different setup. The workbench provides one repeatable path from model selection to a measured API.

## Inside the workbench

- Declarative model and runtime configuration
- GPU-aware containers and health checks
- Repeatable evaluation scenarios
- Latency, throughput, and memory dashboards

The project is deliberately small enough to understand in one sitting and practical enough to use for real experiments.`,
    date: "2026-07-01T00:00:00.000Z",
    startDate: "2026-05-01T00:00:00.000Z",
    technologies: ["Python", "vLLM", "CUDA", "Docker"],
    categories: ["AI", "Infrastructure", "Developer tools"],
    status: "in-progress",
    isFeatured: true,
    media: {
      thumbnailUrl: "/images/projects/personal-website/architecture.png",
      imageUrl: "/images/projects/personal-website/architecture.png",
    },
    metrics: { stars: 17, downloads: 86 },
    role: "AI infrastructure engineer",
    teamSize: 2,
    highlights: [
      "One-command model serving",
      "Comparable evaluation runs",
      "Operational GPU metrics",
    ],
    color: "#14b8a6",
  },
  {
    seedKey: "dev-project-control-room",
    devSeed: true,
    slug: "dev-observability-control-room",
    title: "Observability Control Room",
    subtitle: "Signals that lead to product decisions",
    description:
      "A compact operational dashboard that connects API health, user journeys, and AI conversation quality.",
    content: `## From logs to decisions

The control room is designed around questions rather than raw telemetry: What is failing? Where are visitors getting value? Which AI conversations need attention?

It combines request metrics, UI events, and redacted conversation traces into a focused workflow for investigating problems without building a heavyweight analytics platform.`,
    date: "2026-03-20T00:00:00.000Z",
    startDate: "2025-12-01T00:00:00.000Z",
    endDate: "2026-03-20T00:00:00.000Z",
    technologies: ["React", "Recharts", "MongoDB", "Docker"],
    categories: ["Data", "Observability", "Web"],
    status: "completed",
    isFeatured: false,
    media: {
      thumbnailUrl: "/images/projects/personal-website/hero_section.png",
      imageUrl: "/images/projects/personal-website/hero_section.png",
    },
    metrics: { users: 140 },
    role: "Product engineer",
    teamSize: 1,
    highlights: [
      "End-to-end request tracing",
      "Redacted conversation review",
      "Responsive operational dashboards",
    ],
    color: "#6366f1",
  },
];

const notes = [
  {
    seedKey: "dev-note-reliable-ai-product",
    devSeed: true,
    slug: "dev-from-prototype-to-reliable-ai-product",
    title: "From Prototype to Reliable AI Product",
    excerpt:
      "The practical engineering decisions that turn an impressive AI demo into a product people can trust.",
    content: `## A prototype proves possibility

The first version of an AI feature should answer one question: can this create value? Production asks a much wider set of questions about latency, cost, safety, observability, and graceful failure.

## Design the fallback first

A reliable AI experience never treats the model as the entire product. Give users a useful path when retrieval is empty, a provider is slow, or the answer is uncertain.

## Measure the whole journey

Model metrics matter, but product signals matter too. Track whether people find the next useful page, complete a task, or need to reformulate their question. That is where engineering and product design meet.`,
    author: "Mathis Lambert",
    date: "2026-06-28T00:00:00.000Z",
    readTimeMin: 6,
    tags: ["AI engineering", "Reliability", "Product"],
    categories: ["Engineering"],
    isFeatured: true,
    media: {
      thumbnailUrl: "/images/notes/agentic-ai-rag/thumb.png",
      imageUrl: "/images/notes/agentic-ai-rag/hero.png",
    },
    metrics: { views: 842, likes: 56, shares: 12 },
  },
  {
    seedKey: "dev-note-serving-llms",
    devSeed: true,
    slug: "dev-serving-llms-on-gpus",
    title: "What I Learned Serving LLMs on GPUs",
    excerpt:
      "A field guide to memory budgets, batching, latency, and the operational details that benchmarks leave out.",
    content: `## Memory is the first constraint

Model weights are only part of the GPU budget. Context length, KV cache, concurrency, and runtime overhead decide whether a configuration is actually stable.

## Optimize for the workload

The fastest setup for one long request is rarely the best setup for many short conversations. Start with representative traffic, then tune batching and concurrency around the user experience you want.

## Boring operations win

Health checks, bounded queues, clear timeouts, and useful metrics usually create more real-world value than another round of micro-optimizations.`,
    author: "Mathis Lambert",
    date: "2026-05-09T00:00:00.000Z",
    readTimeMin: 8,
    tags: ["LLM", "GPU", "Infrastructure"],
    categories: ["AI", "Infrastructure"],
    isFeatured: false,
    media: {
      thumbnailUrl: "/images/projects/personal-website/architecture.png",
      imageUrl: "/images/projects/personal-website/architecture.png",
    },
    metrics: { views: 614, likes: 39, shares: 9 },
  },
  {
    seedKey: "dev-note-explorable-portfolio",
    devSeed: true,
    slug: "dev-designing-an-explorable-portfolio",
    title: "Designing a Portfolio People Want to Explore",
    excerpt:
      "How hierarchy, motion, personality, and performance can make a technical portfolio feel genuinely inviting.",
    content: `## Start with the visitor

A portfolio is not an archive. A recruiter, an engineer, and a potential collaborator arrive with different questions, so the interface should offer multiple clear paths without becoming noisy.

## Motion needs a job

Good motion explains hierarchy, confirms interaction, or adds a small moment of delight. It should remain subtle, respect reduced-motion preferences, and never delay access to content.

## Personality comes from decisions

Type, color, spacing, and writing create a stronger identity than decorative effects alone. Consistency makes the playful moments feel intentional.`,
    author: "Mathis Lambert",
    date: "2026-04-12T00:00:00.000Z",
    readTimeMin: 5,
    tags: ["Design", "Frontend", "Accessibility"],
    categories: ["Web"],
    isFeatured: true,
    media: {
      thumbnailUrl: "/images/projects/personal-website/thumb.png",
      imageUrl: "/images/projects/personal-website/hero_section.png",
    },
    metrics: { views: 458, likes: 31, shares: 7 },
  },
];

const experiences = [
  {
    seedKey: "dev-experience-ai-engineer",
    devSeed: true,
    order: 0,
    title: "AI Engineer Apprentice",
    company: "Free Pro",
    date: "2025 – Present",
    description:
      "Building dependable AI services, evaluation workflows, and GPU-backed infrastructure for production use cases.",
  },
  {
    seedKey: "dev-experience-data-engineer",
    devSeed: true,
    order: 1,
    title: "Data & Software Engineer",
    company: "Applied AI team",
    date: "2024 – 2025",
    description:
      "Shipped data pipelines and internal tools that made experimentation faster and operational results easier to understand.",
  },
  {
    seedKey: "dev-experience-product-builder",
    devSeed: true,
    order: 2,
    title: "Independent Product Builder",
    company: "Personal projects",
    date: "2022 – Present",
    description:
      "Designing and shipping focused web products at the intersection of software engineering, AI, and playful interaction.",
  },
];

const studies = [
  {
    seedKey: "dev-study-engineering",
    devSeed: true,
    order: 0,
    title: "Computer Science & AI Engineering",
    company: "CPE Lyon",
    date: "2023 – 2026",
    description:
      "Engineering curriculum focused on software systems, data, machine learning, cloud infrastructure, and product delivery.",
  },
  {
    seedKey: "dev-study-applied-ml",
    devSeed: true,
    order: 1,
    title: "Applied Machine Learning Program",
    company: "International exchange",
    date: "2025",
    description:
      "Hands-on study of modern ML systems, experimentation methods, and cross-cultural engineering collaboration.",
  },
];

const resume = {
  seedKey: "dev-resume",
  devSeed: true,
  name: "Mathis Lambert",
  contact: {
    email: "mathis.lambert27@gmail.com",
    phone: "+33 6 00 00 00 00",
    linkedin: "linkedin.com/in/mathis-lambert",
    github: "github.com/mathis-lambert",
    website: "mathislambert.fr",
  },
  personal_statement:
    "AI and software engineer who enjoys turning ambitious prototypes into dependable, approachable products. I work across model integration, backend systems, infrastructure, and thoughtful web experiences.",
  experiences: [
    {
      role: "AI Engineer Apprentice",
      company: "Free Pro",
      period: "2025 – Present",
      location: "Lyon, France",
      current: true,
      highlight: true,
      description: [
        "Build and operate AI services for production use cases.",
        "Create evaluation workflows and observability for model-backed features.",
        "Improve GPU serving reliability, latency, and developer experience.",
      ],
    },
    {
      role: "Data & Software Engineer",
      company: "Applied AI team",
      period: "2024 – 2025",
      location: "France",
      description: [
        "Delivered maintainable data pipelines and internal web tools.",
        "Translated exploratory work into repeatable engineering workflows.",
      ],
    },
  ],
  education: [
    {
      institution: "CPE Lyon",
      degree: "Engineering degree in Computer Science & AI",
      location: "Lyon, France",
      description: "Software engineering, data systems, machine learning, and cloud infrastructure.",
      period: "2023 – 2026",
    },
  ],
  certifications: [
    {
      provider: "NVIDIA",
      title: "Fundamentals of Deep Learning",
      issued_date: "2025",
      status: "issued",
      description: "Practical deep-learning workflows and GPU acceleration.",
    },
    {
      provider: "Linux Foundation",
      title: "Cloud Native Fundamentals",
      issued_date: null,
      status: "in progress",
    },
  ],
  technical_skills: {
    languages: ["French (native)", "English (professional)"],
    programming: ["Python", "TypeScript", "Go", "SQL"],
    ai_ml: ["PyTorch", "LangChain", "RAG", "LLM evaluation", "vLLM"],
    systems_and_infra: ["Docker", "Linux", "Kubernetes", "CI/CD", "MongoDB"],
    web: ["Next.js", "React", "Node.js", "Tailwind CSS"],
  },
  skills: [
    "Product-minded engineering",
    "System design",
    "Technical communication",
    "Rapid prototyping",
  ],
  passions: ["Building useful things", "Running", "Photography", "Travel"],
  translations: {
    fr: {
      personal_statement:
        "Ingénieur IA et logiciel, j’aime transformer des prototypes ambitieux en produits fiables et agréables à utiliser. Je travaille de l’intégration de modèles jusqu’aux systèmes backend, à l’infrastructure et aux interfaces web.",
      experiences: [
        {
          role: "Ingénieur IA en alternance",
          company: "Free Pro",
          period: "2025 – Aujourd’hui",
          location: "Lyon, France",
          current: true,
          highlight: true,
          description: [
            "Développement et exploitation de services IA pour des cas d’usage en production.",
            "Création de workflows d’évaluation et d’observabilité.",
            "Amélioration de la fiabilité et des performances du serving GPU.",
          ],
        },
        {
          role: "Ingénieur data & logiciel",
          company: "Équipe IA appliquée",
          period: "2024 – 2025",
          location: "France",
          description: [
            "Livraison de pipelines data maintenables et d’outils web internes.",
            "Transformation des expérimentations en workflows reproductibles.",
          ],
        },
      ],
      education: [
        {
          institution: "CPE Lyon",
          degree: "Diplôme d’ingénieur en Informatique & IA",
          location: "Lyon, France",
          description: "Génie logiciel, systèmes de données, machine learning et cloud.",
          period: "2023 – 2026",
        },
      ],
      skills: [
        "Ingénierie orientée produit",
        "Conception de systèmes",
        "Communication technique",
        "Prototypage rapide",
      ],
      passions: ["Créer des produits utiles", "Course", "Photographie", "Voyage"],
    },
  },
};

const assertLocalDatabase = (uri) => {
  let hostname;
  try {
    hostname = new URL(uri).hostname;
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "mongo"]);
  if (!localHosts.has(hostname) && process.env.ALLOW_REMOTE_DEV_SEED !== "true") {
    throw new Error(
      `Refusing to seed non-local MongoDB host "${hostname}". Set ALLOW_REMOTE_DEV_SEED=true only if this is intentional.`,
    );
  }
};

const upsertSeedEntries = async (collection, entries) => {
  const operations = entries.map((entry) => ({
    updateOne: {
      filter: { seedKey: entry.seedKey },
      update: {
        $set: { ...entry, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));

  await collection.bulkWrite(operations);
};

const cleanSeedData = async (db) => {
  const results = await Promise.all(
    Object.values(COLLECTIONS).map(async (name) => {
      const result = await db.collection(name).deleteMany({ devSeed: true });
      return [name, result.deletedCount];
    }),
  );

  console.log("Removed development seed data:");
  for (const [name, count] of results) {
    console.log(`  ${name}: ${count}`);
  }
};

const seedDatabase = async (db) => {
  await Promise.all([
    upsertSeedEntries(db.collection(COLLECTIONS.projects), projects),
    upsertSeedEntries(db.collection(COLLECTIONS.notes), notes),
    upsertSeedEntries(db.collection(COLLECTIONS.experiences), experiences),
    upsertSeedEntries(db.collection(COLLECTIONS.studies), studies),
  ]);

  const resumeCollection = db.collection(COLLECTIONS.resume);
  const seededResume = await resumeCollection.findOne({ seedKey: resume.seedKey });
  const existingResume = await resumeCollection.findOne({});

  if (seededResume || !existingResume) {
    await resumeCollection.updateOne(
      { seedKey: resume.seedKey },
      {
        $set: { ...resume, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  } else {
    console.log("Existing resume detected; leaving it unchanged.");
  }

  const counts = await Promise.all(
    Object.values(COLLECTIONS).map(async (name) => [
      name,
      await db.collection(name).countDocuments({ devSeed: true }),
    ]),
  );

  console.log("Development content is ready:");
  for (const [name, count] of counts) {
    console.log(`  ${name}: ${count}`);
  }
};

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE;

if (!uri || !dbName) {
  throw new Error("MONGODB_URI and MONGODB_DB must be set before seeding.");
}

assertLocalDatabase(uri);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });

try {
  await client.connect();
  const db = client.db(dbName);
  if (process.argv.includes("--clean")) {
    await cleanSeedData(db);
  } else {
    await seedDatabase(db);
  }
} finally {
  await client.close();
}
