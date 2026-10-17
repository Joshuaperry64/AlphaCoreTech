// API Service for ReelDeep
import { ApiError, logError } from './error-handler.js';

/**
 * Fetch with retry functionality
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Object>} - The response JSON
 */
const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch (e) {
          errorDetails = errorText;
        }
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          errorDetails
        );
      }
      return await response.json();
    } catch (error) {
      logError(error, `API Request to ${url}`);
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Generate content using the server proxy
 * @param {string} model - The model to use
 * @param {Object} payload - The request payload
 * @returns {Promise<Object>} - The response JSON
 */
const generateContent = async (model, payload) => {
  try {
    const response = await fetchWithRetry('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, payload })
    });
    return response;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

/**
 * Generate a joke
 * @returns {Promise<Object>} - The joke data
 */
const generateJoke = async () => {
  const prompt = "Generate a single, very humorous, and sexually suggestive fish-themed joke. The joke should be a play on words related to fish, fishing, or sea life. The response must be in JSON format with two properties: 'joke' (the joke text) and 'fish' (a fish or sea creature name).";
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "joke": { "type": "STRING" },
          "fish": { "type": "STRING" }
        },
        "propertyOrdering": ["joke", "fish"]
      }
    }
  };
  
  const response = await generateContent('gemini-2.5-flash-preview-05-20', payload);
  const jsonString = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!jsonString) throw new Error('Failed to generate joke.');
  
  return JSON.parse(jsonString);
};

/**
 * Generate an image
 * @param {string} prompt - The image prompt
 * @returns {Promise<string>} - The image URL
 */
const generateImage = async (prompt) => {
  // Implementation will depend on the image generation API being used
  throw new Error('Image generation not implemented yet');
};

/**
 * Generate text-to-speech audio
 * @param {string} textToSpeak - The text to convert to speech
 * @returns {Promise<Object>} - The audio data
 */
const generateTextToSpeech = async (textToSpeak) => {
  const payload = {
    contents: [{ parts: [{ text: textToSpeak }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
    },
    model: "gemini-2.5-flash-preview-tts"
  };
  
  const response = await generateContent('gemini-2.5-flash-preview-tts', payload);
  const audioData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  const mimeType = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
  
  if (!audioData || !mimeType) throw new Error('Failed to generate audio.');
  
  return { audioData, mimeType };
};

// Export API functions
export {
  fetchWithRetry,
  generateContent,
  generateJoke,
  generateImage,
  generateTextToSpeech
};