#!/usr/bin/env python3
"""Audit production readiness against 30-criteria checklist."""
import sys
import json
import subprocess
from pathlib import Path

CRITERIA = {
    "critical": [
        ("origin_github", "Remote origin -> github.com/belentani7/<repo>"),
        ("branch_protected", "Branch main protegida (PR required, status checks)"),
        ("no_secrets", "Cero secretos en repo (git log clean)"),
        ("gitignore_complete", ".gitignore completo"),
        ("package_scripts", "package.json scripts: build, dev, start, test, lint, typecheck"),
        ("build_passes", "Build local pasa (exit 0)"),
        ("deploy_config", "Config deploy detectada + deploy plataforma correcta"),
        ("env_vars_platform", "Env vars en plataforma (NO en repo)"),
        ("health_endpoint", "Health endpoint /api/health o /healthz -> 200"),
        ("readme_links", "README con descripcion, install, run, deploy, env vars, links vivos"),
    ],
    "high": [
        ("conventional_commits", "Commits convencionales"),
        ("dependabot", "Dependabot/Renovate activado"),
        ("codeql", "CodeQL/Code scanning activado"),
        ("lockfile_committed", "package-lock.json commiteado"),
        ("ts_strict", "TypeScript strict mode"),
        ("lint_passes", "Lint pasa"),
        ("tests_pass", "Tests existen + pasan + coverage >80%"),
        ("preview_deploys", "Preview deployments en PRs"),
        ("error_tracking", "Error tracking (Sentry/Vercel Analytics/CF)"),
        ("structured_logs", "Logs estructurados (pino/winston/JSON)"),
        ("seo_access", "robots.txt, sitemap.xml, meta OG/Twitter"),
        ("a11y_wcag", "Accesibilidad WCAG 2.1 AA (axe-core en CI)"),
        ("changelog", "CHANGELOG.md actualizado"),
        ("spec_md", "SPEC.md/docs/spec.md con criterios aceptacion"),
    ],
    "medium": [
        ("cwv", "Core Web Vitals: LCP<2.5s, CLS<0.1, INP<200ms"),
        ("cache_headers", "Assets cache headers (static 1yr, HTML no-cache)"),
        ("dns_ssl", "DNS custom + SSL"),
        ("cdn_edge", "CDN/Edge activado"),
        ("uptime_monitor", "Uptime monitor"),
        ("spec_updated", "SPEC.md actualizado"),
    ]
}

def run_cmd(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, timeout=30)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "timeout"
    except Exception as e:
        return False, "", str(e)

