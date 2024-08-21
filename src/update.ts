import fs from "fs/promises";
import path from "path";
import os from "os";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { doubleCheck } from "./doubleCheck";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

interface Args {
    [x: string]: unknown;
    filePath: string;
    print?: boolean;
    debug?: boolean;
    test?: boolean;
}

async function readFile(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, "utf8");
    } catch (error) {
        console.error(`Error reading file: ${(error as Error).message}`);
        process.exit(1);
    }
}

async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        await fs.writeFile(filePath, content, "utf8");
        console.log(`Successfully wrote to ${filePath}`);
    } catch (error) {
        console.error(`Error writing file: ${(error as Error).message}`);
        process.exit(1);
    }
}

async function getClipboardContent(): Promise<string> {
    try {
        const clipboardy = await import('clipboardy');
        return await clipboardy.default.read();
    } catch (error) {
        console.error(`Error reading clipboard: ${(error as Error).message}`);
        process.exit(1);
    }
}

async function callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model: GenerativeModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

async function generateTestCase(
    filePath: string,
    clipboardContent: string
): Promise<void> {
    const updateTestsDir = process.env.UPDATE_TESTS_DIR;
    if (!updateTestsDir) {
        console.error(
            "Error: UPDATE_TESTS_DIR environment variable is not set"
        );
        process.exit(1);
    }

    const files = await fs.readdir(updateTestsDir);
    const testNumbers = files
        .map((file) => parseInt(file.split("_")[0]))
        .filter((num) => !isNaN(num));
    const nextNumber = Math.max(0, ...testNumbers) + 1;

    const beforePath = path.join(updateTestsDir, `${nextNumber}_before`);
    const changePath = path.join(updateTestsDir, `${nextNumber}_change`);
    const afterPath = path.join(updateTestsDir, `${nextNumber}_after`);

    await fs.copyFile(filePath, beforePath);
    await writeFile(changePath, clipboardContent);

    // Here, we should apply the changes to generate the 'after' file
    // For now, we'll just copy the 'before' file as a placeholder
    await fs.copyFile(filePath, afterPath);

    console.log(`Generated test case files:`);
    console.log(`Before: ${beforePath}`);
    console.log(`Change: ${changePath}`);
    console.log(`After: ${afterPath}`);

    const [passed, message] = await doubleCheck(
        await readFile(beforePath),
        clipboardContent,
        await readFile(afterPath)
    );

    if (passed) {
        console.log("Double-check passed.");
    } else {
        console.error(`Double-check failed: ${message}`);
    }
}

async function applyChangesWithDoubleCheck(
    filePath: string,
    originalContent: string,
    clipboardContent: string,
    isPrintMode: boolean
): Promise<void> {
    const prompt = `
    Please apply the changes within the <changes>code changes</changes> to 
    <file>file contents</file>. 
    
    <changes>
    \`\`\`
    ${clipboardContent}
    \`\`\`
    </changes>
    
    <file>
    \`\`\`
    ${originalContent}
    \`\`\`
    </file>
    `;

    const modifiedContent = await callGeminiAPI(prompt);

    // Create a temporary file
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'update-'));
    const tmpFile = path.join(tmpDir, 'temp_update');
    await writeFile(tmpFile, modifiedContent);

    // Perform double-check
    const [passed, message] = await doubleCheck(originalContent, clipboardContent, modifiedContent);

    if (passed) {
        if (isPrintMode) {
            console.log("Double-check passed. Modified content:");
            console.log(modifiedContent);
        } else {
            await writeFile(filePath, modifiedContent);
            console.log("Double-check passed. File updated successfully.");
        }
    } else {
        console.error(`Double-check failed: ${message}`);
        console.error("The file was not updated.");
    }

    // Clean up temporary file
    await fs.rm(tmpDir, { recursive: true, force: true });
}

async function main() {
    const argv = (await yargs(hideBin(process.argv))
        .usage("Usage: update <file_path> [options]")
        .positional("filePath", {
            describe: "Path to the file to be updated",
            type: "string",
        })
        .option("print", {
            alias: "p",
            type: "boolean",
            description: "Print the modified content to the console without updating the file",
        })
        .option("debug", {
            alias: "d",
            type: "boolean",
            description: "Output the prompt for manual testing in Google AI Studio",
        })
        .option("test", {
            alias: "t",
            type: "boolean",
            description: "Generate a new test case and run the double-check",
        })
        .help("help")
        .alias("help", "h")
        .epilogue(`
This script updates a file by applying changes from the clipboard using AI. 
It reads the target file, applies changes based on clipboard content, and 
performs a double-check before applying the update.

Note: This script uses the Gemini API to generate changes. Ensure your 
GEMINI_API_KEY is set in the environment.
        `)
        .demandCommand(1, "Please provide a file path")
        .parse()) as Args;

    const filePath = argv.filePath;
    const fileContent = await readFile(filePath);
    const clipboardContent = await getClipboardContent();

    if (argv.test) {
        await generateTestCase(filePath, clipboardContent);
    } else if (argv.debug) {
        const prompt = `
        Please apply the changes within the <changes>code changes</changes> to 
        <file>file contents</file>. 
        
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
        console.log("Prompt for manual testing in Google AI Studio:");
        console.log(prompt);
    } else {
        await applyChangesWithDoubleCheck(filePath, fileContent, clipboardContent, argv.print || false);
    }
}

main().catch((error) => {
    console.error("An unexpected error occurred:", error);
    process.exit(1);
});