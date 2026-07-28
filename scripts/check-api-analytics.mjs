import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "app", "api");

const EXEMPT = new Set([
  path.join("auth", "[...nextauth]", "route.ts"),
  path.join("health", "route.ts"),
]);

const routeFiles = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      routeFiles.push(full);
    }
  }
};

walk(root);

const violations = [];

for (const file of routeFiles) {
  const rel = path.relative(root, file);
  if (EXEMPT.has(rel)) {
    continue;
  }

  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("withApiAnalytics")) {
    violations.push(rel);
  }
}

if (violations.length) {
  console.error("API analytics wrapper missing in route files:");
  for (const violation of violations) {
    console.error(`- app/api/${violation}`);
  }
  process.exit(1);
}

console.log(`API analytics wrapper check passed (${routeFiles.length} routes scanned).`);
