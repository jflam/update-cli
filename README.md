# update-cli

`update-cli` is a command-line tool that applies changes to a file using the
Gemini AI API. It reads the content of a file, takes changes from the
clipboard, and uses AI to intelligently apply those changes to the file.

## Features

- Apply changes to a file using AI
- Read changes from the clipboard
- Print modified content to the console (optional)
- Debug mode to output the prompt for manual testing in Google AI Studio

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- npm (usually comes with Node.js)
- A Gemini API key from Google

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/update-cli.git
   cd update-cli
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Set up your Gemini API key:
   - Obtain a Gemini API key from the Google AI Platform
   - Set the API key as an environment variable:
     ```
     export GEMINI_API_KEY=your_api_key_here
     ```

## Usage

The basic syntax for using `update-cli` is:

```
node src/update.js <file_path> [options]
```

Options:
- `-p, --print`: Print the modified content to the console
- `-d, --debug`: Output the prompt for manual testing in Google AI Studio
- `-h, --help`: Show help information

Example usage:
```
node src/update.js path/to/your/file.js --print
```

This command will:
1. Read the content of `path/to/your/file.js`
2. Read the changes from your clipboard
3. Use the Gemini AI API to apply the changes
4. Write the modified content back to the file
5. Print the modified content to the console (because of the `--print` flag)

## How It Works

1. The tool reads the specified file and the clipboard content.
2. It constructs a prompt for the Gemini AI API, including the original file content and the changes from the clipboard.
3. The AI generates a response with the modified content.
4. The tool extracts the code block from the AI's response.
5. If specified, it prints the modified content to the console.
6. Finally, it writes the modified content back to the original file.

## Development

To contribute to `update-cli`, follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a pull request

## Contact

If you have any questions or feedback, please open an issue in the GitHub repository.