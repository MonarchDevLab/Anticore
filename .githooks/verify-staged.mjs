#!/usr/bin/env node
/**
 * ANTICORE — SIFIR SIZINTI VE DEPO GÜVENLİK MUHAFIZI (Zero Leakage Pre-Commit)
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const SENSITIVE_PATTERNS = [
  { name: "OpenAI API Key", regex: /\bsk-[a-zA-Z0-9_-]{32,}\b/ },
  { name: "Anthropic API Key", regex: /\bsk-ant-api[0-9]{2}-[a-zA-Z0-9_-]{32,}\b/ },
  { name: "GitHub Access Token", regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/ },
  { name: "Private Key Header", regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE|PGP) KEY-----/ },
  { name: "Hardcoded Windows User Profile", regex: /C:\\Users\\[a-zA-Z0-9_.-]+(?!\\[a-zA-Z0-9_.-]*example)/i },
  { name: "Hardcoded macOS User Profile", regex: /\/Users\/[a-zA-Z0-9_.-]+\/(?!example)/i }
];

const DISALLOWED_BINARY_EXTENSIONS = new Set([
  ".exe", ".msi", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".pdb", ".sys", ".dll"
]);

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "target",
  "gen"
]);

function getStagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" });
    return out.split("\n").map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function checkStructuralViolations(stagedFiles, rootDir) {
  const violations = [];
  for (const relFile of stagedFiles) {
    const norm = relFile.replace(/\\/g, "/");
    const ext = extname(norm).toLowerCase();
    const fullPath = join(rootDir, relFile);

    if (norm.startsWith("dist/") || norm.includes("/dist/")) {
      violations.push({
        file: relFile,
        pattern: "Derleme Çıktısı (Build Output) Engeli",
        detail: "dist/ klasöründeki dosyalar git reposuna commit edilemez. Dağıtım paketleri GitHub Releases üzerinden yayınlanmalıdır."
      });
      continue;
    }

    if (DISALLOWED_BINARY_EXTENSIONS.has(ext)) {
      const isVendorBinary = norm.startsWith("vendor/") && (ext === ".dll" || ext === ".sys");
      if (!isVendorBinary) {
        violations.push({
          file: relFile,
          pattern: "İkili (Binary) Dosya Engeli",
          detail: `${ext} uzantılı ikili dosyalar kaynak kod deposuna commit edilemez.`
        });
        continue;
      }
    }

    if (existsSync(fullPath)) {
      try {
        const stats = statSync(fullPath);
        const sizeMb = stats.size / (1024 * 1024);
        if (sizeMb > 5) {
          violations.push({
            file: relFile,
            pattern: "Dosya Boyut Limiti Aşımı",
            detail: `Dosya boyutu (${sizeMb.toFixed(2)} MB) 5 MB sınırını aşıyor.`
          });
          continue;
        }
      } catch {}
    }

    if ((ext === ".cmd" || ext === ".bat") && !norm.includes("/")) {
      violations.push({
        file: relFile,
        pattern: "Kök Dizin Betik Engeli",
        detail: "Kök dizinde .cmd veya .bat script dosyaları commit edilemez. Betikler scripts/ klasöründe olmalıdır."
      });
    }
  }
  return violations;
}

function scanContentViolations(stagedFiles, rootDir) {
  const violations = [];
  for (const relFile of stagedFiles) {
    const norm = relFile.replace(/\\/g, "/");
    let skip = false;
    for (const ign of IGNORED_DIRS) {
      if (norm.startsWith(ign + "/") || norm === ign || norm.includes("/" + ign + "/")) {
        skip = true;
        break;
      }
    }
    if (skip) continue;

    const fullPath = join(rootDir, relFile);
    if (!existsSync(fullPath)) continue;

    try {
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.includes("C:\\Users\\...") ||
          line.includes("%USERPROFILE%") ||
          line.includes("Zero Leakage") ||
          line.includes("Sıfır Sızıntı")
        ) {
          continue;
        }

        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.regex.test(line)) {
            violations.push({
              file: `${relFile}:${i + 1}`,
              pattern: pattern.name,
              detail: line.trim().slice(0, 100)
            });
          }
        }
      }
    } catch {
      // Binary veya okunamayan dosyaları atla
    }
  }
  return violations;
}

function main() {
  const rootDir = process.cwd();
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const structuralViolations = checkStructuralViolations(stagedFiles, rootDir);
  const contentViolations = scanContentViolations(stagedFiles, rootDir);
  const totalViolations = [...structuralViolations, ...contentViolations];

  if (totalViolations.length > 0) {
    console.error("\n======================================================================");
    console.error("   [BLOCKED - ANTICORE SIFIR SIZINTI MUHAFIZI (ZERO LEAKAGE)]         ");
    console.error("======================================================================");
    console.error("Commit engellendi! Aşağıdaki dosyalarda kural ihlali veya sızıntı tespit edildi:\n");
    for (const v of totalViolations) {
      console.error(` -> Hedef : ${v.file}`);
      console.error(`    Kural : ${v.pattern}`);
      console.error(`    Detay : ${v.detail}\n`);
    }
    console.error("Lütfen bu dosyaları/bilgileri git staging alanından kaldırın.\n");
    process.exit(1);
  }

  process.exit(0);
}

main();
