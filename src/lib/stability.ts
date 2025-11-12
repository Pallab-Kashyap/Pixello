/**
 * Generate an image using Stability AI API directly
 * @param prompt - The text prompt to generate the image from
 * @returns Image URL (data URL with base64)
 */
export async function generateImage(prompt: string): Promise<string> {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error(
      "Stability AI API not configured. Please set STABILITY_API_KEY environment variable."
    );
  }

  try {
    console.log("Generating image with Stability AI for prompt:", prompt);

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "webp");

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/*",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability AI API error:", errorText);
      throw new Error(
        `Stability AI API error: ${response.status} ${response.statusText}`
      );
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:image/webp;base64,${base64Image}`;

    console.log("Image generated successfully");
    return dataUrl;
  } catch (error: any) {
    console.error("Stability AI image generation error:", error);

    // Provide more specific error messages
    if (
      error.message?.includes("API key") ||
      error.message?.includes("API_KEY") ||
      error.message?.includes("401")
    ) {
      throw new Error(
        "Invalid Stability AI API key. Please check STABILITY_API_KEY."
      );
    } else if (
      error.message?.includes("quota") ||
      error.message?.includes("rate limit") ||
      error.message?.includes("402")
    ) {
      throw new Error(
        "API rate limit or quota exceeded. Please check your Stability AI account."
      );
    } else if (error.message?.includes("not configured")) {
      throw new Error(error.message);
    }

    throw new Error(
      error.message || "Failed to generate image with Stability AI"
    );
  }
}
