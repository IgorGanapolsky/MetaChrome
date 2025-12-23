# Automated Dependency Management

This repository uses fully automated dependency management via Dependabot with intelligent auto-merging.

## Overview

**Zero manual intervention required** for security patches and minor updates. Focus on building features while dependencies stay current and secure.

## How It Works

### Dependabot Configuration

Located in `.github/dependabot.yml`:

- **Frontend (npm)**: Checks every Monday 9am UTC
- **Backend (pip)**: Checks every Monday 9am UTC
- **GitHub Actions**: Checks every Monday 9am UTC

### Auto-Merge Rules

The `.github/workflows/auto-merge-dependabot.yml` workflow handles:

#### ✅ Automatically Merged
- **Patch updates** (1.0.0 → 1.0.1) - Security fixes, bug fixes
- **Minor updates** (1.0.0 → 1.1.0) - New features, backward compatible

**Process:**
1. Dependabot opens PR
2. All CI checks must pass (linting, tests, builds)
3. Workflow auto-approves PR
4. PR auto-merges via squash commit
5. Optional Slack notification sent

#### ⚠️ Manual Review Required
- **Major updates** (1.0.0 → 2.0.0) - May contain breaking changes

**Process:**
1. Dependabot opens PR
2. Workflow comments with review instructions
3. You review when convenient (no urgency)
4. You manually approve and merge if safe

## Safety Mechanisms

1. **CI Validation**: All checks must pass before auto-merge
2. **Update Type Detection**: Only safe updates (patch/minor) auto-merge
3. **Branch Protection**: Enforced via GitHub settings
4. **Squash Commits**: Clean git history maintained
5. **Slack Notifications**: Optional alerts on auto-merges

## Current Security Alerts

As of 2025-12-23:

- **Alert #3**: @sentry/browser (Medium) - Prototype Pollution gadget
- **Alert #2**: @sentry/react-native (Low) - Token leakage in Expo plugin

Dependabot will automatically create and merge PRs for these once configuration is active.

## Monitoring

### Check Dependabot Status
```bash
gh api repos/IgorGanapolsky/MetaChrome/dependabot/alerts
```

### List Open Dependabot PRs
```bash
gh pr list --author "dependabot[bot]" --state open
```

### View Auto-Merge Workflow Runs
```bash
gh run list --workflow=auto-merge-dependabot.yml
```

## Customization

### Disable Auto-Merge Temporarily
Comment on a Dependabot PR:
```
@dependabot ignore this minor version
```

### Change Update Frequency
Edit `.github/dependabot.yml`:
```yaml
schedule:
  interval: "daily"  # Options: daily, weekly, monthly
```

### Modify Auto-Merge Criteria
Edit `.github/workflows/auto-merge-dependabot.yml`:
```yaml
# Only auto-merge patches (not minors)
if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
```

## Troubleshooting

### Auto-Merge Not Working?

**Check:**
1. Branch protection allows auto-merge: `gh api repos/OWNER/REPO/branches/main/protection`
2. CI checks are passing
3. Workflow has necessary permissions (contents: write, pull-requests: write)
4. Update type is patch or minor

**Debug:**
```bash
# View workflow logs
gh run view --log

# Check branch protection
gh api repos/IgorGanapolsky/MetaChrome/branches/main/protection | jq
```

### Dependabot Not Creating PRs?

**Check:**
1. Dependabot is enabled: GitHub Settings → Security → Dependabot
2. `.github/dependabot.yml` exists on main branch
3. Check Dependabot logs: Security tab → Dependabot

## Benefits

- 🔒 **Security**: Vulnerabilities patched automatically
- ⚡ **Speed**: No manual review burden for safe updates
- 🎯 **Focus**: Spend time on features, not dependency maintenance
- 📊 **Compliance**: Always up-to-date with security best practices
- 🤖 **Consistency**: Automated process reduces human error

## References

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Auto-Merge Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: 2025-12-23
**Maintained By**: Claude Code Automation
