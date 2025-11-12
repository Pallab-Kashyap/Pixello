import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.ai)["generate-image"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.ai)["generate-image"]["$post"]
>["json"];

export const useGenerateImage = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.ai["generate-image"].$post({ json });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = (error as any).error || "Failed to generate image";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
  });

  return mutation;
};
