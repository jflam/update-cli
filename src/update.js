const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <file_path> [options]')
  .option('print', {
    alias: 'p',
    type: 'boolean',
    description: 'Print the modified content to the console'
  })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    description: 'Output the prompt for manual testing in Google AI Studio'
  })
  .help('help')
  .alias('help', 'h')
  .demandCommand(1, 'Please provide a file path')
  .argv;

const filePath = argv._[0];
const shouldPrint = argv.print;
const isDebug = argv.debug;

async function readFile(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    process.exit(1);
  }
}

async function writeFile(path, content) {
  try {
    await fs.writeFile(path, content, 'utf8');
    console.log(`Successfully applied changes to ${path}`);
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
    process.exit(1);
  }
}

async function getClipboardContent() {
  try {
    const clipboardy = await import('clipboardy');
    return await clipboardy.default.read();
  } catch (error) {
    console.error(`Error reading clipboard: ${error.message}`);
    process.exit(1);
  }
}

async function callGeminiAPI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.error('Diagnostic information:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

function extractCodeBlock(text) {
  const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  console.warn("No code block found in the response. Returning the full response.");
  return text;
}

async function main() {
  const fileContent = await readFile(filePath);
  const clipboardContent = await getClipboardContent();

  const prompt = `
Please apply the changes within the <changes>code changes</changes> to 
<file>file contents</file>. 

<changes>
\`\`\`
function firstFunction() {
}

function newFunction() {
}

function secondFunction() {
}
\`\`\`
</changes>

<file>
\`\`\`
function zeroFunction() {
}

function firstFunction() {
}

function secondFunction() {
}

function thirdFunction() {
}
\`\`\`
</file>

Result:
\`\`\`
function zeroFunction() {
}

function firstFunction() {
}

function newFunction() {
}

function secondFunction() {
}

function thirdFunction() {
}
\`\`\`

<changes>
\`\`\`
${clipboardContent}
\`\`\`
</changes>

<file>
\`\`\`
${fileContent}
\`\`\`
</file>
  `;

  if (isDebug) {
    console.log('Prompt for manual testing in Google AI Studio:');
    console.log(prompt);
    return;
  }

  const fullResponse = await callGeminiAPI(prompt);
  const modifiedContent = extractCodeBlock(fullResponse);

  if (shouldPrint) {
    console.log('Modified content:');
    console.log(modifiedContent);
  }

  await writeFile(filePath, modifiedContent);
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});