/**
 * Generate an image using Stability AI via Replicate
 * @param prompt - The text prompt to generate the image from
 * @returns Image URL from Stability AI
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Use Replicate for Stability AI image generation
    const { replicate } = await import("./replicate");

    if (!replicate || !process.env.REPLICATE_API_TOKEN) {
      throw new Error(
        "Replicate API not configured. Please set REPLICATE_API_TOKEN environment variable."
      );
    }

    console.log("Generating image with Stability AI for prompt:", prompt);

    // Use Stable Diffusion 3 for high-quality image generation
    const input = {
      cfg: 7,
      steps: 30,
      prompt: prompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      negative_prompt:
        "ugly, blurry, low quality, distorted, deformed, bad anatomy, worst quality",
      prompt_strength: 0.85,
    };

    const output = await replicate.run("stability-ai/stable-diffusion-3", {
      input,
    });

    const imageUrl = (output as Array<string>)[0];

    if (!imageUrl) {
      throw new Error("No image URL returned from Stability AI");
    }

    console.log("Image generated successfully:", imageUrl);
    return imageUrl;
  } catch (error: any) {
    console.error("Stability AI image generation error:", error);

    // Provide more specific error messages
    if (
      error.message?.includes("API key") ||
      error.message?.includes("API_KEY") ||
      error.message?.includes("token")
    ) {
      throw new Error(
        "Invalid Replicate API token. Please check REPLICATE_API_TOKEN."
      );
    } else if (
      error.message?.includes("quota") ||
      error.message?.includes("rate limit")
    ) {
      throw new Error(
        "API rate limit or quota exceeded. Please try again later."
      );
    } else if (error.message?.includes("not configured")) {
      throw new Error(error.message);
    }

    throw new Error(
      error.message || "Failed to generate image with Stability AI"
    );
  }
}
