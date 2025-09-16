"use client";

import { useState, useEffect } from "react";
import {
  Page,
  Card,
  Banner,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Layout,
  Spinner,
  Frame,
  Divider,
  Badge,
  List,
  Box,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";

import { ROYALTY_PLAN } from "@/lib/config/royaltyConfig";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchExchangeRate } from "@/app/components/redux/currencySlice";
import { RootState, AppDispatch } from "@/app/components/redux/store";

export default function HomePage() {
  const router = useRouter();
  const app = useAppBridge();

  const [shop, setShop] = useState<string | null>(null);
  const [billingApproved, setBillingApproved] = useState(false);
  const [billingLoading, setBillingLoading] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [latestTransaction, setLatestTransaction] = useState<any | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [cappedAmount, setCappedAmount] = useState<number | null>(null);
  const [cappedCurrency, setCappedCurrency] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { rates } = useSelector((state: RootState) => state.currency);

  const exchangeRateKey = cappedCurrency ? `${cappedCurrency}-INR` : null;
  const exchangeRate = exchangeRateKey ? rates[exchangeRateKey] : null;

  const convertToINR = (amount: number | null, currency: string | null) => {
    if (!amount || !currency) return null;
    if (currency === "INR") return amount;
    const key = `${currency}-INR`;
    const rate = rates[key];
    return rate ? amount * rate : null;
  };

  // Get shop from App Bridge
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info from App Bridge config");
  }, [app]);

  // Check billing
  useEffect(() => {
    if (!shop) return;
    async function checkBilling() {
      setBillingLoading(true);
      try {
        const res = await fetch(`/api/charges/status?shop=${shop}`);
        const data = await res.json();
        if (res.ok && data.active) setBillingApproved(true);
      } catch (err) {
        console.error("Error checking billing:", err);
      } finally {
        setBillingLoading(false);
      }
    }
    checkBilling();
  }, [shop]);

  // Fetch transactions
  useEffect(() => {
    if (!shop || !billingApproved) return;
  
    async function fetchLatestTransaction() {
      setLoadingTx(true);
      try {
        const res = await fetch(
          `/api/royality/orders/transaction/balanceused?shop=${shop}`
        );
        const data = await res.json();
  
        if (res.ok && data.success) {
          // Latest transaction details
          setLatestTransaction(data.latestTransaction);
  
          // Agar total balances bhi chahiye
          // setTotalBalanceUsed(data.totalBalanceUsed);
          // setTotalBalanceRemaining(data.totalBalanceRemaining);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTx(false);
      }
    }
  
    fetchLatestTransaction();
  }, [shop, billingApproved]);
  
  // Fetch capped amount
  useEffect(() => {
    if (!shop || !billingApproved) return;
    async function fetchCappedAmount() {
      try {
        const res = await fetch(`/api/charges?shop=${shop}`);
        const data = await res.json();
        if (res.ok) {
          setCappedAmount(data.cappedAmount);
          setCappedCurrency(data.currency);
          if (data.currency && data.currency !== "INR") {
            const key = `${data.currency}-INR`;
            if (!rates[key])
              dispatch(fetchExchangeRate({ from: data.currency, to: "INR" }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCappedAmount();
  }, [shop, billingApproved, dispatch, rates]);

  const startRoyaltyPlan = async () => {
    if (!shop) return setPlanError("Shop info missing");
    setCreatingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch(`/api/charges/billing?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ROYALTY_PLAN, shop }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create plan");
      const url = data.confirmationUrl || data.confirmation_url;
      if (!url) throw new Error("No confirmation URL returned");
      window.open(url, "_blank");
      setConfirmationUrl(url);
    } catch (err: any) {
      setPlanError(err.message || "Unexpected error");
    } finally {
      setCreatingPlan(false);
    }
  };

  // Converted values in INR
  const cappedAmountINR = convertToINR(cappedAmount, cappedCurrency);
  const balanceUsedINR = convertToINR(
    latestTransaction?.balanceUsed,
    latestTransaction?.currency,
  );
  const balanceRemainingINR = convertToINR(
    latestTransaction?.balanceRemaining,
    latestTransaction?.currency,
  );

  return (
    <Frame>
      <Page
        title="Royalty Billing"
        subtitle="Track and distribute royalties to your designers"
        backAction={{ content: "Back", onAction: () => router.back() }}
      >
        <Layout>
          {/* Billing Banner */}
          <Layout.Section>
            {billingLoading ? (
              <Banner title="Royalty Payments" tone="info">
                <BlockStack gap="300" align="center">
                  <Spinner
                    accessibilityLabel="Checking billing status"
                    size="small"
                  />
                  <Text as="p">Checking billing status...</Text>
                </BlockStack>
              </Banner>
            ) : (
              <Banner
                title="Royalty Payments"
                tone={billingApproved ? "info" : "critical"}
              >
                <BlockStack gap="300">
                  <Text as="p">
                    Royalty billing allows you to automatically calculate and
                    charge usage-based royalties.
                  </Text>
                  <List>
                    <List.Item>
                      Keep royalty payments up to date without manual tracking
                    </List.Item>
                    <List.Item>
                      View transaction data after orders are placed
                    </List.Item>
                    <List.Item>
                      Automatically distribute payments to designers
                    </List.Item>
                  </List>
                  <InlineStack align="start">
                    <Button
                      variant="primary"
                      disabled={
                        creatingPlan || billingLoading || billingApproved
                      }
                      loading={creatingPlan}
                      onClick={startRoyaltyPlan}
                    >
                      {billingApproved
                        ? "Billing Enabled"
                        : "Enable Royalty Billing"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Banner>
            )}
          </Layout.Section>

          {/* Billing Status Card */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Banner title="Royalty Billing Status" tone="info" />

                <InlineStack align="space-between" blockAlign="center">
                  {billingLoading ? (
                    <Spinner
                      accessibilityLabel="Checking billing"
                      size="small"
                    />
                  ) : (
                    <Badge
                      tone={billingApproved ? "success" : "attention"}
                      size="large"
                    >
                      {billingApproved ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </InlineStack>
                <Text as="p">
                  Automatically track and distribute royalties to your
                  designers.
                </Text>
                <Divider />

                {/* Transactions */}
                <Banner title="Royalty Amount Status" tone="info" />
                {loadingTx ? (
                  <Spinner accessibilityLabel="Loading balances" size="small" />
                ) : latestTransaction ? (
                  <BlockStack gap="200">
                    <InlineStack align="start" blockAlign="center" gap="200">
                      <Card>
                        <Box minWidth="260px" minHeight="100px" padding="400">
                          <Text as="h3" variant="headingXl" tone="subdued">
                            Balance Used
                          </Text>
                          <Text
                            as="h2"
                            variant="headingMd"
                            tone={
                              balanceUsedINR && balanceUsedINR > 0
                                ? "critical"
                                : "success"
                            }
                            fontWeight="bold"
                          >
                            {balanceUsedINR !== null
                              ? balanceUsedINR.toFixed(2)
                              : "-"}{" "}
                            INR
                          </Text>
                        </Box>
                      </Card>

                      <Card>
                        <Box minWidth="260px" minHeight="100px" padding="400">
                          <Text as="h3" variant="headingXl" tone="subdued">
                            Balance Remaining
                          </Text>
                          <Text
                            as="h2"
                            variant="headingMd"
                            tone={
                              balanceRemainingINR && balanceRemainingINR > 0
                                ? "success"
                                : "subdued"
                            }
                            fontWeight="bold"
                          >
                            {balanceRemainingINR !== null
                              ? balanceRemainingINR.toFixed(2)
                              : "-"}{" "}
                            INR
                          </Text>
                        </Box>
                      </Card>

                      <Card>
                        <Box minWidth="260px" minHeight="100px" padding="400">
                          <Text as="h3" variant="headingXl" tone="subdued">
                            Capped Amount
                          </Text>
                          {cappedAmountINR ? (
                            <Text
                              as="h2"
                              variant="headingMd"
                              tone="subdued"
                              fontWeight="bold"
                            >
                              {cappedAmountINR.toFixed(2)} INR
                            </Text>
                          ) : (
                            <Text as="p" tone="subdued">
                              Not available
                            </Text>
                          )}
                        </Box>
                      </Card>
                    </InlineStack>
                  </BlockStack>
                ) : (
                  <Text as="p" tone="subdued">
                    No transactions available yet.
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Errors */}
          {(error || planError) && (
            <Layout.Section>
              <Banner title="Error" tone="critical">
                <p>{error || planError}</p>
              </Banner>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </Frame>
  );
}
