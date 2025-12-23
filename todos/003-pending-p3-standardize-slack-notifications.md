---
status: pending
priority: p3
issue_id: "003"
tags: [code-review, ci-cd, observability, consistency]
dependencies: []
pr_number: 44
---

# Standardize Slack Notification Format Across Workflows

## Problem Statement

**What's Inconsistent:**
Different workflows use inconsistent Slack notification formats - some use rich blocks with detailed context, others use simple text messages.

**Why It Matters:**
- **Inconsistent UX**: Team receives different notification formats for similar events
- **Missing Context**: Simple format lacks clickable links, commit info, actor details
- **Harder Triage**: Simple notifications don't provide enough information to assess severity
- **Maintenance Burden**: Two different patterns to maintain

**Business Impact:**
- **LOW** severity - doesn't block functionality
- Reduces notification effectiveness
- Makes incident response slower (need to click through for context)
- Inconsistent developer experience

## Findings

### Evidence from Pattern Recognition Specialist
> "**ANTI-PATTERN: Inconsistent Slack notifications**
>
> **Inconsistency Found:**
> `/Users/ganapolsky_i/.claude-worktrees/MetaChrome/quizzical-mayer/.github/workflows/rag-ingest.yml:99-105` uses simple text format
>
> Compare to `/Users/ganapolsky_i/.claude-worktrees/MetaChrome/quizzical-mayer/.github/workflows/ci.yml:51-69` which uses rich blocks with:
> - Formatted sections
> - Structured fields
> - Clickable links to workflow runs
> - Actor information
> - Commit SHA"

### Current Inconsistency

**Simple Format** (rag-ingest.yml):
```yaml
- name: Notify Slack on failure
  if: steps.guard.outputs.enabled == 'true' && failure() && env.SLACK_WEBHOOK_URL != ''
  run: |
    msg='{"text":":x: RAG ingest failed on '${{ github.ref_name }}' run '${{ github.run_number }}'"}'
    curl -X POST -H 'Content-Type: application/json' --data "$msg" "$SLACK_WEBHOOK_URL"
```

**Rich Format** (ci.yml):
```yaml
- name: Notify Slack on failure
  if: failure() && env.SLACK_WEBHOOK_URL != ''
  run: |
    msg=$(cat <<'EOF'
    {
      "text": ":x: CI failed — MetaChrome/${{ github.ref_name }}",
      "blocks": [
        { "type": "section", "text": { "type": "mrkdwn", "text": "*CI failed* — MetaChrome/${{ github.ref_name }} (#${{ github.run_number }})" } },
        { "type": "section", "fields": [
          { "type": "mrkdwn", "text": "*Job:*\n${{ github.job }}" },
          { "type": "mrkdwn", "text": "*Commit:*\n`${{ github.sha }}`" },
          { "type": "mrkdwn", "text": "*Actor:*\n${{ github.actor }}" },
          { "type": "mrkdwn", "text": "*Run:*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|Open logs>" }
        ]}
      ]
    }
    EOF
    )
    curl -X POST -H 'Content-Type: application/json' --data "$msg" "$SLACK_WEBHOOK_URL"
```

### Affected Files
- `/Users/ganapolsky_i/.claude-worktrees/MetaChrome/quizzical-mayer/.github/workflows/rag-ingest.yml:99-105` (simple format)
- `/Users/ganapolsky_i/.claude-worktrees/MetaChrome/quizzical-mayer/.github/workflows/ci.yml:51-69` (rich format)
- Potentially other workflows (need audit)

## Proposed Solutions

### Solution 1: Standardize on Rich Block Format (RECOMMENDED)

**Description:** Update all workflows to use the rich Slack block format with structured fields.

**Pros:**
- Consistent UX across all notifications
- Better information density
- Clickable links for faster triage
- Easier to scan visually
- Professional appearance

**Cons:**
- More verbose YAML
- Slightly more complex to understand

**Effort:** Small (15 minutes per workflow)
**Risk:** None

**Implementation:**
1. Audit all workflows for Slack notifications
2. Create reusable template (either in docs or as workflow composite action)
3. Update each workflow to use rich format
4. Test by triggering failure conditions

