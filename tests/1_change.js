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