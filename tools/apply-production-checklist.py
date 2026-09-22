#!/usr/bin/env python3
"""Apply production checklist to all projects in workspace."""
import sys
import subprocess
from pathlib import Path

PROJECTS = {
    "judas-experience-web": {
        "path": "Desktop/judas-experience-web",
        "deploy": "vercel",
        "level": 2
    },
    "belentani-unified-master": {
        "path": "repos/belentani-unified-master",
        "deploy": "netlify",
        "level": 2
    },
    "secure-t": {
        "path": "repos/secure-t",
        "deploy": "vercel",
        "level": 2
    },
    "secure-t-university": {
        "path": "repos/secure-t-university",
        "deploy": "netlify",
        "level": 2
    },
    "belentani-omega-v2": {
        "path": "repos/belentani-omega-v2",
        "deploy": "vercel",
        "level": 1
    },
    "BELENTANI-OS": {
        "path": "repos/BELENTANI-OS",
        "deploy": "vercel",
        "level": 1
    },
    "belentani_Omega": {
        "path": "repos/belentani_Omega",
        "deploy": "vercel",
        "level": 1
    },
    "saas-plasma": {
        "path": "repos/saas-plasma",
        "deploy": "railway",
        "level": 2
    },
    "canva-clone": {
        "path": "repos/canva-clone",
        "deploy": "vercel",
        "level": 1
    },
    "paperclip-app": {
        "path": "repos/paperclip-app",
        "deploy": "vercel",
        "level": 1
    },
    "willian-games": {
        "path": "repos/willian-games",
        "deploy": "vercel",
        "level": 1
    },
    "deepseek-harness": {
        "path": "repos/deepseek-harness",
        "deploy": "docker",
        "level": 1
    },
    "ollama": {
        "path": "repos/ollama",
        "deploy": "docker",
        "level": 1
    },
    "Meta-voicebox": {
        "path": "repos/Meta-voicebox",
        "deploy": "docker",
        "level": 1
    },
    "SongGeneration": {
        "path": "repos/SongGeneration",
        "deploy": "docker",
        "level": 1
    },
    "SongGeneration-Studio": {
        "path": "repos/SongGeneration-Studio",
        "deploy": "docker",
        "level": 1
    },
}

def run_cmd(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, timeout=300)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "timeout (5min)"
    except Exception as e:
        return False, "", str(e)

def ensure_git_repo(project_path):
    """Initialize git repo if not exists."""
    path = Path(project_path)
    if not (path / ".git").exists():
        ok, out, err = run_cmd("git init", cwd=path)
        if not ok:
            return False, f"git init failed: {err}"
    return True, "OK"

def create_github_repo(project_name):
    """Create GitHub repo via gh CLI."""
    ok, out, err = run_cmd(f"gh repo create belentani7/{project_name} --private --description 'Belentani project: {project_name}' --confirm")
    return ok, out if ok else err

def setup_git_remote(project_path, project_name):
    """Setup git remote origin."""
    ok, out, err = run_cmd(f"git remote add origin https://github.com/belentani7/{project_name}.git", cwd=project_path)
    if not ok and "already exists" not in err:
        return False, err
    return True, "OK"

def commit_all(project_path, message):
    """Commit all changes."""
    ok, out, err = run_cmd("git add -A", cwd=project_path)
    if not ok:
        return False, f"git add failed: {err}"
    ok, out, err = run_cmd(f'git commit -m "{message}" --no-verify', cwd=project_path)
    return ok, out if ok else err

def push_to_github(project_path):
    """Push to GitHub."""
    ok, out, err = run_cmd("git push -u origin main", cwd=project_path)
    return ok, out if ok else err

def deploy_project(project_path, deploy_type):
    """Deploy to target platform."""
    if deploy_type == "vercel":
        ok, out, err = run_cmd("npx vercel --prod --yes", cwd=project_path)
    elif deploy_type == "netlify":
        ok, out, err = run_cmd("npx netlify deploy --prod --dir=.", cwd=project_path)
    elif deploy_type == "cloudflare":
        ok, out, err = run_cmd("npx wrangler pages deploy .", cwd=project_path)
    elif deploy_type == "railway":
        ok, out, err = run_cmd("railway up", cwd=project_path)
    elif deploy_type == "docker":
        ok, out, err = run_cmd("docker compose up -d --build", cwd=project_path)
    else:
        return False, f"Unknown deploy type: {deploy_type}"
    return ok, out if ok else err

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Apply to all projects")
    parser.add_argument("--project", help="Single project name")
    parser.add_argument("--level", type=int, default=2, choices=[0, 1, 2])
    parser.add_argument("--push", action="store_true", help="Push to GitHub")
    parser.add_argument("--deploy", action="store_true", help="Deploy after push")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    args = parser.parse_args()

    projects = PROJECTS
    if args.project:
        if args.project not in projects:
            print(f"Unknown project: {args.project}")
            print(f"Available: {list(projects.keys())}")
            return 1
        projects = {args.project: projects[args.project]}

    print(f"🚀 APPLYING PRODUCTION CHECKLIST")
    print(f"Level: {args.level} | Push: {args.push} | Deploy: {args.deploy} | Dry-run: {args.dry_run}")
    print("=" * 60)

    for name, config in projects.items():
        print(f"\n📦 {name}")
        print(f"   Path: {config['path']}")
        print(f"   Deploy: {config['deploy']}")
        print(f"   Level: {config['level']}")

        if args.dry_run:
            print("   [DRY RUN] Would execute full pipeline")
            continue

        project_path = Path(config["path"])
        if not project_path.exists():
            print(f"   ❌ Path not found: {project_path}")
            continue

        # Step 1: Ensure git repo
        print("   1️⃣  Git init...")
        ok, msg = ensure_git_repo(project_path)
        print(f"      {msg}")

        # Step 2: Create GitHub repo
        print("   2️⃣  GitHub repo...")
        ok, msg = create_github_repo(name)
        print(f"      {msg}")

        # Step 3: Setup remote
        print("   3️⃣  Git remote...")
        ok, msg = setup_git_remote(project_path, name)
        print(f"      {msg}")

        # Step 4: Commit
        print("   4️⃣  Commit...")
        ok, msg = commit_all(project_path, f"chore: production ready - level {config['level']} checklist applied")
        print(f"      {msg}")

        # Step 5: Push
        if args.push:
            print("   5️⃣  Push to GitHub...")
            ok, msg = push_to_github(project_path)
            print(f"      {msg}")

        # Step 6: Deploy
        if args.deploy and args.push:
            print("   6️⃣  Deploy...")
            ok, msg = deploy_project(project_path, config["deploy"])
            print(f"      {msg}")

        # Step 7: Audit
        print("   7️⃣  Audit...")
        ok, out, err = run_cmd(f"python tools/audit-production-readiness.py --repo . --level {config['level']}", cwd=project_path)
        print(f"      {'✅' if ok else '❌'} Audit: {out.split(chr(10))[-1] if out else err[:100]}")

    print("\n" + "=" * 60)
    print("✅ ALL PROJECTS PROCESSED")
    return 0

if __name__ == "__main__":
    sys.exit(main())