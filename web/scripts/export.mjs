import { cp, rm, access } from "node:fs/promises";

// web/dist is canonical; the publisher also receives an identical repository-root export.
const source = new URL("../dist/", import.meta.url);
const destination = new URL("../../dist/", import.meta.url);
await access(new URL("index.html", source));
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log("Static export copied to ../dist (relative assets preserved).");
