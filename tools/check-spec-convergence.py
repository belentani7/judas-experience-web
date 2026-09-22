#!/usr/bin/env python3
"""Check spec-code convergence - verify implementation matches spec."""
import sys
import subprocess
import re
from pathlib import Path

def get_git_diff(base_sha, head_sha):
    """Get git diff between two commits."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", f"{base_sha}..{head_sha}"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except subprocess.CalledProcessError:
        return []

def get_git_diff_content(base_sha, head_sha):
    """Get full diff content."""
    try:
        result = subprocess.run(
            ["git", "diff", f"{base_sha}..{head_sha}"],
            capture_output=True, text=True, check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return ""

def extract_spec_commitments(spec_path):
    """Extract concrete commitments from SPEC.md."""
    content = Path(spec_path).read_text(encoding='utf-8')
    commitments = {
        'commands': [],
        'structure': [],
        'boundaries_always': [],
        'boundaries_ask': [],
        'boundaries_never': [],
        'success_criteria': [],
        'tech_stack': []
    }

    # Extract commands
    if "## Commands" in content:
        cmd_section = content.split("## Commands")[1].split("##")[0]
        for line in cmd_section.split('\n'):
            line = line.strip()
            if line.startswith('`') and ':' in line:
                commitments['commands'].append(line.strip('`'))

    # Extract project structure
    if "## Project Structure" in content:
        struct_section = content.split("## Project Structure")[1].split("##")[0]
        for line in struct_section.split('\n'):
            line = line.strip()
            if '→' in line or '->' in line:
                commitments['structure'].append(line)

    # Extract boundaries
    if "## Boundaries" in content:
        bound_section = content.split("## Boundaries")[1].split("##")[0]
        current_tier = None
        for line in bound_section.split('\n'):
            line = line.strip()
            if line.startswith('- **Always**') or line.startswith('- Always:'):
                current_tier = 'always'
            elif line.startswith('- **Ask First**') or line.startswith('- Ask First:'):
                current_tier = 'ask'
            elif line.startswith('- **Never**') or line.startswith('- Never:'):
                current_tier = 'never'
            elif line.startswith('-') and current_tier:
                commitments[f'boundaries_{current_tier}'].append(line[1:].strip())

    # Extract success criteria
    if "## Success Criteria" in content:
        sc_section = content.split("## Success Criteria")[1].split("##")[0]
        for line in sc_section.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('|'):
                commitments['success_criteria'].append(line)

    return commitments

def check_convergence(spec_path, base_sha, head_sha):
    """Main convergence check."""
    print(f"🔍 Checking spec-code convergence: {base_sha[:8]}..{head_sha[:8]}")

    # Get changed files
    changed_files = get_git_diff(base_sha, head_sha)
    diff_content = get_git_diff_content(base_sha, head_sha)

    print(f"📁 Changed files ({len(changed_files)}):")
    for f in changed_files:
        print(f"  - {f}")

    # Extract spec commitments
    commitments = extract_spec_commitments(spec_path)

    drift_found = False

    # Check 1: Commands in spec vs package.json scripts
    if Path("package.json").exists():
        import json
        pkg = json.loads(Path("package.json").read_text())
        scripts = pkg.get("scripts", {})
        for cmd in commitments['commands']:
            # Simple check: does the command name exist in scripts?
            cmd_name = cmd.split(':')[0].strip().lower()
            if cmd_name not in [s.lower() for s in scripts.keys()]:
                print(f"  ⚠️  Spec command '{cmd}' not found in package.json scripts")
                drift_found = True

    # Check 2: Project structure - verify key directories exist
    for struct_line in commitments['structure']:
        # Extract path before → or ->
        match = re.search(r'([\w/.-]+)\s*(?:→|->)', struct_line)
        if match:
            path = match.group(1).strip()
            if not Path(path).exists():
                print(f"  ⚠️  Spec structure path missing: {path}")
                drift_found = True

    # Check 3: Boundaries - look for violations in diff
    never_patterns = [
        r'secret', r'password', r'token', r'api[_-]?key',
        r'\.env', r'vendor/', r'node_modules/'
    ]
    for pattern in never_patterns:
        if re.search(pattern, diff_content, re.IGNORECASE):
            print(f"  ❌ BOUNDARY VIOLATION (Never): Pattern '{pattern}' found in diff")
            drift_found = True

    # Check 4: Success criteria - verify test files exist for key criteria
    test_files = [f for f in changed_files if 'test' in f.lower() or 'spec' in f.lower()]
    if commitments['success_criteria'] and not test_files:
        print(f"  ⚠️  Success criteria defined but no test files in changes")
        drift_found = True

    # Check 5: Tech stack consistency
    if "TypeScript" in str(commitments['tech_stack']) and not Path("tsconfig.json").exists():
        print(f"  ⚠️  Spec mentions TypeScript but no tsconfig.json")
        drift_found = True

    if drift_found:
        print("\n❌ SPEC-CODE CONVERGENCE: DRIFT DETECTED")
        return False
    else:
        print("\n✅ SPEC-CODE CONVERGENCE: ALIGNED")
        return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, help="Path to SPEC.md")
    parser.add_argument("--diff", required=True, help="Git diff range (base..head)")
    args = parser.parse_args()

    if ".." not in args.diff:
        print("Error: --diff must be in format base..head")
        sys.exit(1)

    base_sha, head_sha = args.diff.split("..")
    success = check_convergence(args.spec, base_sha, head_sha)
    sys.exit(0 if success else 1)