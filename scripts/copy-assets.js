import fs from "fs";
import path from "path";

const srcDir = "src";
const outDir = "dist";

function copyMdFiles(dir) {
  for (const file of fs.readdirSync(dir)) {
    const srcPath = path.join(dir, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyMdFiles(srcPath);
    } else if (file.endsWith(".md")) {
      const rel = path.relative(srcDir, srcPath);
      const destPath = path.join(outDir, rel);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyMdFiles(srcDir);
