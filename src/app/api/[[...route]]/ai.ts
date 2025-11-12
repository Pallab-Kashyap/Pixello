import { z } from "zod";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { replicate } from "@/lib/replicate";
import { generateImage } from "@/lib/stability";
import { db } from "@/db/drizzle";
import { subscriptions } from "@/db/schema";
import { checkIsActive } from "@/features/subscriptions/lib";

const app = new Hono()
  .post(
    "/remove-bg",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        image: z.string(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user has an active subscription
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, auth.token.id));

      const isActive = checkIsActive(subscription);

      if (!isActive) {
        return c.json(
          { error: "Pro subscription required for background removal" },
          403
        );
      }

      const { image } = c.req.valid("json");

      try {
        const input = {
          image: image,
        };

        const output: unknown = await replicate.run(
          "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          { input }
        );

        const res = output as string;

        return c.json({ data: res });
      } catch (error: any) {
        console.error("Background removal error:", error);
        return c.json(
          { error: error.message || "Failed to remove background" },
          500
        );
      }
    }
  )
  .post(
    "/generate-image",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        prompt: z.string(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user has an active subscription
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, auth.token.id));

      const isActive = checkIsActive(subscription);

      if (!isActive) {
        return c.json(
          { error: "Pro subscription required for AI image generation" },
          403
        );
      }

      const { prompt } = c.req.valid("json");

      try {
        // Use Gemini for image generation
        const imageData = await generateImage(prompt);

        return c.json({ data: imageData });
      } catch (error: any) {
        console.error("Image generation error:", error);
        return c.json(
          { error: error.message || "Failed to generate image" },
          500
        );
      }
    }
  );

export default app;
