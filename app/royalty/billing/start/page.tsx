"use client";
import { useState, useEffect } from "react";
import { Page, Banner, Layout, Frame } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";

import { ROYALTY_PLAN } from "@/lib/config/royaltyConfig";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchExchangeRate } from "@/app/components/redux/currencySlice";
import { RootState, AppDispatch } from "@/app/components/redux/store";

// Components
import BillingBanner from "@/app/components/billing/BillingBanner";
import BalanceCards from "@/app/components/billing/Balancecards";
import StatusCard from "@/app/components/billing/CurrentStatus";

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
  const [shopCurrency, setShopCurrency] = useState<string | null>(null);

  const exchangeRateKey = cappedCurrency ? `${cappedCurrency}-INR` : null;
  const exchangeRate = exchangeRateKey ? rates[exchangeRateKey] : null;
  const balanceUsed = latestTransaction?.balanceUsed || 0;


  const convertToINR = (amount: number | null, currency: string | null) => {
    if (!amount || !currency) return null;
    if (currency === "INR") return amount;
    const key = `${currency}-INR`;
    const rate = rates[key];
    return rate ? amount * rate : null;
  };

  // Fetch shop currency
  useEffect(() => {
    if (!shop) return;

    async function fetchShopCurrency() {
      try {
        const res = await fetch(`/api/royality/counts?shop=${shop}`);
        const data = await res.json();
        if (res.ok) {
          setShopCurrency(data.shopCurrency || "USD");
        }
      } catch (err) {
        console.error("Error fetching shop currency:", err);
        setShopCurrency(" ");
      }
    }

    fetchShopCurrency();
  }, [shop]);

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
          `/api/royality/orders/transaction/balanceused?shop=${shop}`,
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setLatestTransaction(data.latestTransaction);
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
      fullWidth
        title="Royalty Billing"
        subtitle="Track and distribute royalties to your designers"
        backAction={{ content: "Back", onAction: () => router.back() }}
      >
        <Layout>
          {/* Billing Banner */}
          <Layout.Section>
            <BillingBanner
              billingLoading={billingLoading}
              billingApproved={billingApproved}
              creatingPlan={creatingPlan}
              startRoyaltyPlan={startRoyaltyPlan}
              balanceUsed={balanceUsed}
              cappedAmount={cappedAmount}
            />
          </Layout.Section>

          {/* Transactions Section */}
          <Layout.Section>
            <BalanceCards
              loadingTx={loadingTx}
              latestTransaction={latestTransaction}
              shopCurrency={shopCurrency}
              balanceUsedINR={balanceUsedINR}
              balanceRemainingINR={balanceRemainingINR}
              cappedAmount={cappedAmount}
              cappedCurrency={cappedCurrency}
              cappedAmountINR={cappedAmountINR}
            />
          </Layout.Section>

          {/* Current Status */}
          <Layout.Section>
            <StatusCard
              billingLoading={billingLoading}
              billingApproved={billingApproved}
            />
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
