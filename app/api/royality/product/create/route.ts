import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { convertCurrency } from "@/lib/config/currency-utils";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    const body = await req.json();
    const {
      designerId,
      productId,
      royality,
      title,
      image,
      status = "active",
      inArchive = "false",
      price = 0,
      shopifyId,
      currency = "",
      storeCurrency = "",
    } = body;

    // 🔹 Basic validation
    if (
      !shop ||
      !productId ||
      !royality ||
      isNaN(royality) ||
      !title ||
      !designerId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid shop, productId, title, Royality, or designerId",
        },
        { status: 400 },
      );
    }

    // 🔹 Validate designerId format
    const designerIdPattern = /^RA\d{9}$/;
    if (!designerIdPattern.test(designerId)) {
      return NextResponse.json(
        {
          error: `Invalid Designer ID format: ${designerId}. Expected format: RA#########`,
        },
        { status: 400 },
      );
    }

    // 🔹 Check if product is already assigned (only active)
    const productAlreadyAssigned = await prisma.productRoyalty.findFirst({
      where: {
        productId,
        inArchive: false, // boolean
      },
    });

    if (productAlreadyAssigned) {
      return NextResponse.json(
        {
          error: `This product is already assigned to designer ${productAlreadyAssigned.designerId}`,
        },
        { status: 400 },
      );
    }

    // 🔹 Check if this designer already has royalty for the product
    const existingRoyalty = await prisma.productRoyalty.findFirst({
      where: { productId, designerId },
    });
    if (existingRoyalty) {
      return NextResponse.json(
        { error: "Royalty already assigned for this product & designer" },
        { status: 400 },
      );
    }

    // 🔹 Convert price to storeCurrency
    let originalAmount = parseFloat(price as any) || 0;
    const fromCurrency = currency || "INR";
    const toCurrency = storeCurrency || "USD";

    let convertedAmount =
      fromCurrency === toCurrency
        ? originalAmount
        : await convertCurrency(originalAmount, fromCurrency, toCurrency);

    convertedAmount = parseFloat(convertedAmount.toFixed(2));

    // 🔹 Convert inArchive string to boolean
    const inArchiveBoolean = inArchive === "true";

    // 🔹 Create product royalty
    const royalty = await prisma.productRoyalty.create({
      data: {
        productId,
        shopifyId: shopifyId || productId,
        title,
        image: image || null,
        status,
        inArchive: inArchiveBoolean, // ✅ now boolean
        designerId,
        royality: parseFloat(royality),
        shop,
        price: {
          amount: convertedAmount,
          currency: toCurrency,
          storeCurrency: fromCurrency,
          storeAmount: originalAmount,
        },
      },
    });

    return NextResponse.json({
      message: "Royalty assigned successfully",
      royalty,
    });
  } catch (err: any) {
    console.error("Error creating royalty:", err);
    return NextResponse.json(
      { error: "Something went wrong while assigning royalty." },
      { status: 500 },
    );
  }
}
