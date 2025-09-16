"use client";

import React from "react";
import {
  Modal,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Divider,
  List,
  Box,
} from "@shopify/polaris";

interface LineItem {
  productId: string;
  title: string;
  variantId: string;
  variantTitle?: string;
  designerId: string;
  royality: number;
  amount: number;
  quantity: number;
  unitPrice: number;
  royaltyCharges: number;
}

interface Transaction {
  id: string;
  shop: string;
  shopifyTransactionChargeId: string;
  orderId: string;
  productId?: string;
  description: string;
  price: {
    storeprice: number;
    storeCurrency: string;
    usd: number;
  };
  currency: string; // USD
  balanceUsed: number;
  balanceRemaining: number;
  royaltyPercentage: number;
  designerId: string;
  createdAt: string;
  updatedAt: string;
}

interface RoyaltyOrder {
  id: string;
  orderName: string;
  orderId: string;
  currency: string;
  createdAt?: string;
  calculatedRoyaltyAmount: number;
  convertedCurrencyAmountRoyality: number;
  lineItem: LineItem[];
  transactions?: Transaction[];
}

interface OrderModalProps {
  order: RoyaltyOrder;
  storeName: string;
  active: boolean;
  onClose: () => void;
  loading?: boolean;
}

const OrderModal: React.FC<OrderModalProps> = ({
  order,
  storeName,
  active,
  onClose,
  loading = false,
}) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const renderCurrencyBadge = (currency: string) => (
    <Badge tone={currency === "USD" ? "success" : "warning"}>{currency}</Badge>
  );
  const transactions = order.transactions || [];

  const renderProductRow = (product: LineItem) => (
    <Box paddingBlock="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingMd">
          {product.title || "Unknown Product"}
        </Text>
      </InlineStack>

      <Box paddingBlockStart="100">
        <InlineStack gap="400">
          <Text as="span" tone="subdued">
            Qty: {product.quantity}
          </Text>
          {product.variantTitle && (
            <Text as="span" tone="subdued">
              Variant: {product.variantTitle}
            </Text>
          )}
          <Text as="span" tone="subdued">
            Unit Price: {product.unitPrice.toFixed(2)} {order.currency}
          </Text>

          {/* // Uncomment if you want original currency info */}
          {/* <Text as="span" tone="subdued">
            Original Price: {product.amount.toFixed(2)} {product.currency}
          </Text>
          */}
        </InlineStack>
      </Box>
    </Box>
  );

  const renderTransactionRow = (tx: Transaction) => (
    <Box paddingBlock="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" fontWeight="medium">
          Charge ID: {tx.shopifyTransactionChargeId}
        </Text>
        <Text as="h2" fontWeight="bold">
          Royalty Price : {tx.price.storeprice.toFixed(2)}{" "}
          {tx.price.storeCurrency}
        </Text>
        {/* <Text as="h2">
          Royalty Price (USD): {tx.price.usd.toFixed(2)} {tx.currency}
        </Text> */}

        <Text as="h2">
          Royalty %:{" "}
          {typeof tx.royaltyPercentage === "number"
            ? `${tx.royaltyPercentage.toFixed(2)}`
            : "-"}
        </Text>
        {/*
        // Uncomment if you want balance info
        <Text as="h2">
          Balance Used: {tx.balanceUsed.toFixed(2)} {tx.currency}
        </Text>
        <Text as="h2">
          Balance Remaining: {tx.balanceRemaining.toFixed(2)} {tx.currency}
        </Text>
        */}
      </InlineStack>
      {tx.description && (
        <Text as="span" tone="subdued">
          Description: {tx.description}
        </Text>
      )}
    </Box>
  );

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={`Order ${order.orderName}`}
      primaryAction={{ content: "Close", onAction: onClose }}
      secondaryActions={[
        {
          content: "View in Shopify",
          onAction: () => {
            window.open(
              `https://admin.shopify.com/store/${storeName}/orders/${order.orderId}`,
              "_blank",
            );
          },
        },
      ]}
      size="large"
    >
      <BlockStack gap="400">
        {/* Order Summary */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingLg">
                Order Summary
              </Text>
              {renderCurrencyBadge(order.currency)}
            </InlineStack>

            <Divider />

            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Order Date
              </Text>
              <Text as="span" fontWeight="medium">
                {order.createdAt ? formatDate(order.createdAt) : "-"}
              </Text>
            </InlineStack>

            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Order ID
              </Text>
              <Text as="span" fontWeight="medium">
                {order.orderId}
              </Text>
            </InlineStack>

            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Total Royalty Amount
              </Text>
              <Text as="span" fontWeight="bold" variant="headingMd">
                {order.calculatedRoyaltyAmount.toFixed(2)} {order.currency}
              </Text>
            </InlineStack>

            {/*
            // Commented out converted currency
            <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Converted Royalty (USD)
              </Text>
              <Text as="span" fontWeight="bold" variant="headingMd">
                ${order.convertedCurrencyAmountRoyality.toFixed(2)}
              </Text>
            </InlineStack>
            */}
          </BlockStack>
        </Card>

        {/* Products */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingLg">
              Products ({order.lineItem?.length || 0})
            </Text>
            <Divider />
            {order.lineItem?.length > 0 ? (
              <List>
                {order.lineItem.map((product, index) => (
                  <List.Item key={index}>
                    {renderProductRow(product)}
                    {index < order.lineItem.length - 1 && <Divider />}
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text as="p" tone="subdued">
                No products found
              </Text>
            )}
          </BlockStack>
        </Card>

        {/* Transactions */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingLg">
              Transactions ({order.transactions?.length || 0})
            </Text>
            <Divider />

            {transactions.length > 0 ? (
              <List>
                {transactions.map((tx, idx) => (
                  <List.Item key={tx.id}>
                    {renderTransactionRow(tx)}
                    {idx < transactions.length - 1 && <Divider />}
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text as="p" tone="subdued">
                No transactions found
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Modal>
  );
};

export default OrderModal;
