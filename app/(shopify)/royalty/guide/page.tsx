"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Page,
  Card,
  Button,
  Text,
  Box,
  Spinner,
  Banner,
  Divider,
  InlineStack,
  BlockStack,
  Badge,
  ProgressBar,
  Layout,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function RoyaltyOnboarding() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
  }, [app]);

  useEffect(() => {
    if (!shop) return;
    checkSubscription();
  }, [shop]);

  const checkSubscription = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/charges/statuss?shop=${encodeURIComponent(shop!)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch subscription status");
      const data = await res.json();
      setHasSubscription(Boolean(data.active));
    } catch (err) {
      console.error("checkSubscription error:", err);
      setHasSubscription(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubscribe = () => {
    setLoading(true);
    router.push(`/api/royality/subscribe?shop=${encodeURIComponent(shop!)}`);
  };

  const onboardingSteps = [
    {
      step: 1,
      title: "Enable Royalty Billing",
      description:
        "Activate your subscription to start assigning royalties to products and designers",
      status: hasSubscription ? "completed" : "current",
      action: !hasSubscription ? (
        <Button variant="primary" onClick={handleSubscribe} loading={loading}>
          Enable Subscription
        </Button>
      ) : (
        <Badge tone="success">Active</Badge>
      ),
    },
    {
      step: 2,
      title: "Assign Products & Royalties",
      description:
        "Connect products with designers and set royalty percentages for each item",
      status: hasSubscription ? "available" : "upcoming",
      action: hasSubscription && (
        <Button
          variant="primary"
          onClick={() => router.push("/royalty/create")}
        >
          Assign Royalties
        </Button>
      ),
    },
    {
      step: 3,
      title: "Track Orders & Transactions",
      description:
        "Monitor all royalty transactions and designer payouts in real-time",
      status: "upcoming",
      action: hasSubscription && (
        <Button
          variant="secondary"
          onClick={() => router.push("/royalty/orders/transaction")}
        >
          View Transactions
        </Button>
      ),
    },
    {
      step: 4,
      title: "Insights & Analytics",
      description:
        "Analyze royalty trends and designer performance with detailed reports",
      status: "upcoming",
      action: hasSubscription && (
        <Button
          variant="secondary"
          onClick={() => router.push("/royalty/orders/analytics")}
        >
          View Analytics
        </Button>
      ),
    },
  ];

  // ✅ Fix typing issue
  const completedSteps: number = hasSubscription ? 1 : 0;
  const totalSteps: number = onboardingSteps.length;

  const progress = (completedSteps / totalSteps) * 100;

  return (
    <Page
      title="Royalty Program Setup"
      subtitle="Complete these steps to start managing designer royalties"
      backAction={{ content: "Home", onAction: () => router.push("/") }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                {/* Progress Header */}
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">
                      Setup Progress
                    </Text>
                    <Badge tone={progress === 100 ? "success" : "attention"}>
                      {`${completedSteps}/${totalSteps} Complete`}
                    </Badge>
                  </InlineStack>
                  <ProgressBar progress={progress} size="medium" />
                </BlockStack>

                {checkingStatus ? (
                  <Box padding="400">
                    <InlineStack align="center" blockAlign="center" gap="200">
                      <Spinner
                        accessibilityLabel="Checking Royalty subscription"
                        size="large"
                      />
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Checking your subscription status...
                      </Text>
                    </InlineStack>
                  </Box>
                ) : (
                  <BlockStack gap="400">
                    {/* Subscription Status Banner */}
                    {!hasSubscription ? (
                      <Banner
                        title="Royalty Subscription Required"
                        tone="critical"
                      >
                        <Text as="p" variant="bodyMd">
                          To assign royalties to products and manage designer
                          payouts, you need to activate your Royalty plan.
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          ⚠️ If you uninstall, you’ll need to re-subscribe to
                          enable royalties again.
                        </Text>
                      </Banner>
                    ) : (
                      <Banner title="🎉 Royalty Program Active!" tone="success">
                        <Text as="p" variant="bodyMd">
                          Your Royalty subscription is active and ready to use.
                          Start assigning royalties to products and watch your
                          designer collaborations thrive!
                        </Text>
                        <InlineStack gap="200">
                          <Button
                            variant="primary"
                            onClick={() => router.push("/royalty/create")}
                          >
                            Assign First Royalty
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              router.push("/royalty/orders/transaction")
                            }
                          >
                            View Dashboard
                          </Button>
                        </InlineStack>
                      </Banner>
                    )}

                    <Divider />

                    {/* Onboarding Steps */}
                    <BlockStack gap="400">
                      {onboardingSteps.map((step, index) => (
                        <Box key={step.step} paddingBlock="200">
                          <BlockStack gap="200">
                            {/* Step number + Title */}
                            <Text
                              as="h3"
                              variant="headingMd"
                              fontWeight="semibold"
                            >
                              {`${step.step}. ${step.title}`}
                            </Text>

                            {/* Description */}
                            <Text as="p" variant="bodyMd" tone="subdued">
                              {step.description}
                            </Text>

                            {/* Action */}
                            {step.action && <Box>{step.action}</Box>}
                          </BlockStack>

                          {/* Divider (except last) */}
                          {index < onboardingSteps.length - 1 && (
                            <Box paddingBlockStart="200">
                              <Divider />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </BlockStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