**Template:**
```yaml
- name: Notify Slack on failure
  if: failure() && env.SLACK_WEBHOOK_URL != ''
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    msg=$(cat <<'EOF'
    {
      "text": ":x: <Workflow Name> failed — MetaChrome/${{ github.ref_name }}",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*<Workflow Name> failed* — MetaChrome/${{ github.ref_name }} (#${{ github.run_number }})"
          }
        },
        {
          "type": "section",
          "fields": [
            { "type": "mrkdwn", "text": "*Job:*\n${{ github.job }}" },
            { "type": "mrkdwn", "text": "*Commit:*\n`${{ github.sha }}`" },
            { "type": "mrkdwn", "text": "*Actor:*\n${{ github.actor }}" },
            { "type": "mrkdwn", "text": "*Run:*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|Open logs>" }
          ]
        }
      ]
    }
    EOF
    )
    curl -X POST -H 'Content-Type: application/json' --data "$msg" "$SLACK_WEBHOOK_URL"
```

### Solution 2: Extract to Composite Action

**Description:** Create a reusable composite action for Slack notifications.

**Pros:**
- DRY principle - single definition
- Easier to update all workflows at once
- Can add features once, benefit everywhere
- Enforces consistency automatically

**Cons:**
- Requires creating new action
- Slightly more complex initial setup
- Debugging composite actions can be harder

**Effort:** Medium (1-2 hours initial, then 5 min per workflow)
**Risk:** Low

**Implementation:**
1. Create `.github/actions/slack-notify-failure/action.yml`
2. Define inputs (webhook URL, workflow name, etc.)
3. Implement notification logic in action
4. Update all workflows to use action

**Example Usage:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: ./.github/actions/slack-notify-failure
  with:
    slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    workflow_name: "RAG Ingest"
```

### Solution 3: Use Third-Party Slack Action

**Description:** Use community-maintained Slack notification action.

**Pros:**
- No custom code to maintain
- Well-tested by community
- May have additional features

**Cons:**
- External dependency
- Less control over format
- May not match exact requirements
- Supply chain security considerations

**Effort:** Small (5 min per workflow)
**Risk:** Low-Medium (dependency on external action)

**Example:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": ":x: RAG Ingest failed"
      }
```

## Recommended Action

**Implement Solution 1** - Standardize on rich block format.

This is a **P3** priority that can be done as a follow-up to this PR.

## Technical Details

### Workflow Audit Needed
Need to audit these workflows for notification patterns:
- `.github/workflows/ci.yml` ✓ (uses rich format)
- `.github/workflows/rag-ingest.yml` ✗ (uses simple format)
- `.github/workflows/build.yml` ? (needs check)
- `.github/workflows/build-free.yml` ? (needs check)
- `.github/workflows/release.yml` ? (needs check)
- `.github/workflows/maestro-tests.yml` ? (needs check)
- `.github/workflows/langsmith-sync.yml` ? (needs check)

### Slack Block Kit
Reference: https://api.slack.com/block-kit

Useful block types:
- `section` - Main content area
- `context` - Metadata footer
- `divider` - Visual separator
- `actions` - Interactive buttons (if needed)

### Testing Strategy
1. Create test workflow or use existing
2. Force failure condition
3. Verify notification appears in Slack
4. Check formatting, links, information completeness

## Acceptance Criteria

- [ ] All workflows use consistent notification format
- [ ] Notifications include: workflow name, branch, run number, commit SHA, actor, clickable log link
- [ ] Template or composite action created for reuse
- [ ] Documentation updated with notification standards
- [ ] At least one test notification sent to verify format

## Work Log

**2025-12-23**: Identified during PR #44 code review by pattern-recognition-specialist agent

## Resources

- **PR:** https://github.com/IgorGanapolsky/MetaChrome/pull/44
- **Slack Block Kit:** https://api.slack.com/block-kit
- **Slack Block Kit Builder:** https://app.slack.com/block-kit-builder
- **Example (ci.yml):** `/Users/ganapolsky_i/.claude-worktrees/MetaChrome/quizzical-mayer/.github/workflows/ci.yml:51-69`
