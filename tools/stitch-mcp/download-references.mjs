import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { stitch } from "@google/stitch-sdk";

const projectId = "1683649861335380565";
const outputDir = new URL("../../.stitch/reference/", import.meta.url);
const screens = [
  ["home-desktop", "b59de880e88a4c18af413b6b8bc38be8", 2560],
  ["home-mobile", "7d25d4dc5da44f89957fa9d2685052e2", 1560],
  ["solutions-desktop", "c2f8144dc80d4f35b468b0a8a1c10e3c", 2560],
  ["solutions-mobile", "547a604fa7984b60a214b4c9b3b3e472", 780],
  ["gallery-desktop", "ef8c2985ae9148e19781e8949dca5dd2", 2560],
  ["gallery-mobile", "e96ec9f7345645d986e8281a283f489f", 780],
  ["company-desktop", "4263b016c79f432f95f16ef3bbbae015", 2560],
  ["company-mobile", "5ac50e062e2e4c3f9625b41926496a6d", 780],
  ["contact-desktop", "39f8bf756e1f46279c77bdbad0e86e77", 2560],
  ["contact-mobile", "a289c4c1a875401086fa227047905868", 780],
];

await mkdir(outputDir, { recursive: true });
const project = stitch.project(projectId);

for (const [slug, screenId, width] of screens) {
  const screen = await project.getScreen(screenId);
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();
  if (!htmlUrl || !imageUrl) {
    throw new Error(`Stitch screen ${screenId} did not return both assets`);
  }

  const [htmlResponse, imageResponse] = await Promise.all([
    fetch(htmlUrl),
    fetch(`${imageUrl}=w${width}`),
  ]);
  if (!htmlResponse.ok || !imageResponse.ok) {
    throw new Error(
      `Download failed for ${slug}: HTML ${htmlResponse.status}, image ${imageResponse.status}`,
    );
  }

  const html = await htmlResponse.text();
  const image = Buffer.from(await imageResponse.arrayBuffer());
  await Promise.all([
    writeFile(join(outputDir.pathname, `${slug}.html`), html, "utf8"),
    writeFile(join(outputDir.pathname, `${slug}.png`), image),
  ]);
  console.log(`${slug}: html=${Buffer.byteLength(html)} image=${image.length}`);
}
