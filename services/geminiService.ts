import { GoogleGenAI, Modality } from "@google/genai";

const getApiKey = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return apiKey;
};

const createAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });

const processImageResponse = (response: any): string => {
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content.parts) {
      throw new Error("No content generated. The response may have been blocked.");
    }
    
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data found in the response.");
};


export const generate3DLogo = async (
  prompt: string,
  image?: { mimeType: string; data: string }
): Promise<string> => {
  try {
    const ai = createAiClient();
    const parts = image
      ? [
          { inlineData: { mimeType: image.mimeType, data: image.data } },
          { text: prompt },
        ]
      : [{ text: prompt }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    return processImageResponse(response);

  } catch (error) {
    console.error("Error generating 3D logo:", error);
    throw new Error("Failed to generate logo with Gemini API.");
  }
};

export const editImageWithNano = async (
  prompt: string,
  image: { mimeType: string; data: string }
): Promise<string> => {
    try {
        const ai = createAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: image.mimeType, data: image.data } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        return processImageResponse(response);

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image with Gemini API.");
    }
};

export const animateImageWithVeo = async (
  prompt: string,
  image: { mimeType: string; data: string },
  aspectRatio: '16:9' | '9:16',
  onStatusUpdate: (status: string) => void
): Promise<string> => {
    try {
        // Create a new client right before the call to ensure the latest API key is used.
        const ai = createAiClient();
        onStatusUpdate("Starting video generation...");
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: image.data,
                mimeType: image.mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        
        onStatusUpdate("Processing video... this can take a few minutes.");
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            onStatusUpdate("Checking generation status...");
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }

        onStatusUpdate("Fetching generated video...");
        return downloadLink;

    } catch (error) {
        console.error("Error animating image:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during video generation.";
        throw new Error(errorMessage);
    }
};