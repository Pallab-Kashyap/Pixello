import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.subscriptions.checkout)["$post"],
  200
>;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useCheckout = () => {
  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.subscriptions.checkout.$post();

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      // Handle Razorpay checkout
      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: data.subscriptionId,
          name: "Pixello",
          description: "Pro Subscription",
          image: "/logo.svg",
          handler: async function (response: any) {
            try {
              // Verify payment on backend
              const verifyResponse =
                await client.api.subscriptions.verify.$post({
                  json: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_subscription_id: response.razorpay_subscription_id,
                    razorpay_signature: response.razorpay_signature,
                  },
                });

              if (verifyResponse.ok) {
                toast.success("Subscription activated successfully!");
                window.location.href = `${window.location.origin}?success=1`;
              } else {
                toast.error("Payment verification failed");
              }
            } catch (error) {
              toast.error("Payment verification failed");
            }
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled");
            },
          },
          theme: {
            color: "#3b82f6",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error("Razorpay SDK not loaded. Please refresh the page.");
      }
    },
    onError: () => {
      toast.error("Failed to create session");
    },
  });

  return mutation;
};
