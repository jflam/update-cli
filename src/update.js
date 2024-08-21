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
  .help('help')
  .alias('help', 'h')
  .demandCommand(1, 'Please provide a file path')
  .argv;

const filePath = argv._[0];
const shouldPrint = argv.print;

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

async function main() {
  const fileContent = await readFile(filePath);
  const clipboardContent = await getClipboardContent();

  const prompt = `
Please apply the changes specified by 

CHANGES:
${clipboardContent}

FILE:
${fileContent}
  `;

  const modifiedContent = await callGeminiAPI(prompt);

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