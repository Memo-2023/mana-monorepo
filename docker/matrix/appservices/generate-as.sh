#!/bin/bash

# Generate random token
gen_token() {
    openssl rand -hex 32
}

# Bot configurations: name, sender_localpart
declare -a BOTS=(
    "mana:mana-bot"
    "ollama:ollama-bot"
    "stats:stats-bot"
    "projectdoc:projectdoc-bot"
    "todo:todo-bot"
    "calendar:calendar-bot"
    "nutriphi:nutriphi-bot"
    "zitare:zitare-bot"
    "clock:clock-bot"
    "tts:tts-bot"
)

echo "# Generated AS tokens for .env file:" > as-tokens.env
echo "" >> as-tokens.env

for bot_config in "${BOTS[@]}"; do
    IFS=":" read -r name sender <<< "$bot_config"

    as_token=$(gen_token)
    hs_token=$(gen_token)

    cat > "${name}-bot.yaml" << EOF
id: ${name}-bot
hs_token: ${hs_token}
as_token: ${as_token}
url: null
sender_localpart: ${sender}
namespaces:
  users:
    - exclusive: true
      regex: '@${sender}:mana\.how'
  rooms: []
  aliases: []
rate_limited: false
EOF

    # Convert name to uppercase for env var
    env_name=$(echo "${name}" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    echo "MATRIX_${env_name}_BOT_AS_TOKEN=${as_token}" >> as-tokens.env

    echo "Created ${name}-bot.yaml with AS token"
done

echo ""
echo "Done! Add the tokens from as-tokens.env to your .env file"
