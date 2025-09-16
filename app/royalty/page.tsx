"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Page,
  Text,
  Thumbnail,
  Badge,
  Button,
  Tooltip,
  Frame,
  Toast,
  InlineStack,
} from "@shopify/polaris";
import { EditIcon, DeleteIcon, ViewIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";
import EditRoyaltyModal from "../components/editroyality";
import DeleteConfirmationModal from "../components/dialog";
import Pagination from "../components/Pagination";
import CustomDataTable from "../components/CustomDataTable";

interface Royalty {
  id: string;
  productId: string;
  shopifyId: string;
  title: string;
  image?: string | null;
  status?: string | null;
  designerId: string;
  Royality: number;
  shop?: string | null;
  price?: {
    amount: number; // store currency amount
    currency: string; // store currency
    storeCurrency: string; // original currency
    storeAmount: number; // original amount
  } | null;
}

interface ApiResponse {
  royalties: Royalty[];
  count: number;
  page: number;
  totalPages: number;
}

export default function RoyaltiesPage() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState<string | null>(null);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 8;
  const [totalPages, setTotalPages] = useState(1);

  const [activeEdit, setActiveEdit] = useState<Royalty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Royalty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  const showToast = (message: string, error: boolean = false) => {
    setToastMessage(message);
    setToastError(error);
  };

  useEffect(() => {
    const shopFromConfig = app?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info. Please reload the app.");
  }, [app]);

  const fetchRoyalties = useCallback(
    async (pageNumber: number = 1) => {
      if (!shop) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/royality?shop=${shop}&page=${pageNumber}&limit=${limit}`,
        );
        if (!res.ok) throw new Error("Failed to fetch royalties");

        const data: ApiResponse = await res.json();
        setRoyalties(data.royalties || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Something went wrong",
          true,
        );
      } finally {
        setLoading(false);
      }
    },
    [shop, limit],
  );

  useEffect(() => {
    if (shop) fetchRoyalties(page);
  }, [shop, page, fetchRoyalties]);

  const handleDelete = async () => {
    if (!shop || !deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(
        `/api/royality/product/${deleteTarget.shopifyId}/delete?shop=${shop}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete royalty");
      }
      await fetchRoyalties(page);
      showToast("Royalty deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        true,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdate = async (shopifyId: string, newRoyality: number) => {
    if (!shop || !shopifyId) return;
    try {
      const res = await fetch(
        `/api/royality/product/${shopifyId}/edit?shop=${shop}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Royality: newRoyality }),
        },
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update royalty");
      }
      await fetchRoyalties(page);
      setActiveEdit(null);
      showToast("Royalty updated successfully");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        true,
      );
    }
  };

  const defaultImage =
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

  // ✅ Build DataTable rows
  const rows = royalties.map((royalty) => [
    <InlineStack key={`product-${royalty.id}`} gap="200" blockAlign="center">
      <Thumbnail source={royalty.image || defaultImage} alt={royalty.title} />
      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 200,
        }}
        title={royalty.title}
      >
        {royalty.title}
      </div>
    </InlineStack>,
  
    <Badge key={`royalty-${royalty.id}`} tone="success">
      {`${royalty.Royality ?? 0}%`}
    </Badge>,
  
    <Text key={`price-${royalty.id}`} as="h2">
      {royalty.price ? (
        <>
          {/* Show only store currency amount */}
          {royalty.price.storeAmount.toFixed(2)} {royalty.price.storeCurrency}
  
          {/*
          {royalty.price.amount.toFixed(2)} {royalty.price.currency}{" "}
          <Text as="span" tone="subdued">
            ({royalty.price.storeAmount.toFixed(2)} {royalty.price.storeCurrency})
          </Text>
          */}
        </>
      ) : (
        "—"
      )}
    </Text>,
  
    <InlineStack key={`actions-${royalty.id}`} align="start" gap="400">
      <Tooltip content="Edit Royalty">
        <Button
          size="slim"
          icon={EditIcon}
          onClick={() => setActiveEdit(royalty)}
        />
      </Tooltip>
      <Tooltip content="Delete Royalty">
        <Button
          size="slim"
          tone="critical"
          icon={DeleteIcon}
          onClick={() => setDeleteTarget(royalty)}
        />
      </Tooltip>
      <Tooltip content="View Product in Shopify Admin">
        <Button
          size="slim"
          icon={ViewIcon}
          onClick={() => {
            if (!shop) return;
            const storeHandle = shop.replace(".myshopify.com", "");
            const shopifyAdminUrl = `https://admin.shopify.com/store/${storeHandle}/products/${royalty.shopifyId}`;
            window.open(shopifyAdminUrl, "_blank");
          }}
        />
      </Tooltip>
    </InlineStack>,
  ]);
  

  return (
    <Frame>
      <Page
        title="Product Royalties"
        backAction={{ content: "Back", onAction: () => router.back() }}
        primaryAction={{
          content: "Create Royalty Products",
          onAction: () => router.push("/royalty/create"),
        }}
      >
        <CustomDataTable
          columns={["Product", "Royalty %", "Price", "Actions"]}
          rows={rows}
          loading={loading}
          error={error}
          emptyStateMessage="No royalties products assigned yet"
        />

        {activeEdit && (
          <EditRoyaltyModal
            open
            royalty={activeEdit}
            onClose={() => setActiveEdit(null)}
            onUpdate={handleUpdate}
          />
        )}

        {deleteTarget && (
          <DeleteConfirmationModal
            open
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
            title="Delete Royalty?"
            message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
          />
        )}

        {toastMessage && (
          <Toast
            content={toastMessage}
            error={toastError}
            onDismiss={() => setToastMessage(null)}
          />
        )}

        {!loading && !error && royalties.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          />
        )}
      </Page>
    </Frame>
  );
}
