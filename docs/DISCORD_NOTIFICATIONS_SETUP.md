# Discord Notifications Setup

This guide shows you how to set up Discord notifications for daily test results.

## Quick Setup (5 minutes)

### 1. Create Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Configure:
   - **Name**: `ManaCore CI/CD` (or whatever you prefer)
   - **Channel**: Select the channel for test notifications (e.g., `#dev-alerts`)
   - **Avatar**: Optional - upload a custom icon
5. Click **Copy Webhook URL**

### 2. Add Webhook to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `DISCORD_WEBHOOK_URL`
   - **Value**: Paste the webhook URL from Discord
5. Click **Add secret**

### 3. That's It!

The workflow will now send Discord notifications automatically:
- **Failure notifications**: Always sent when tests fail
- **Success notifications**: Optional (enable via manual workflow trigger)

---

## What You'll Receive

### Failure Notification

When tests fail, you'll get a red embed:

```
❌ Daily Tests Failed
The daily test suite encountered failures and needs attention.

📅 Date: 2025-12-26
📊 Coverage: 87.5%
🔗 Workflow Run: [View Details](link)
```

**Color**: Red (#E74C3C)

### Success Notification (Optional)

When tests pass and you enable success notifications:

```
✅ Daily Tests Passed
All tests completed successfully!

📅 Date: 2025-12-26
📊 Coverage: 95.3%
✅ Tests: 180 passed
🔗 Workflow Run: [View Details](link)
```

**Color**: Green (#2ECC71)

---

## Advanced Configuration

### Enable Success Notifications

By default, only failures send Discord notifications. To get success notifications:

1. Go to **Actions** → **Daily Tests** workflow
2. Click **Run workflow**
3. Check the box: **Send Discord notification on success**
4. Run workflow

### Customize Notification Content

Edit `.github/workflows/daily-tests.yml` and modify the Discord webhook payload:

```yaml
- name: Send Discord notification
  run: |
    curl -X POST "$DISCORD_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d '{
        "username": "Your Custom Name",
        "avatar_url": "https://your-custom-avatar.png",
        "embeds": [{
          "title": "Custom Title",
          "description": "Custom description",
          "color": 15158332,
          ...
        }]
      }'
```

### Change Notification Channel

In Discord:
1. **Server Settings** → **Integrations** → **Webhooks**
2. Find **ManaCore CI/CD** webhook
3. Change **Channel** dropdown
4. Save

The GitHub secret stays the same - no need to update!

### Add Multiple Channels

To send to multiple Discord channels:

1. Create multiple webhooks in Discord (one per channel)
2. Add multiple secrets to GitHub:
   - `DISCORD_WEBHOOK_URL_ALERTS`
   - `DISCORD_WEBHOOK_URL_TEAM`
   - `DISCORD_WEBHOOK_URL_DEVOPS`
3. Duplicate the Discord notification step in the workflow for each webhook

---

## Discord Webhook URL Format

The webhook URL should look like:
```
https://discord.com/api/webhooks/[WEBHOOK_ID]/[WEBHOOK_TOKEN]
```

**Security**: Never commit this URL to git! Always use GitHub Secrets.

---

## Troubleshooting

### Notifications Not Appearing

1. **Check webhook is active**:
   - Discord → Server Settings → Integrations → Webhooks
   - Verify webhook exists and is enabled

2. **Check GitHub secret**:
   - GitHub → Settings → Secrets → `DISCORD_WEBHOOK_URL`
   - Verify secret exists and is spelled correctly

3. **Check workflow logs**:
   - GitHub Actions → Daily Tests → Latest run
   - Look for "Send Discord notification" step
   - Check for curl errors

### Rate Limiting

Discord webhooks are rate-limited to:
- **30 requests per minute** per webhook
- **5 requests per 2 seconds** burst

Our daily workflow sends 1-2 notifications per day, well within limits.

### Testing Your Webhook

Test the webhook without running the full workflow:

```bash
# Replace with your actual webhook URL
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE"

curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "Test Bot",
    "content": "This is a test message from curl!"
  }'
```

If you see the message in Discord, your webhook works!

---

## Slack + Discord Together

You can use both Slack and Discord notifications simultaneously:

1. Add both secrets:
   - `DISCORD_WEBHOOK_URL`
   - `SLACK_WEBHOOK_URL`

2. The workflow checks for both and sends to whichever exists

---

## Discord Embed Colors

The workflow uses these colors:

| Status | Color | Hex |
|--------|-------|-----|
| ❌ Failure | Red | `#E74C3C` (15158332) |
| ✅ Success | Green | `#2ECC71` (3066993) |

To customize, change the `"color"` field in the workflow.

---

## Security Best Practices

1. ✅ **Do**: Store webhook URL in GitHub Secrets
2. ✅ **Do**: Use a dedicated Discord channel for CI/CD
3. ✅ **Do**: Restrict webhook permissions if possible
4. ❌ **Don't**: Commit webhook URLs to git
5. ❌ **Don't**: Share webhook URLs publicly
6. ❌ **Don't**: Use webhooks with admin permissions

---

## Example: Full Setup

```bash
# 1. Create Discord webhook
Discord → Server Settings → Integrations → Create Webhook
Channel: #dev-alerts
Copy URL: https://discord.com/api/webhooks/123456789/abcdefg

# 2. Add to GitHub
GitHub → Settings → Secrets → New secret
Name: DISCORD_WEBHOOK_URL
Value: https://discord.com/api/webhooks/123456789/abcdefg

# 3. Test (optional)
GitHub Actions → Daily Tests → Run workflow

# 4. Done!
Wait for next daily run (2 AM UTC) or trigger manually
```

---

## Support

For issues with:
- **Discord webhooks**: [Discord API Docs](https://discord.com/developers/docs/resources/webhook)
- **GitHub Actions**: [GitHub Actions Docs](https://docs.github.com/en/actions)
- **This workflow**: See `docs/TESTING_GUIDE.md`

---

🏗️ ManaCore Monorepo
