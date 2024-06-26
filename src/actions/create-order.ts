"use server";
import { auth } from "@/auth";
import { db } from "@/lib/firebase/server";
import { CreateOrder, CreateOrderSchema } from "@/types/order.type";
import { Sku } from "@/types/product.type";
import { validateWithZodSchema } from "@/utils/schemas";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

interface DataDetail {
  quantity: number;
  size: string;
  inseam?: number | undefined;
  skuRef: DocumentReference;
}

export async function createOrder(
  data: CreateOrder
): Promise<{ status: string; message: string; }> {

  try {
    const result = validateWithZodSchema(CreateOrderSchema, data);

    const session = await auth();
    if (!session) {
      throw new Error("認証に失敗しました");
    }

    const filterSkus = result.skus
      .filter((product) => product.id && product.quantity > 0)
      .map((sku, idx) => ({ ...sku, sortNum: idx + 1 }));

    if (filterSkus.length === 0) {
      throw new Error("数量を入力してください");
    }

    const serialRef = db.collection("serialNumbers").doc("orderNumber");
    const orderRef = db.collection("orders").doc();

    await db.runTransaction(async (transaction) => {
      const serialDoc = await transaction.get(serialRef);

      let details: (Sku & DataDetail)[] = [];
      for (const sku of filterSkus) {
        const skusRef = db
          .collectionGroup("skus")
          .where("id", "==", sku.id)
          .orderBy("id", "asc")
          .orderBy("sortNum", "asc");

        const snapShot = await transaction.get(skusRef);
        const skuDoc = snapShot.docs[0].data() as Sku;
        const skuRef = db
          .collection("products")
          .doc(skuDoc.productId)
          .collection("skus")
          .doc(sku.id);

        const data = { ...skuDoc, ...sku, skuRef } as any;
        details.push(data);
      }

      for (const sku of details) {
        transaction.update(sku.skuRef, {
          orderQuantity: FieldValue.increment(sku.quantity)
        });
      }

      const newCount = serialDoc.data()?.count + 1;
      transaction.update(serialRef, {
        count: newCount,
      });

      transaction.set(orderRef, {
        id: orderRef.id,
        orderNumber: newCount,
        section: result.section,
        employeeCode: result.employeeCode,
        initial: result.initial,
        username: result.username,
        position: result.position,
        companyName: result.companyName,
        siteCode: result.siteCode,
        siteName: result.siteName,
        zipCode: result.zipCode,
        address: result.address,
        tel: result.tel,
        applicant: result.applicant,
        memo: result.memo || "",
        status: "pending",
        uid: session.user.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      for (const detail of details) {
        transaction.set(orderRef.collection("orderDetails").doc(), {
          orderId: orderRef.id,
          orderRef: orderRef,
          orderNumber: newCount,
          skuId: detail.id,
          skuRef: detail.skuRef,
          productNumber: detail.productNumber,
          productName: detail.productName,
          salePrice: detail.salePrice || 0,
          costPrice: detail.costPrice || 0,
          size: detail.size,
          orderQuantity: detail.quantity,
          quantity: detail.quantity,
          inseam: detail.inseam ?? null,
          sortNum: detail.sortNum,
          uid: session.user.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

  } catch (e: unknown) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "登録が失敗しました"
    };
  }
  return {
    status: "success",
    message: "登録しました",
  };
}
