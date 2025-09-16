// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db/prisma-connect";

// export async function PUT(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = params;
//     const { searchParams } = new URL(req.url);
//     const shop = searchParams.get("shop");

//     if (!shop) {
//       return NextResponse.json(
//         { error: "Missing shop parameter" },
//         { status: 400 }
//       );
//     }

//     if (!id) {
//       return NextResponse.json(
//         { error: "Missing product ID in URL" },
//         { status: 400 }
//       );
//     }

//     const body = await req.json();
//     const { designerId, Royality } = body;

//     if (Royality !== undefined && isNaN(Royality)) {
//       return NextResponse.json(
//         { error: "Invalid Royality value" },
//         { status: 400 }
//       );
//     }

//     // Find the royalty record directly by raw Shopify product ID
//     const royalty = await prisma.productRoyalty.findFirst({
//       where: { shopifyId: id, shop },
//     });

//     if (!royalty) {
//       return NextResponse.json(
//         { error: "No royalty found for this product" },
//         { status: 404 }
//       );
//     }

//     // Update royalty
//     const updatedRoyalty = await prisma.productRoyalty.update({
//       where: { id: royalty.id },
//       data: {
//         ...(designerId && { designerId }),
//         ...(Royality !== undefined && { Royality: parseFloat(Royality) }),
//       },
//     });

//     return NextResponse.json({
//       message: "Royalty updated successfully",
//       royalty: updatedRoyalty,
//     });
//   } catch (error: any) {
//     console.error("Error updating royalty:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import {
  ROYALTY,
  ERROR_MESSAGES_edit,
  SUCCESS_MESSAGES,
} from "@/lib/constants/constants";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    // ✅ Validate required query params
    if (!shop) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.MISSING_SHOP },
        { status: 400 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.MISSING_PRODUCT_ID },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { designerId, Royality } = body;

    // ✅ Validate Royality if provided
    if (Royality !== undefined) {
      const numericRoyalty = parseFloat(Royality);
      if (
        isNaN(numericRoyalty) ||
        numericRoyalty < ROYALTY.MIN ||
        numericRoyalty > ROYALTY.MAX
      ) {
        return NextResponse.json(
          { error: ERROR_MESSAGES_edit.INVALID_ROYALTY },
          { status: 400 },
        );
      }
    }

    // ✅ Find royalty record
    const royalty = await prisma.productRoyalty.findFirst({
      where: { shopifyId: id, shop },
    });

    if (!royalty) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.ROYALTY_NOT_FOUND },
        { status: 404 },
      );
    }

    // ✅ Update royalty
    const updatedRoyalty = await prisma.productRoyalty.update({
      where: { id: royalty.id },
      data: {
        ...(designerId && { designerId }),
        ...(Royality !== undefined && { royality: parseFloat(Royality) }),
      },
    });

    return NextResponse.json({
      message: SUCCESS_MESSAGES.ROYALTY_UPDATED,
      royalty: updatedRoyalty,
    });
  } catch (error: any) {
    console.error("❌ Error updating royalty:", error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES_edit.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
}
