import {
  Card,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Spinner,
  Box,
} from "@shopify/polaris";

const BalanceCards = ({
  loadingTx,
  latestTransaction,
  shopCurrency,
  balanceUsedINR, // optional — not used anymore
  balanceRemainingINR, // optional — not used anymore
  cappedAmount,
  cappedCurrency,
  cappedAmountINR, // optional — not used anymore
}: BalanceCardsProps) => {
  const renderBalanceCard = (
    title: string,
    value: number | null | undefined,
    currency: string | null | undefined,
    tone: "critical" | "success" | "subdued",
  ) => {
    if (!latestTransaction) {
      return (
        <Text as="p" tone="subdued">
          No Transaction available
        </Text>
      );
    }

    // Always show in USD
    return (
      <Text as="h2" variant="headingMd" tone={tone} fontWeight="bold">
        {value?.toFixed(2)} {currency ?? "USD"}
      </Text>
    );
  };

  const cardWidth = "400px";

  return (
    <Card>
      <BlockStack gap="400">
        <Banner title="Royalty Amount Status" tone="info" />

        {loadingTx && (
          <InlineStack align="center" gap="400">
            {[1, 2].map((i) => (
              <Card key={i}>
                <Box width={cardWidth} minHeight="100px" padding="400">
                  <InlineStack align="center" blockAlign="center" gap="200">
                    <Spinner
                      accessibilityLabel={`Loading balance ${i}`}
                      size="large"
                    />
                    <Text as="p" tone="subdued">
                      Loading...
                    </Text>
                  </InlineStack>
                </Box>
              </Card>
            ))}
          </InlineStack>
        )}

        {!loadingTx && (
          <InlineStack align="center" gap="400">
            {/* Balance Used */}
            <Card background="bg-surface-info">
              <Box width={cardWidth} minHeight="100px" padding="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Balance Used
                  </Text>
                  <Text as="p" tone="subdued">
                    Total amount already utilized from your subscription capped
                    amount
                  </Text>
                  {renderBalanceCard(
                    "Balance Used",
                    latestTransaction?.balanceUsed,
                    latestTransaction?.currency,
                    latestTransaction?.balanceUsed &&
                      latestTransaction.balanceUsed > 0
                      ? "subdued"
                      : "success",
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* Capped Amount */}
            <Card background="bg-surface-info">
              <Box width={cardWidth} minHeight="100px" padding="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Capped Amount
                  </Text>
                  <Text as="p" tone="subdued">
                    Maximum allowed capped amount spending limit for your plan
                  </Text>
                  {renderBalanceCard(
                    "Capped Amount",
                    cappedAmount,
                    cappedCurrency,
                    "subdued",
                  )}
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default BalanceCards;

