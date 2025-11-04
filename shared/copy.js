const fs = require("fs");
const path = require("path");

function showUsage() {
  console.log(
    "Copies shared code to a destination directory. Shared code has navigation directory, integrating with expo-router. To copy it, use 'expo-router' as the first argument. Otherwise, use 'bare'."
  );
  console.log(
    "Example: ./copy.js expo-router /src/shared [--exclude filename]"
  );
  console.log("");
  console.log(
    `Usage: ${path.basename(
      process.argv[1]
    )} {bare | expo-router} <destination> [--exclude filename]`
  );
  process.exit(1);
}

if (
  process.argv.length < 4 ||
  !["bare", "expo-router"].includes(process.argv[2])
) {
  showUsage();
}

const mode = process.argv[2];
const destination = process.argv[3];
const excludeIndex = process.argv.indexOf("--exclude");
const excludeFile =
  excludeIndex !== -1 && process.argv[excludeIndex + 1]
    ? process.argv[excludeIndex + 1]
    : null;

const scriptDir = path.dirname(__filename);
const sourceDir = path.join(scriptDir, "src");

if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination, { recursive: true });
}

function copyRecursive(src, dest) {
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (excludeFile && destPath.endsWith(excludeFile)) {
      console.log(`Skipping excluded file: ${excludeFile}`);
      continue;
    }

    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyRecursive(sourceDir, destination);

if (mode === "bare") {
  const navigationDir = path.join(destination, "navigation");
  if (fs.existsSync(navigationDir)) {
    fs.rmSync(navigationDir, { recursive: true, force: true });
    console.log("Removed navigation directory for bare mode");
  }
}
