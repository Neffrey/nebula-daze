import fs from "node:fs";

const workspacePath = "pnpm-workspace.yaml";
const lockfilePath = "pnpm-lock.yaml";

const patchPaths = readPatchPaths(fs.readFileSync(workspacePath, "utf8"));
if (patchPaths.size === 0) {
  console.log("No patchedDependencies in pnpm-workspace.yaml.");
  process.exit(0);
}

const lockfile = fs.readFileSync(lockfilePath, "utf8");
const section = lockfile.match(/^patchedDependencies:\r?\n([\s\S]*?)\r?\n(?=\S)/m);
if (section === null) {
  console.error("pnpm-lock.yaml has no patchedDependencies section.");
  process.exit(1);
}

const restored = restoreSection(section[1], patchPaths);
if (restored === section[1]) {
  console.log("Lockfile patch entries already include their paths.");
  process.exit(0);
}

fs.writeFileSync(lockfilePath, lockfile.replace(section[1], restored));
console.log("Restored patch paths in pnpm-lock.yaml.");

function readPatchPaths(source) {
  const paths = new Map();
  const section = source.match(/^patchedDependencies:\r?\n([\s\S]*?)(?:\r?\n(?=\S)|$)/m);
  if (section === null) {
    return paths;
  }
  for (const line of section[1].split(/\r?\n/)) {
    const match = line.match(/^\s+('[^']+'|"[^"]+"|[^:\s]+):\s+(\S+)\s*$/);
    if (match === null) {
      continue;
    }
    paths.set(unquote(match[1]), match[2]);
  }
  return paths;
}

function restoreSection(section, paths) {
  const lines = section.split(/\r?\n/);
  const newline = section.includes("\r\n") ? "\r\n" : "\n";
  const restored = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const bare = line.match(/^(\s*)('[^']+'|"[^"]+"|[^:\s]+):\s+([0-9a-f]{64})\s*$/);
    if (bare !== null) {
      const patchPath = paths.get(unquote(bare[2]));
      if (patchPath === undefined) {
        restored.push(line);
        continue;
      }
      restored.push(`${bare[1]}${bare[2]}:`, `${bare[1]}  hash: ${bare[3]}`, `${bare[1]}  path: ${patchPath}`);
      continue;
    }

    const opened = line.match(/^(\s*)('[^']+'|"[^"]+"|[^:\s]+):\s*$/);
    const hashLine = lines[index + 1];
    const pathLine = lines[index + 2];
    if (
      opened !== null &&
      hashLine !== undefined &&
      pathLine !== undefined &&
      /^\s+hash:\s+[0-9a-f]{64}\s*$/.test(hashLine) &&
      /^\s+path:\s+\S+\s*$/.test(pathLine)
    ) {
      const patchPath = paths.get(unquote(opened[2]));
      const pathIndent = pathLine.match(/^\s*/)[0];
      restored.push(line, hashLine, patchPath === undefined ? pathLine : `${pathIndent}path: ${patchPath}`);
      index += 2;
      continue;
    }

    restored.push(line);
  }

  return restored.join(newline);
}

function unquote(value) {
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}
