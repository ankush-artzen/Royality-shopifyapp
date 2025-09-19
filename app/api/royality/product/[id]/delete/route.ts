import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID in URL" },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await req.json();
    if (typeof body.inArchive !== "boolean") {
      return NextResponse.json(
        { error: "`inArchive` must be a boolean" },
        { status: 400 },
      );
    }

    // Update royalty record
    const updatedRoyalty = await prisma.productRoyalty.updateMany({
      where: {
        shopifyId: id,
        shop,
      },
      data: {
        inArchive: body.inArchive,
        status: body.inArchive ? "archived" : "active",
      },
    });
    

    return NextResponse.json({
      message: "Royalty status updated",
      royalty: updatedRoyalty,
    });
  } catch (error: any) {
    console.error("Error toggling royalty:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
