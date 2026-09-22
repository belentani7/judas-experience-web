#!/usr/bin/env python3
"""Validate SPEC.md structure and constitution-grade checklist."""
import sys
import re
from pathlib import Path

REQUIRED_SECTIONS = [
    "Objective",
    "Tech Stack",
    "Commands",
    "Project Structure",
    "Code Style",
    "Testing Strategy",
    "Boundaries",
    "Success Criteria",
    "Open Questions",
    "Constitution-Grade Checklist"
]

CONSTITUTION_PRINCIPLES = ["P1 ISTQB-FIRST", "P2 ZERO HAPPY-PATH", "P3 STATES EXPLICIT", "P4 ERROR LEAKAGE", "P5 GATEKEEPING"]

BOUNDARIES_TIERS = ["Always", "Ask First", "Never"]

EARS_PATTERN = re.compile(r'(WHEN|IF|WHILE|UNLESS|WHERE)\b.*\b(THEN|SHALL|MUST)\b', re.IGNORECASE)

def validate_spec(spec_path):
    content = Path(spec_path).read_text(encoding='utf-8')
    errors = []
    warnings = []

    # Check required sections
    for section in REQUIRED_SECTIONS:
        if f"## {section}" not in content and f"# {section}" not in content:
            errors.append(f"Missing required section: {section}")

    # Check Constitution-Grade Checklist
    for principle in CONSTITUTION_PRINCIPLES:
        if principle not in content:
            errors.append(f"Constitution principle missing: {principle}")

    # Check Boundaries tiers
    for tier in BOUNDARIES_TIERS:
        if f"- **{tier}**" not in content and f"- {tier}:" not in content:
            warnings.append(f"Boundaries tier not found: {tier}")

    # Check Success Criteria use EARS notation
    sc_section = content.split("## Success Criteria")[-1].split("##")[0] if "## Success Criteria" in content else ""
    ears_count = len(EARS_PATTERN.findall(sc_section))
    if ears_count < 4:
        warnings.append(f"Success Criteria: only {ears_count} EARS patterns found (min 4 recommended)")

    # Check for hardcoded secrets patterns
    secret_patterns = [
        r'sk-[a-zA-Z0-9_-]{20,}',
        r'gh[pousr]_[a-zA-Z0-9]{36,}',
        r'nvapi-[a-zA-Z0-9_-]{30,}',
        r'gsk_[a-zA-Z0-9]{50,}',
    ]
    for pattern in secret_patterns:
        if re.search(pattern, content):
            errors.append(f"Potential secret found in spec: {pattern[:20]}...")

    # Check for commit references (should be commit-pinned)
    if "@ <commit-sha>" not in content and "@ <commit>" not in content:
        warnings.append("No commit-pinned references found in tech references")

    # Output
    if errors:
        print("❌ SPEC VALIDATION FAILED")
        for e in errors:
            print(f"  ERROR: {e}")
        return False

    if warnings:
        print("⚠️  SPEC VALIDATION PASSED WITH WARNINGS")
        for w in warnings:
            print(f"  WARNING: {w}")
    else:
        print("✅ SPEC VALIDATION PASSED")

    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate-spec.py <spec-file>")
        sys.exit(1)
    spec_file = sys.argv[1]
    if not Path(spec_file).exists():
        print(f"Spec file not found: {spec_file}")
        sys.exit(1)
    success = validate_spec(spec_file)
    sys.exit(0 if success else 1)