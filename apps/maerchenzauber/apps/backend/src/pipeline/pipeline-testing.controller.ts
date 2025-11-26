import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PipelineExecutor } from './core/pipeline.executor';
import { PipelineRegistry } from './core/pipeline.registry';

@Controller('pipeline-testing')
export class PipelineTestingController {
  constructor(
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly pipelineRegistry: PipelineRegistry,
  ) {}

  @Get('/')
  getTestingUI() {
    // Return HTML UI for testing
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Pipeline Testing Dashboard</title>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .step-list {
      list-style: none;
      padding: 0;
    }
    .step-item {
      padding: 12px;
      margin: 8px 0;
      background: #f8f9fa;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .step-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }
    .step-category {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
    }
    .step-name {
      font-weight: 600;
      color: #212529;
      margin: 4px 0;
    }
    .step-description {
      font-size: 14px;
      color: #6c757d;
    }
    .input-area {
      margin: 20px 0;
    }
    .input-area textarea {
      width: 100%;
      min-height: 200px;
      padding: 12px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }
    .button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .button:hover {
      background: #5a67d8;
    }
    .button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    .output-area {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 16px;
      margin-top: 20px;
    }
    .log-entry {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-radius: 4px;
      border-left: 4px solid #28a745;
    }
    .log-entry.error {
      border-left-color: #dc3545;
    }
    .log-entry.running {
      border-left-color: #ffc107;
    }
    .log-time {
      font-size: 12px;
      color: #6c757d;
    }
    .json-output {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #dee2e6;
    }
    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      cursor: pointer;
      color: #6c757d;
      font-size: 16px;
      transition: all 0.2s;
    }
    .tab.active {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      margin-bottom: -2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔧 Pipeline Testing Dashboard</h1>
    <p>Test individual pipeline steps and full pipelines with real-time feedback</p>
  </div>

  <div class="container">
    <div class="card">
      <h2>Available Steps</h2>
      <div id="steps-list"></div>
    </div>

    <div class="card">
      <h2 id="test-title">Select a Step to Test</h2>

      <div class="tabs">
        <button class="tab active" onclick="switchTab('single')">Single Step</button>
        <button class="tab" onclick="switchTab('pipeline')">Full Pipeline</button>
      </div>

      <div id="single-step-test">
        <div class="input-area">
          <h3>Input (JSON)</h3>
          <textarea id="input-json" placeholder='{"userId": "user123", "name": "Test Character", "description": "A brave knight"}'></textarea>
        </div>

        <button class="button" id="execute-btn" onclick="executeStep()">
          Execute Step
        </button>

        <div id="output-area"></div>
      </div>

      <div id="pipeline-test" style="display: none;">
        <div class="input-area">
          <h3>Pipeline Input (JSON)</h3>
          <textarea id="pipeline-input" placeholder='{"userId": "user123", "name": "Test Character", "description": "A brave knight"}'></textarea>
        </div>

        <select id="pipeline-select" style="width: 100%; padding: 10px; margin: 10px 0;">
          <option value="">Select Pipeline</option>
        </select>

        <button class="button" onclick="executePipeline()">
          Execute Pipeline
        </button>

        <div id="pipeline-output"></div>
      </div>
    </div>
  </div>

  <script>
    let selectedStep = null;
    let steps = [];
    let pipelines = [];

    async function loadSteps() {
      const response = await fetch('/pipeline-testing/steps');
      steps = await response.json();

      const stepsList = document.getElementById('steps-list');
      const html = steps.map(step => \`
        <div class="step-item" onclick="selectStep('\${step.category}', '\${step.name}')">
          <div class="step-category">\${step.category}</div>
          <div class="step-name">\${step.name}</div>
          <div class="step-description">\${step.description}</div>
        </div>
      \`).join('');

      stepsList.innerHTML = '<ul class="step-list">' + html + '</ul>';
    }

    async function loadPipelines() {
      const response = await fetch('/pipeline-testing/pipelines');
      pipelines = await response.json();

      const select = document.getElementById('pipeline-select');
      select.innerHTML = '<option value="">Select Pipeline</option>' +
        pipelines.map(p => \`<option value="\${p.name}">\${p.name} (\${p.steps.length} steps)</option>\`).join('');
    }

    function selectStep(category, name) {
      selectedStep = { category, name };
      document.getElementById('test-title').textContent = \`Testing: \${name}\`;
      document.getElementById('output-area').innerHTML = '';

      // Highlight selected step
      document.querySelectorAll('.step-item').forEach(el => {
        el.style.background = el.textContent.includes(name) ? '#e7f3ff' : '#f8f9fa';
      });
    }

    async function executeStep() {
      if (!selectedStep) {
        alert('Please select a step to test');
        return;
      }

      const inputJson = document.getElementById('input-json').value;
      let input;

      try {
        input = JSON.parse(inputJson);
      } catch (e) {
        alert('Invalid JSON input: ' + e.message);
        return;
      }

      const btn = document.getElementById('execute-btn');
      btn.disabled = true;
      btn.textContent = 'Executing...';

      try {
        const response = await fetch('/pipeline-testing/execute-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: selectedStep.category,
            name: selectedStep.name,
            input
          })
        });

        const result = await response.json();
        displayResult(result);
      } catch (error) {
        displayError(error);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Execute Step';
      }
    }

    async function executePipeline() {
      const pipelineName = document.getElementById('pipeline-select').value;
      if (!pipelineName) {
        alert('Please select a pipeline');
        return;
      }

      const inputJson = document.getElementById('pipeline-input').value;
      let input;

      try {
        input = JSON.parse(inputJson);
      } catch (e) {
        alert('Invalid JSON input: ' + e.message);
        return;
      }

      try {
        const response = await fetch('/pipeline-testing/execute-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pipelineName, input })
        });

        const result = await response.json();
        displayPipelineResult(result);
      } catch (error) {
        displayError(error, 'pipeline-output');
      }
    }

    function displayResult(result) {
      const outputArea = document.getElementById('output-area');

      const logsHtml = result.executionLogs.map(log => \`
        <div class="log-entry \${log.status}">
          <div style="display: flex; justify-content: space-between;">
            <strong>\${log.stepName}</strong>
            <span class="log-time">\${log.duration}ms</span>
          </div>
          <div style="margin-top: 8px;">
            Status: <span style="color: \${log.status === 'success' ? '#28a745' : '#dc3545'}">
              \${log.status}
            </span>
          </div>
        </div>
      \`).join('');

      outputArea.innerHTML = \`
        <div class="output-area">
          <h3>Execution Result</h3>
          <div style="margin: 16px 0;">
            <strong>Success:</strong> \${result.success ? '✅' : '❌'}
            <br>
            <strong>Duration:</strong> \${result.totalDuration}ms
          </div>

          <h4>Execution Logs</h4>
          \${logsHtml}

          <h4>Output Data</h4>
          <div class="json-output">
            <pre>\${JSON.stringify(result.data || result.error, null, 2)}</pre>
          </div>
        </div>
      \`;
    }

    function displayPipelineResult(result) {
      const outputArea = document.getElementById('pipeline-output');

      const logsHtml = result.executionLogs.map(log => \`
        <div class="log-entry \${log.status}">
          <div style="display: flex; justify-content: space-between;">
            <strong>\${log.stepName}</strong>
            <span class="log-time">\${log.duration}ms</span>
          </div>
        </div>
      \`).join('');

      outputArea.innerHTML = \`
        <div class="output-area">
          <h3>Pipeline Execution Result</h3>
          <div style="margin: 16px 0;">
            <strong>Success:</strong> \${result.success ? '✅' : '❌'}
            <br>
            <strong>Total Duration:</strong> \${result.totalDuration}ms
          </div>

          <h4>Step Execution Order</h4>
          \${logsHtml}

          <h4>Final Output</h4>
          <div class="json-output">
            <pre>\${JSON.stringify(result.data || result.error, null, 2)}</pre>
          </div>
        </div>
      \`;
    }

    function displayError(error, targetId = 'output-area') {
      document.getElementById(targetId).innerHTML = \`
        <div class="output-area">
          <h3 style="color: #dc3545;">Error</h3>
          <div class="json-output">
            <pre style="color: #ff6b6b;">\${error.message || error}</pre>
          </div>
        </div>
      \`;
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');

      if (tab === 'single') {
        document.getElementById('single-step-test').style.display = 'block';
        document.getElementById('pipeline-test').style.display = 'none';
      } else {
        document.getElementById('single-step-test').style.display = 'none';
        document.getElementById('pipeline-test').style.display = 'block';
      }
    }

    // Load steps and pipelines on page load
    loadSteps();
    loadPipelines();
  </script>
</body>
</html>
    `;
  }

  @Get('steps')
  getAllSteps() {
    const steps = Array.from(this.pipelineRegistry.getAllSteps().values());
    return steps.map((step) => ({
      name: step.name,
      category: step.category,
      description: step.description,
    }));
  }

  @Get('pipelines')
  getAllPipelines() {
    const pipelines = Array.from(
      this.pipelineRegistry.getAllPipelines().entries(),
    );
    return pipelines.map(([name, steps]) => ({
      name,
      steps: steps.map((s) => ({
        name: s.name,
        category: s.category,
      })),
    }));
  }

  @Post('execute-step')
  async executeStep(
    @Body() body: { category: string; name: string; input: any },
  ) {
    const step = this.pipelineRegistry.getStep(body.category, body.name);

    if (!step) {
      throw new Error(`Step ${body.category}:${body.name} not found`);
    }

    return await this.pipelineExecutor.execute(
      [step],
      body.input,
      body.input.userId,
    );
  }

  @Post('execute-pipeline')
  async executePipeline(@Body() body: { name: string; input: any }) {
    const pipeline = this.pipelineRegistry.getPipeline(body.name);

    if (!pipeline) {
      throw new Error(`Pipeline ${body.name} not found`);
    }

    return await this.pipelineExecutor.execute(
      pipeline,
      body.input,
      body.input.userId,
    );
  }
}
