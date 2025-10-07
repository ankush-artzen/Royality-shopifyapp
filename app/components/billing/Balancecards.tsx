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
  balanceUsedINR,
  balanceRemainingINR,
  cappedAmount,
  cappedCurrency,
  cappedAmountINR,
}: BalanceCardsProps) => {
  /** === Layout constants === */
  const CARD_WIDTH = "350px";
  const CARD_MIN_HEIGHT = "60px";
  const CARD_PADDING = "100";
  const STACK_GAP_OUTER = "400";
  const STACK_GAP_INNER = "1600"; // space between cards
  const CONTENT_GAP = "200";
  const LOADING_SPINNER_SIZE: "small" | "large" = "small";

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

    return (
      <Text as="h2" variant="headingMd" tone={tone} fontWeight="bold">
        {currency ?? "USD"} {value?.toFixed(2)}
      </Text>
    );
  };

  // Fixed loading card content to match actual card structure
  const renderLoadingCard = (title: string, description: string) => (
    <Card background="bg-surface-info">
      <Box
        width={CARD_WIDTH}
        minHeight={CARD_MIN_HEIGHT}
        padding={CARD_PADDING}
      >
        <BlockStack gap={CONTENT_GAP}>
          <Text as="h3" variant="headingMd" tone="subdued">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
          <InlineStack align="center" gap={CONTENT_GAP}>
            <Spinner
              accessibilityLabel={`Loading ${title}`}
              size={LOADING_SPINNER_SIZE}
            />
            <Text as="p" tone="subdued">
              Loading...
            </Text>
          </InlineStack>
        </BlockStack>
      </Box>
    </Card>
  );

  return (
    <Card>
      <BlockStack gap={STACK_GAP_OUTER}>
        <Banner title="Royalty Amount Status" tone="info" />

        <InlineStack align="center" gap={STACK_GAP_INNER}>
          {loadingTx ? (
            <>
              {/* Loading state - Balance Used */}
              {renderLoadingCard(
                "Balance Used",
                "Total amount already utilized from your subscription capped amount",
              )}

              {/* Loading state - Capped Amount */}
              {renderLoadingCard(
                "Capped Amount",
                "Maximum allowed capped amount spending limit for your plan",
              )}
            </>
          ) : (
            <>
              {/* Balance Used */}
              <Card background="bg-surface-info">
                <Box
                  width={CARD_WIDTH}
                  minHeight={CARD_MIN_HEIGHT}
                  padding={CARD_PADDING}
                >
                  <BlockStack gap={CONTENT_GAP}>
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      Balance Used
                    </Text>
                    <Text as="p" tone="subdued">
                      Total amount already utilized from your subscription
                      capped amount
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
                <Box
                  width={CARD_WIDTH}
                  minHeight={CARD_MIN_HEIGHT}
                  padding={CARD_PADDING}
                >
                  <BlockStack gap={CONTENT_GAP}>
                    <Text as="h3" variant="headingLg" fontWeight="bold">
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
            </>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default BalanceCards;

