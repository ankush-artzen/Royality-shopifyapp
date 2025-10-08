"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";
import ActionCard from "@/app/components/ActionCard";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import { fetchExchangeRate } from "@/app/redux/currencySlice";
import { useBillingStatus } from "@/app/hooks/useBillingStatus";
import { useShopCurrencyRedux } from "@/app/hooks/useShopCurrencyRedux";

export default function HomePage() {
  const router = useRouter();
  const app = useAppBridge();
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [productCount, setProductCount] = useState<number>(0);
  const [totalRoyaltyAmount, setTotalRoyaltyAmount] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [displayedRoyalties, setDisplayedRoyalties] = useState<string>("");

  const currencyState = useSelector((state: RootState) => state.currency);
  const { approved: billingApproved, loading: billingLoading } =
    useBillingStatus();

  // ✅ Get shop domain from App Bridge config
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info from App Bridge config");
  }, [app]);

  // ✅ Use centralized Redux currency logic
  const {
    currency: shopCurrency = "USD",
    loading: currencyLoading,
    error: currencyError,
  } = useShopCurrencyRedux(shop);

  useEffect(() => {
    if (!billingLoading && billingApproved === false) {
      router.replace("/royalty/billing");
    }
  }, [billingLoading, billingApproved, router]);

  // ✅ Fetch counts & totals (shop currency from Redux)
  useEffect(() => {
    if (!shop) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const resCounts = await fetch(`/api/royality/counts?shop=${shop}`);
        const dataCounts = await resCounts.json();

        if (!resCounts.ok)
          throw new Error(dataCounts?.error || "Failed fetching counts");

        setProductCount(dataCounts.totalProducts || 0);

        // Fetch totals separately
        const resTotals = await fetch(
          `/api/royality/orders/counts?shop=${shop}`,
        );
        const dataTotals = await resTotals.json();
        if (!resTotals.ok)
          throw new Error(
            dataTotals?.error || "Failed fetching royalty totals",
          );

        setTotalRoyaltyAmount(dataTotals.totalRoyaltyAmount || 0);
        setTotalOrders(dataTotals.totalOrders || 0);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
        setProductCount(0);
        setTotalRoyaltyAmount(0);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [shop]);

  // ✅ Fetch exchange rate for INR if needed
  useEffect(() => {
    if (shopCurrency === "INR") {
      dispatch(fetchExchangeRate({ from: "INR", to: "USD" }));
    }
  }, [shopCurrency, dispatch]);

  // ✅ Update displayed royalties dynamically
  useEffect(() => {
    if (loading || currencyLoading) return;

    if (shopCurrency === "USD") {
      setDisplayedRoyalties(`USD ${totalRoyaltyAmount.toFixed(2)}`);
    } else if (shopCurrency === "INR") {
      const rate = currencyState.rates?.["INR-USD"];
      if (rate) {
        setDisplayedRoyalties(`USD ${(totalRoyaltyAmount * rate).toFixed(2)}`);
      } else {
        setDisplayedRoyalties("Loading...");
      }
    } else {
      setDisplayedRoyalties(`${shopCurrency} ${totalRoyaltyAmount.toFixed(2)}`);
    }
  }, [
    shopCurrency,
    totalRoyaltyAmount,
    currencyState.rates,
    loading,
    currencyLoading,
  ]);

  const combinedError = error || currencyError;

  return (
    <Page title="Royalty App Dashboard" subtitle="Enhance your sale" fullWidth>
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Banner title="Welcome to Royalty App" tone="info">
            Effortlessly manage products, assign royalties, and track
            performance.
          </Banner>
        </Layout.Section>

        {/* Error Banner */}
        {combinedError && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <p>{combinedError}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text
                as="h3"
                variant="headingLg"
                tone="subdued"
                fontWeight="semibold"
              >
                Quick Actions
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                  justifyContent: "center",
                }}
              >
                <ActionCard
                  title="Add Products"
                  description="Create new products with royalty settings"
                  action={() => router.push("/royalty/create")}
                  buttonText="Add Product"
                />
                <ActionCard
                  title="View Analytics"
                  description="See detailed royalty reports and analytics"
                  action={() => router.push("/royalty/orders/analytics")}
                  buttonText="View Reports"
                />
                <ActionCard
                  title="Royalties Transactions"
                  description="View all royalty products transactions"
                  action={() => router.push("/royalty/orders/transaction")}
                  buttonText="Manage Transactions"
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Insights */}
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <Text
                as="h2"
                fontWeight="bold"
                tone="subdued"
                variant="headingLg"
              >
                Quick Insights
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                  justifyContent: "center",
                }}
              >
                <ActionCard
                  title="Royalty Products"
                  value={productCount}
                  loading={loading}
                />
                <ActionCard
                  title="Total Royalties"
                  value={displayedRoyalties}
                  loading={loading || currencyState.loading || currencyLoading}
                />
                <ActionCard
                  title="Total Orders"
                  value={totalOrders}
                  loading={loading}
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* About Us */}
        <Layout.Section>
          <Banner title="About us" tone="info">
            <BlockStack gap="200" align="center">
              <Text as="h2" variant="bodyLg" tone="subdued">
                A royalty management system that tracks and calculates payments
                owed to creators. Collect sales data, aggregate earnings, and
                ensure timely distribution with ease.
              </Text>
              <InlineStack>
                <Button
                  onClick={() => router.push("/royalty/create")}
                  variant="primary"
                >
                  Get Started
                </Button>
              </InlineStack>
            </BlockStack>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
