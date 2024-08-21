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
  // Retrieve the API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  // Check if the API key is set
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Initialize the Google Generative AI client with the API key
  const genAI = new GoogleGenerativeAI(apiKey);

  // Select the Gemini 1.5 Flash model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // Send the prompt to the Gemini API and generate content
    const result = await model.generateContent(prompt);

    // Extract the response from the result
    const response = await result.response;

    // Return the generated text
    return response.text();
  } catch (error) {
    // Log any errors that occur during the API call
    console.error('Error calling Gemini API:', error);

    // Provide detailed diagnostic information for debugging
    console.error('Diagnostic information:', JSON.stringify(error, null, 2));

    // Exit the process with an error code
    process.exit(1);
  }
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});