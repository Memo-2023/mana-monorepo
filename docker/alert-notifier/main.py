#!/usr/bin/env python3
"""
Alert Notifier - Webhook receiver for Alertmanager
Forwards alerts to Telegram and ntfy

Environment Variables:
  TELEGRAM_BOT_TOKEN - Telegram bot token
  TELEGRAM_CHAT_ID - Telegram chat ID
  NTFY_TOPIC - ntfy.sh topic name (optional)
"""

import os
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')
NTFY_TOPIC = os.environ.get('NTFY_TOPIC', '')

SEVERITY_EMOJI = {
    'critical': '🚨',
    'warning': '⚠️',
    'info': 'ℹ️',
}

def format_alert_telegram(alert: dict, status: str) -> str:
    """Format a single alert for Telegram."""
    labels = alert.get('labels', {})
    annotations = alert.get('annotations', {})

    severity = labels.get('severity', 'unknown')
    emoji = SEVERITY_EMOJI.get(severity, '🔔')

    if status == 'resolved':
        emoji = '✅'

    alertname = labels.get('alertname', 'Unknown')
    job = labels.get('job', '')
    summary = annotations.get('summary', alertname)
    description = annotations.get('description', '')

    msg = f"{emoji} <b>{status.upper()}: {summary}</b>\n"
    if job:
        msg += f"Service: <code>{job}</code>\n"
    if description:
        msg += f"{description}\n"

    return msg

def send_telegram(message: str) -> bool:
    """Send message to Telegram."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram not configured")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True
    }

    try:
        req = urllib.request.Request(
            url,
            data=urllib.parse.urlencode(data).encode(),
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False

def send_ntfy(title: str, message: str, priority: str = 'default') -> bool:
    """Send message to ntfy."""
    if not NTFY_TOPIC:
        return False

    url = f"https://ntfy.sh/{NTFY_TOPIC}"

    priority_map = {
        'critical': 'urgent',
        'warning': 'high',
        'info': 'low'
    }
    ntfy_priority = priority_map.get(priority, 'default')

    try:
        req = urllib.request.Request(
            url,
            data=message.encode('utf-8'),
            headers={
                'Title': title,
                'Priority': ntfy_priority,
                'Tags': 'warning' if priority == 'critical' else 'loudspeaker'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        logger.error(f"ntfy send failed: {e}")
        return False

class AlertHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body)
            self.process_alerts(payload)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

    def process_alerts(self, payload: dict):
        """Process Alertmanager webhook payload."""
        status = payload.get('status', 'unknown')
        alerts = payload.get('alerts', [])

        if not alerts:
            return

        logger.info(f"Received {len(alerts)} alerts with status: {status}")

        # Build message
        messages = []
        highest_severity = 'info'

        for alert in alerts:
            msg = format_alert_telegram(alert, alert.get('status', status))
            messages.append(msg)

            severity = alert.get('labels', {}).get('severity', 'info')
            if severity == 'critical':
                highest_severity = 'critical'
            elif severity == 'warning' and highest_severity != 'critical':
                highest_severity = 'warning'

        combined_message = '\n'.join(messages)

        # Send notifications
        if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
            success = send_telegram(combined_message)
            logger.info(f"Telegram: {'sent' if success else 'failed'}")

        if NTFY_TOPIC:
            title = f"Mana Alert ({len(alerts)} alerts)"
            # Strip HTML for ntfy
            plain_message = combined_message.replace('<b>', '').replace('</b>', '')
            plain_message = plain_message.replace('<code>', '').replace('</code>', '')
            success = send_ntfy(title, plain_message, highest_severity)
            logger.info(f"ntfy: {'sent' if success else 'failed'}")

    def log_message(self, format, *args):
        logger.info(f"{self.client_address[0]} - {format % args}")

def main():
    port = int(os.environ.get('PORT', 8080))

    logger.info(f"Starting Alert Notifier on port {port}")
    logger.info(f"Telegram configured: {bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)}")
    logger.info(f"ntfy configured: {bool(NTFY_TOPIC)}")

    server = HTTPServer(('0.0.0.0', port), AlertHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down")
        server.shutdown()

if __name__ == '__main__':
    main()
