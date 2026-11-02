# Decision Flow: React Flow + Inngest

A visual AI workflow builder. Each node represents a prompt that an AI model answers with `YES` or `NO`. The graph is built using React Flow, while workflow execution is handled by Inngest, with each decision running as an individual step.

## Stack

Next.js 15 (App Router) · React Flow (`@xyflow/react`) · Inngest · OpenAI SDK · Groq API · Tailwind CSS · shadcn-style components · Zustand

## Setup

Install Node.js 20 or newer.

Clone the repository and install dependencies:

```bash
npm install
```

Create your local environment file:

**Windows:**
```cmd
copy .env.example .env.local
```

**macOS/Linux:**
```bash
cp .env.example .env.local
```

Add your Groq API key to `.env.local`:

```env
LLM_API_KEY=your_groq_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
INNGEST_DEV=1
```

Never commit or upload `.env.local` or your API key.

Open two terminals in the project folder.

**Terminal 1 — Start Next.js:**

```bash
npm run dev
```

**Terminal 2 — Start Inngest:**

```bash
npm run inngest
```

Open the application:

- Frontend: http://localhost:3000
- Inngest dashboard: http://localhost:8288

Create or edit your workflow, enter a customer message, and click **Run workflow** to execute it.

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `LLM_API_KEY` | API key for an OpenAI-compatible provider | Required |
| `LLM_BASE_URL` | LLM provider endpoint | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | AI model identifier | `openai/gpt-oss-120b` |
| `INNGEST_DEV` | Enables local Inngest development mode | `1` |

The project uses Groq through the OpenAI SDK. Other compatible providers can be configured by changing the API key, base URL, and model identifier.

## How It Works

### 1. Visual Workflow Editor

Located in `components/Editor.tsx`.

- Displays an interactive React Flow canvas.
- Allows users to add nodes.
- Supports editing node names and prompts.
- Each decision node has two output handles: `YES` and `NO`.
- Users connect nodes to define workflow branches.
- Workflow graph state is saved locally using Zustand persistence and localStorage.

### 2. Workflow Submission

The frontend sends the workflow to the backend through:

`POST /api/run`

The backend validates the graph and sends a `workflow/run` event to Inngest.

### 3. AI-Powered Execution

Located in `inngest/functions.ts`.

The Inngest function starts from the designated start node and dynamically traverses the workflow.

For each visited node:

1. An activation step updates the active node.
2. A decision step sends the node prompt and customer message to the LLM.
3. The model is instructed to return only `YES` or `NO`.
4. The response is validated.
5. The selected answer determines which outgoing edge is followed.
6. Execution continues until no matching outgoing edge exists or the maximum step limit is reached.

The Groq model is configured with:

- Model: `openai/gpt-oss-120b`
- Temperature: `0.6`
- Maximum completion tokens: `512`
- Reasoning effort: `low`

Invalid responses trigger the configured Inngest retry behavior.

### 4. Live Execution State

The workflow updates execution information in `lib/runStore.ts`.

The frontend polls:

`GET /api/run/[id]`

This allows the interface to display the current execution status, active node, and ordered execution log.

## Phase 4 — Polish Features

The application includes the following usability and reliability features:

- **Visual execution state:** Nodes display different visual states while running and after YES/NO decisions.
- **Active edges:** Animated edges indicate workflow execution, while selected paths receive stronger visual emphasis.
- **Execution logs:** Displays visited nodes, decision results, timestamps, and errors.
- **JSON export:** Allows users to export their workflow graph.
- **JSON import:** Allows users to restore a workflow from exported JSON.
- **Error handling:** Invalid model responses and missing API keys are handled with error messages.
- **Automatic retries:** Inngest is configured to retry failed workflow executions twice.
- **Retry run:** Allows a failed workflow to be executed again.

## Testing

The workflow was tested with four different customer scenarios:

| Scenario | Support Decision | Second Decision | Result |
|---|---|---|---|
| Incorrect invoice and login issue | YES | Urgent: NO | Passed |
| Banking system outage | YES | Urgent: YES | Passed |
| Customer asking about pricing | NO | Sales: YES | Passed |
| Customer with no support or sales request | NO | Sales: NO | Passed |

Additional manual tests confirmed:

- Adding nodes.
- Editing node prompts.
- Connecting workflow nodes.
- JSON export and import.
- Workflow reset.
- Successful Inngest execution and execution logs.

## Design Notes and Limitations

- The execution state store is in memory and is intended for local development. Production deployment would require persistent storage such as Redis or a database.
- The frontend polls the backend for execution updates. Production deployments could use Inngest Realtime or webhooks.
- Groq is integrated through the OpenAI SDK using its compatible API endpoint.
- A node without an outgoing edge matching its decision ends the workflow.
- A maximum of 25 execution steps prevents workflows from running indefinitely due to cycles.

## Project Repository

GitHub: https://github.com/Waqas392/ai-decision-flow
