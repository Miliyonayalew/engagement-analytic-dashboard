# GitHub Workflows

This directory contains automated workflows for the Engagement Analytics Dashboard project.

## Workflows Overview

### 1. **CI/CD Pipeline** (`ci-cd.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
- ✅ **Backend Tests:** Tests across Node.js 16.x, 18.x, 20.x
- ✅ **Frontend Tests:** TypeScript checking, building, testing
- ✅ **Security Audit:** Dependency vulnerability scanning
- ✅ **Integration Tests:** Full stack API testing with CSV upload validation
- ✅ **Deployment:** Conditional deployment on main branch with artifact generation

### 2. **PR Validation** (`pr-validation.yml`)
**Triggers:** Pull Requests to `main`/`develop`
- ⚡ **Quick Checks:** Fast validation for PRs
- ✅ **TypeScript:** Type checking without full test suite
- ✅ **Build Test:** Ensures code compiles successfully
- ✅ **API Health:** Basic backend responsiveness check

### 3. **Security Monitoring** (`security-monitoring.yml`)
**Triggers:** Weekly schedule (Mondays 9 AM UTC) + Manual trigger
- 🔒 **Security Scanning:** Weekly vulnerability checks
- 📦 **Dependency Updates:** Outdated package monitoring
- 📊 **Reports:** Automated security and dependency reports
- 🚨 **Alert System:** Fails on critical vulnerabilities

## Workflow Features

### ✨ **Smart Features:**
- **Multi-Node Testing:** Ensures compatibility across Node.js versions
- **Artifact Storage:** Build artifacts saved for deployment
- **Conditional Deployment:** Only deploys from main branch
- **Health Checks:** API endpoint validation in CI
- **Security First:** Automated vulnerability scanning

### 📊 **Monitoring & Reporting:**
- Upload build artifacts for review
- Generate security reports
- Track dependency updates
- Integration test validation

### 🚀 **Production Ready:**
- Comprehensive testing pipeline
- Security-first approach
- Automated deployment preparation
- Cross-version compatibility

## Usage

### Running Workflows:
1. **Automatic:** Workflows trigger on push/PR automatically
2. **Manual:** Security monitoring can be triggered manually from GitHub Actions tab
3. **Scheduled:** Security scans run weekly on Mondays

### Viewing Results:
- Check **Actions** tab in GitHub repository
- Download artifacts from completed workflow runs
- Review security reports in workflow artifacts
- Monitor integration test results

## Customization

To customize workflows for your deployment target:

1. **Update deployment section** in `ci-cd.yml` (lines 180-200)
2. **Add deployment secrets** in repository settings
3. **Modify test commands** if you add testing frameworks
4. **Adjust security levels** in `security-monitoring.yml`

## Requirements

- Node.js 16.x, 18.x, or 20.x
- npm with package-lock.json files
- Backend server on port 8000
- Sample CSV file for integration tests

---

**Status:** ✅ Production Ready  
**Last Updated:** 2024  
**Compatibility:** GitHub Actions, Node.js 16+ 