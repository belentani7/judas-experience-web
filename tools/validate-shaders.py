#!/usr/bin/env python3
"""Validate GLSL shaders for syntax and performance hints."""
import sys
import re
from pathlib import Path

SHADER_DIRS = ["sources/shaders", "sources", "core", "pipelines"]
SHADER_EXTS = [".glsl", ".vert", ".frag", ".vs", ".fs", ".shader"]

PERFORMANCE_HINTS = [
    (r'\bfor\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\d+\s*;\s*\w+\+\+\s*\)', "Fixed loop count - good for GPU"),
    (r'\bif\s*\([^)]*\)\s*\{[^}]*discard', "Discard in conditional - may cause divergence"),
    (r'texture2D\s*\(', "Deprecated texture2D() - use texture()"),
    (r'gl_FragColor\s*=', "Deprecated gl_FragColor - use out variable"),
    (r'varying\s+\w+', "Deprecated varying - use in/out"),
    (r'attribute\s+\w+', "Deprecated attribute - use in"),
    (r'#version\s+(\d+)', "GLSL version"),
]

ERROR_PATTERNS = [
    (r'\b(?:void|float|vec[234]|mat[234]|int|bool|sampler2D|samplerCube)\s+\w+\s*\([^)]*\)\s*\{', "Function definition"),
    (r'^\s*#version\s+\d+\s*(?:es|core|compatibility)?\s*$', "Version directive"),
]

def validate_shader_file(filepath):
    """Validate a single shader file."""
    content = Path(filepath).read_text(encoding='utf-8', errors='ignore')
    issues = []
    hints = []

    # Check for version directive
    has_version = bool(re.search(r'^#version\s+\d+', content, re.MULTILINE))
    if not has_version:
        issues.append(f"{filepath}: Missing #version directive")

    # Check for main function
    has_main = bool(re.search(r'\bvoid\s+main\s*\(\s*\)\s*\{', content))
    if not has_main:
        issues.append(f"{filepath}: Missing main() function")

    # Performance hints
    for pattern, msg in PERFORMANCE_HINTS:
        matches = list(re.finditer(pattern, content))
        if matches:
            for m in matches[:3]:  # Limit output
                line_num = content[:m.start()].count('\n') + 1
                hints.append(f"{filepath}:{line_num}: {msg}")

    # Basic syntax checks
    open_braces = content.count('{')
    close_braces = content.count('}')
    if open_braces != close_braces:
        issues.append(f"{filepath}: Mismatched braces ({open_braces} open, {close_braces} close)")

    open_parens = content.count('(')
    close_parens = content.count(')')
    if open_parens != close_parens:
        issues.append(f"{filepath}: Mismatched parentheses ({open_parens} open, {close_parens} close)"

    # Check for common GLSL errors
    if 'gl_FragCoord' in content and 'gl_FragCoord.z' in content:
        hints.append(f"{filepath}: Using gl_FragCoord.z - consider explicit depth")

    if 'discard' in content:
        hints.append(f"{filepath}: Uses discard - may disable early-z optimization")

    return issues, hints

def find_shader_files(root):
    """Find all shader files in project."""
    shader_files = []
    for shader_dir in SHADER_DIRS:
        dir_path = Path(root) / shader_dir
        if dir_path.exists():
            for ext in SHADER_EXTS:
                shader_files.extend(dir_path.rglob(f"*{ext}"))
    # Also search root for any shader files
    for ext in SHADER_EXTS:
        shader_files.extend(Path(root).rglob(f"*{ext}"))
    return list(set(shader_files))  # Deduplicate

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    shader_files = find_shader_files(root)

    if not shader_files:
        print("ℹ️  No shader files found")
        return True

    print(f"🔍 Validating {len(shader_files)} shader file(s)...")

    all_issues = []
    all_hints = []

    for shader_file in shader_files:
        issues, hints = validate_shader_file(shader_file)
        all_issues.extend(issues)
        all_hints.extend(hints)

    if all_issues:
        print("\n❌ SHADER VALIDATION FAILED")
        for issue in all_issues:
            print(f"  {issue}")
        return False

    if all_hints:
        print("\n⚠️  PERFORMANCE HINTS")
        for hint in all_hints[:20]:  # Limit output
            print(f"  {hint}")
        if len(all_hints) > 20:
            print(f"  ... and {len(all_hints) - 20} more hints")

    print(f"\n✅ SHADER VALIDATION PASSED ({len(shader_files)} files)")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)