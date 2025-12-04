Model context protocol (MCP)

Connect your AI tools to Supabase using MCP

The Model Context Protocol (MCP) is a standard for connecting Large Language Models (LLMs) to platforms like Supabase. This guide covers how to connect Supabase to the following AI tools using MCP:

Cursor
Windsurf (Codium)
Visual Studio Code (Copilot)
Cline (VS Code extension)
Claude desktop
Claude code
Once connected, your AI assistants can interact with and query your Supabase projects on your behalf.

Step 1: Create a personal access token (PAT)#
First, go to your Supabase settings and create a personal access token. Give it a name that describes its purpose, like "Cursor MCP Server". This will be used to authenticate the MCP server with your Supabase account.

Step 2: Configure in your AI tool#
MCP compatible tools can connect to Supabase using the Supabase MCP server. Below are instructions for connecting to this server using popular AI tools:

Cursor#
Open Cursor and create a .cursor directory in your project root if it doesn't exist.

Create a .cursor/mcp.json file if it doesn't exist and open it.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--access-token",
"<personal-access-token>"
]
}
}
}
Replace <personal-access-token> with your personal access token.

Save the configuration file.

Open Cursor and navigate to Settings/MCP. You should see a green active status after the server is successfully connected.

Windsurf#
Open Windsurf and navigate to the Cascade assistant.

Tap on the hammer (MCP) icon, then Configure to open the configuration file.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--access-token",
"<personal-access-token>"
]
}
}
}
Replace <personal-access-token> with your personal access token.

Save the configuration file and reload by tapping Refresh in the Cascade assistant.

You should see a green active status after the server is successfully connected.

Visual Studio Code (Copilot)#
Open VS Code and create a .vscode directory in your project root if it doesn't exist.

Create a .vscode/mcp.json file if it doesn't exist and open it.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"inputs": [
{
"type": "promptString",
"id": "supabase-access-token",
"description": "Supabase personal access token",
"password": true
}
],
"servers": {
"supabase": {
"command": "npx",
"args": ["-y", "@supabase/mcp-server-supabase@latest"],
"env": {
"SUPABASE_ACCESS_TOKEN": "${input:supabase-access-token}"
}
}
}
}
Save the configuration file.

Open Copilot chat and switch to "Agent" mode. You should see a tool icon that you can tap to confirm the MCP tools are available. Once you begin using the server, you will be prompted to enter your personal access token. Enter the token that you created earlier.

For more info on using MCP in VS Code, see the Copilot documentation.

Cline#
Open the Cline extension in VS Code and tap the MCP Servers icon.

Tap Configure MCP Servers to open the configuration file.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--access-token",
"<personal-access-token>"
]
}
}
}
Replace <personal-access-token> with your personal access token.

Save the configuration file. Cline should automatically reload the configuration.

You should see a green active status after the server is successfully connected.

Claude desktop#
Open Claude desktop and navigate to Settings.

Under the Developer tab, tap Edit Config to open the configuration file.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--access-token",
"<personal-access-token>"
]
}
}
}
Replace <personal-access-token> with your personal access token.

Save the configuration file and restart Claude desktop.

From the new chat screen, you should see a hammer (MCP) icon appear with the new MCP server available.

Claude code#
Create a .mcp.json file in your project root if it doesn't exist.

Add the following configuration:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--access-token",
"<personal-access-token>"
]
}
}
}
Replace <personal-access-token> with your personal access token.

Save the configuration file.

Restart Claude code to apply the new configuration.

Next steps#
Your AI tool is now connected to Supabase using MCP. Try asking your AI assistant to create a new project, create a table, or fetch project config.

For a full list of tools available, see the GitHub README. If you experience any issues, submit an bug report.

MCP for local Supabase instances#
The Supabase MCP server connects directly to the cloud platform to access your database. If you are running a local instance of Supabase, you can instead use the Postgres MCP server to connect to your local database. This MCP server runs all queries as read-only transactions.

Step 1: Find your database connection string#
To connect to your local Supabase instance, you need to get the connection string for your local database. You can find your connection string by running:

supabase status
or if you are using npx:

npx supabase status
This will output a list of details about your local Supabase instance. Copy the DB URL field in the output.

Step 2: Configure the MCP server#
Configure your client with the following:

macOS

Windows

Windows (WSL)

Linux
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"]
}
}
}
Replace <connection-string> with your connection string.

Next steps#
Your AI tool is now connected to your local Supabase instance using MCP. Try asking the AI tool to query your database using natural language commands.
