import { redirect } from "next/navigation";
import {
  Crown,
  Sparkles,
  Wand2,
  ImageIcon,
  Scissors,
  Check,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkIsActive } from "@/features/subscriptions/lib";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Fetch subscription details
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));

  const isActive = subscription ? checkIsActive(subscription) : false;

  const proFeatures = [
    {
      icon: Sparkles,
      title: "AI Image Generation",
      description:
        "Create stunning images from text prompts using Stability AI",
      available: isActive,
    },
    {
      icon: Scissors,
      title: "Background Removal",
      description: "Remove backgrounds from images with one click",
      available: isActive,
    },
    {
      icon: Wand2,
      title: "Advanced AI Tools",
      description: "Access to premium AI-powered design tools",
      available: isActive,
    },
    {
      icon: ImageIcon,
      title: "Unlimited Projects",
      description: "Create unlimited design projects",
      available: isActive,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-lg text-gray-600">
            Manage your subscription and billing details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Plan Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Current Plan
              </CardTitle>
              <CardDescription className="text-purple-100">
                Your subscription status and details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Plan Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Plan Type
                    </span>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <>
                          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Pro
                          </span>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                  <Separator />
                </div>

                {/* Subscription Details */}
                {subscription && isActive ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Status
                        </span>
                        <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Active
                        </span>
                      </div>
                      <Separator />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Subscription ID
                        </span>
                        <span className="text-sm font-mono text-gray-800 truncate max-w-[200px]">
                          {subscription.subscriptionId.substring(0, 20)}...
                        </span>
                      </div>
                      <Separator />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Current Period Ends
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {subscription.currentPeriodEnd
                            ? new Date(
                                subscription.currentPeriodEnd
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </span>
                      </div>
                      <Separator />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Plan ID
                        </span>
                        <span className="text-sm font-mono text-gray-800">
                          {subscription.priceId}
                        </span>
                      </div>
                      <Separator />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      You&apos;re currently on the free plan
                    </p>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      asChild
                    >
                      <a href="/?success=0&pro=1">Upgrade to Pro</a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pro Features Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Pro Features
              </CardTitle>
              <CardDescription className="text-blue-100">
                Unlock powerful design capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {proFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                        feature.available
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          feature.available
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {feature.title}
                          </h3>
                          {feature.available && (
                            <Check className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isActive && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-700 mb-3 text-center">
                    Upgrade to Pro to unlock all these amazing features!
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    asChild
                  >
                    <a href="/?success=0&pro=1">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-8 border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Questions about your subscription or billing?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Contact Support
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Get help with billing or subscription issues
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Us
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  View Invoices
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download and manage your payment history
                </p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Update Payment
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Change your payment method or card details
                </p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
