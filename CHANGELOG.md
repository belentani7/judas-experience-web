# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Spec-Driven Development (SDD) protocol implementation
- SPEC.md with constitution-grade checklist (P1-P5)
- Technical plan (tasks/plan.md) with architecture, risks, parallelization
- Atomic task list (tasks/todo.md) with acceptance criteria
- GitHub Actions CI pipeline (validate-spec, lint, test, a11y, lighthouse, security)
- Vercel deployment configuration (vercel.json)
- Production readiness audit (30 criteria, Level 2)
- Spec-code convergence validation
- GLSL shader validation
- Three.js vendor update script
- Asset optimization pipeline
- Accessibility (axe-core WCAG 2.1 AA)
- Performance budgets (LCP<2.5s, CLS<0.1, TBT<200ms)
- Multilingual support (PT/ES/EN/CA)
- Security scanning (npm audit + TruffleHog)

### Changed
- Repository structure reorganized for SDD compliance
- CI/CD pipeline modernized with quality gates

### Security
- Zero secrets in repository
- Dependabot configured for weekly updates
- CodeQL code scanning enabled

## [1.0.0] - 2026-09-22

### Added
- Initial release: The Judas Experience visual universe
- Three.js procedural planet, spectral diamond (IOR 2.417), golden key PBR, organic machine
- Dark pop aesthetic, 432 Hz tuning
- ES Modules with Import Maps
- CSS Custom Properties theming system
- GLSL shaders for all visual effects
- Static site deployment to Vercel

---

## Release Checklist

- [ ] All CI checks pass
- [ ] Spec-code convergence validated
- [ ] Production audit Level 2 achieved (30/30)
- [ ] Vercel production deploy verified
- [ ] Health endpoint responding 200
- [ ] Lighthouse budgets met
- [ ] Accessibility 0 violations
- [ ] Changelog updated
- [ ] Tag created: `v1.0.0`
- [ ] GitHub Release published