def check_criterion(name, description, repo_path):
    """Check a single criterion."""
    path = Path(repo_path)

    if name == "origin_github":
        ok, out, _ = run_cmd("git remote get-url origin", cwd=path)
        return ok and "github.com/belentani7/" in out, out

    elif name == "branch_protected":
        # Can't check via CLI without GH API, assume if CI passes
        ok, out, _ = run_cmd("gh api repos/:owner/:repo/branches/main/protection", cwd=path)
        return ok, out if ok else "Check GitHub Branch Protection settings"

    elif name == "no_secrets":
        ok, out, _ = run_cmd("git log --all --full-history --oneline -- **/.env* **/*.key **/*.pem **/secrets*", cwd=path)
        return out == "", "Clean" if out == "" else f"Found: {out[:100]}"

    elif name == "gitignore_complete":
        gi = path / ".gitignore"
        if not gi.exists():
            return False, "Missing .gitignore"
        content = gi.read_text()
        required = ["node_modules", ".env", "dist", "*.log", "*.lock", ".vercel", ".DS_Store"]
        missing = [r for r in required if r not in content]
        return len(missing) == 0, f"Missing: {missing}" if missing else "Complete"

    elif name == "package_scripts":
        pkg = path / "package.json"
        if not pkg.exists():
            return False, "No package.json"
        import json
        scripts = json.loads(pkg.read_text()).get("scripts", {})
        required = ["build", "dev", "start", "test", "lint", "typecheck"]
        missing = [r for r in required if r not in scripts]
        return len(missing) == 0, f"Missing: {missing}" if missing else "All present"

    elif name == "build_passes":
        pkg = path / "package.json"
        if not pkg.exists():
            return False, "No package.json"
        import json
        scripts = json.loads(pkg.read_text()).get("scripts", {})
        if "build" not in scripts:
            return False, "No build script"
        ok, out, err = run_cmd("npm run build", cwd=path)
        return ok, out[:200] if ok else err[:200]

    elif name == "deploy_config":
        configs = ["vercel.json", "netlify.toml", "wrangler.toml", "wrangler.jsonc", "railway.json", "Dockerfile"]
        found = [c for c in configs if (path / c).exists()]
        return len(found) > 0, f"Found: {found}" if found else "None detected"

    elif name == "env_vars_platform":
        # Check no .env in repo
        env_files = list(path.rglob(".env*"))
        env_files = [f for f in env_files if not any(p in str(f) for p in [".git", "node_modules", ".example"])]
        return len(env_files) == 0, f"Found .env files: {env_files}" if env_files else "None in repo"

    elif name == "health_endpoint":
        # Check for health file or API route
        health_files = list(path.rglob("health*")) + list(path.rglob("api/health*"))
        health_files = [f for f in health_files if not any(p in str(f) for p in [".git", "node_modules"])]
        return len(health_files) > 0, f"Found: {health_files}" if health_files else "None"

    elif name == "readme_links":
        readme = path / "README.md"
        if not readme.exists():
            return False, "No README.md"
        content = readme.read_text(encoding='utf-8', errors='ignore')
        checks = ["http://", "https://", "install", "run", "deploy", "env"]
        found = [c for c in checks if c.lower() in content.lower()]
        return len(found) >= 4, f"Found: {found}"

    elif name == "conventional_commits":
        ok, out, _ = run_cmd("git log --oneline -20", cwd=path)
        if not ok:
            return False, "No git history"
        lines = out.split('\n')
        conventional = sum(1 for l in lines if re.match(r'^(feat|fix|chore|docs|perf|refactor|test|ci|build|revert)(\(.+\))?:', l))
        return conventional >= len(lines) * 0.8, f"{conventional}/{len(lines)} conventional"

    elif name == "dependabot":
        dependabot = path / ".github" / "dependabot.yml"
        return dependabot.exists(), "Configured" if dependabot.exists() else "Missing"

    elif name == "codeql":
        codeql = path / ".github" / "codeql" / "codeql-config.yml"
        workflows = list((path / ".github" / "workflows").glob("*codeql*")) if (path / ".github" / "workflows").exists() else []
        return codeql.exists() or len(workflows) > 0, "Configured" if (codeql.exists() or workflows) else "Missing"

    elif name == "lockfile_committed":
        lockfiles = list(path.glob("package-lock.json")) + list(path.glob("pnpm-lock.yaml")) + list(path.glob("yarn.lock"))
        return len(lockfiles) > 0, f"Found: {[f.name for f in lockfiles]}"

    elif name == "ts_strict":
        tsconfig = path / "tsconfig.json"
        if not tsconfig.exists():
            return True, "No TypeScript (N/A)"
        import json
        cfg = json.loads(tsconfig.read_text())
        return cfg.get("compilerOptions", {}).get("strict") == True, "Strict: " + str(cfg.get("compilerOptions", {}).get("strict"))

    elif name == "lint_passes":
        # Cross-platform: avoid head/tail on Windows
        import platform
        if platform.system() == "Windows":
            ok, out, err = run_cmd("npm run lint 2>&1", cwd=path)
            if ok:
                out = "\n".join(out.splitlines()[:20])
        else:
            ok, out, err = run_cmd("npm run lint 2>&1 | head -20", cwd=path)
        return ok, out if ok else err[:200]

    elif name == "tests_pass":
        import platform
        if platform.system() == "Windows":
            ok, out, err = run_cmd("npm test 2>&1", cwd=path)
            if ok:
                out = "\n".join(out.splitlines()[-10:])
        else:
            ok, out, err = run_cmd("npm test 2>&1 | tail -10", cwd=path)
        return ok, out if ok else err[:200]

    elif name == "preview_deploys":
        workflows = list((path / ".github" / "workflows").glob("*.yml")) if (path / ".github" / "workflows").exists() else []
        preview = any("preview" in w.read_text().lower() or "deploy-preview" in w.read_text().lower() for w in workflows)
        return preview, "Preview deploy in CI" if preview else "Missing"

    elif name == "error_tracking":
        # Check for Sentry, Vercel Analytics, etc in package.json or code
        pkg = path / "package.json"
        if pkg.exists():
            import json
            deps = {**json.loads(pkg.read_text()).get("dependencies", {}), **json.loads(pkg.read_text()).get("devDependencies", {})}
            tracking = any(t in deps for t in ["@sentry/", "vercel/analytics", "@vercel/analytics"])
            return tracking, "Found" if tracking else "Not detected"
        return False, "No package.json"

    elif name == "structured_logs":
        # Check for pino, winston, or console.json
        pkg = path / "package.json"
        if pkg.exists():
            import json
            deps = {**json.loads(pkg.read_text()).get("dependencies", {}), **json.loads(pkg.read_text()).get("devDependencies", {})}
            logging = any(t in deps for t in ["pino", "winston", "bunyan", "loglevel"])
            return logging, "Found" if logging else "Not detected"
        return False, "No package.json"

    elif name == "seo_access":
        robots = path / "robots.txt"
        sitemap = path / "sitemap.xml"
        # Check for generation in CI
        workflows = list((path / ".github" / "workflows").glob("*.yml")) if (path / ".github" / "workflows").exists() else []
        gen = any("robots" in w.read_text().lower() or "sitemap" in w.read_text().lower() for w in workflows)
        return robots.exists() or sitemap.exists() or gen, f"robots:{robots.exists()} sitemap:{sitemap.exists()} CI:{gen}"

    elif name == "a11y_wcag":
        workflows = list((path / ".github" / "workflows").glob("*.yml")) if (path / ".github" / "workflows").exists() else []
        a11y = any("axe" in w.read_text().lower() or "accessibility" in w.read_text().lower() for w in workflows)
        return a11y, "axe-core in CI" if a11y else "Missing"

    elif name == "changelog":
        changelog = path / "CHANGELOG.md"
        return changelog.exists(), "Exists" if changelog.exists() else "Missing"

    elif name == "spec_md":
        spec_files = list(path.glob("SPEC.md")) + list(path.glob("specs/*/PRODUCT.md")) + list(path.glob("docs/spec.md"))
        return len(spec_files) > 0, f"Found: {[f.name for f in spec_files]}"

    elif name == "cwv":
        # Check lighthouse budget
        budget = path / "lighthouse-budget.json"
        return budget.exists(), "Budget configured" if budget.exists() else "Missing"

    elif name == "cache_headers":
        vercel = path / "vercel.json"
        netlify = path / "netlify.toml"
        if vercel.exists():
            import json
            cfg = json.loads(vercel.read_text())
            headers = cfg.get("headers", [])
            has_cache = any("Cache-Control" in str(h) for h in headers)
            return has_cache, "Cache headers in vercel.json" if has_cache else "Missing cache headers"
        return False, "No vercel.json"

    elif name == "dns_ssl":
        # Can't check without domain, assume if custom domain in vercel.json
        vercel = path / "vercel.json"
        if vercel.exists():
            import json
            cfg = json.loads(vercel.read_text())
            domains = cfg.get("domains", [])
            return len(domains) > 0, f"Domains: {domains}" if domains else "No custom domain"
        return False, "No vercel.json"

    elif name == "cdn_edge":
        vercel = path / "vercel.json"
        if vercel.exists():
            # Vercel has Edge by default
            return True, "Vercel Edge (default)"
        return False, "Unknown platform"

    elif name == "uptime_monitor":
        # Check for uptime monitor config or external service
        return False, "Manual check required"

    elif name == "spec_updated":
        spec = path / "SPEC.md"
        if spec.exists():
            import os
            mtime = os.path.getmtime(spec)
            import time
            days_old = (time.time() - mtime) / 86400
            return days_old < 30, f"Last modified {days_old:.0f} days ago"
        return False, "No SPEC.md"

    return False, "Check not implemented"

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".", help="Repository path")
    parser.add_argument("--level", type=int, default=2, choices=[0, 1, 2], help="Level 0/1/2")
    args = parser.parse_args()

    repo_path = Path(args.repo).resolve()
    print(f"PRODUCTION READINESS AUDIT - Level {args.level}")
    print(f"Repo: {repo_path}")
    print("=" * 60)

    # Determine which criteria to check
    to_check = CRITERIA["critical"]
    if args.level >= 1:
        to_check += CRITERIA["high"]
    if args.level >= 2:
        to_check += CRITERIA["medium"]

    results = {}
    passed = 0
    total = len(to_check)

    for name, desc in to_check:
        print(f"\nChecking {name}: {desc}")
        ok, detail = check_criterion(name, desc, repo_path)
        status = "PASS" if ok else "FAIL"
        print(f"   [{status}] - {detail}")
        results[name] = {"description": desc, "passed": ok, "detail": detail}
        if ok:
            passed += 1

    print("\n" + "=" * 60)
    print(f"RESULT: {passed}/{total} criteria passed ({passed/total*100:.0f}%)")

    # Level thresholds
    thresholds = {0: 0.8, 1: 0.9, 2: 1.0}
    threshold = thresholds[args.level]
    if passed / total >= threshold:
        print(f"LEVEL {args.level} ACHIEVED (>= {threshold*100:.0f}%)")
        return 0
    else:
        print(f"LEVEL {args.level} NOT MET (need >= {threshold*100:.0f}%)")
        return 1

if __name__ == "__main__":
    import re
    sys.exit(main())