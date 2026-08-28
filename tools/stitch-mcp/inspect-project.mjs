import { stitch } from "@google/stitch-sdk";

const targetTitle = process.argv.slice(2).join(" ").trim();
if (!targetTitle) {
  throw new Error("Pass the exact Stitch project title");
}

const projects = await stitch.projects();
const summaries = projects.map((project) => ({
  id: project.id,
  title: project.data?.title,
}));
const match = summaries.find((project) => project.title === targetTitle);

if (!match) {
  console.error(JSON.stringify({ targetTitle, availableProjects: summaries }, null, 2));
  process.exitCode = 2;
} else {
  const screens = await stitch.project(match.id).screens();
  console.log(
    JSON.stringify(
      {
        project: match,
        screens: screens.map((screen) => ({
          id: screen.id,
          title: screen.data?.title,
          width: screen.data?.width,
          height: screen.data?.height,
        })),
      },
      null,
      2,
    ),
  );
}
