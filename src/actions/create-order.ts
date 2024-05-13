"use server";
import { auth } from "@/auth";
import { db } from "@/lib/firebase/server";
import { CreateOrder, CreateOrderSchema, OrderDetail } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export async function createOrder(
  data: CreateOrder
): Promise<string | undefined> {
  const result = CreateOrderSchema.safeParse({
    section: data.section,
    employeeCode: data.employeeCode,
    initial: data.initial,
    username: data.username,
    companyName: data.companyName,
    position: data.position,
    skus: data.skus,
    siteCode: data.siteCode,
    siteName: data.siteName,
    zipCode: data.zipCode,
    address: data.address,
    tel: data.tel,
    nemo: data.memo || ""
  });

  if (!result.success) {
    console.log(result.error.formErrors);
    return "error";
  }

  const session = await auth();
  if (!session) {
    console.log("no session");
    return "error";
  }

  const filterSkus = result.data.skus.filter(
    product => product.id && product.quantity >= 0
  ).map((sku, idx) => ({ ...sku, sortNum: idx + 1 }));

  const serialRef = db.collection("serialNumbers").doc("orderNumber");
  const orderRef = db.collection("orders").doc();

  await db.runTransaction(async (transaction) => {
    const [serialDoc, orderDoc] = await Promise.all([
      serialRef.get(),
      orderRef.get(),
    ]);

    let details: OrderDetail[] = [];
    let skuItems = [];
    for (const sku of filterSkus) {
      const collRef = db
        .collectionGroup("skus")
        .where("id", "==", sku.id)
        .orderBy("id", "asc")
        .orderBy("sortNum", "asc");

      const snapShot = await transaction.get(collRef);
      const skuDoc = snapShot.docs[0].data();
      const skuRef = db.collection("products").doc(skuDoc.parentId).collection("skus").doc(sku.id);
      const data = { ...snapShot.docs[0]?.data(), ...sku, skuRef } as any;
      skuItems.push({
        ref: skuRef,
        doc: skuDoc,
        sku
      });
      details.push(data);
    }

    for (const { ref, doc, sku } of skuItems) {
      transaction.update(ref, {
        orderQuantity: await doc.orderQuantity + sku.quantity
      });
    }

    const newCount = serialDoc.data()?.count + 1;
    transaction.update(serialRef, {
      count: newCount,
    });

    transaction.set(orderRef, {
      id: orderRef.id,
      serialNumber: newCount,
      section: result.data.section,
      employeeCode: result.data.employeeCode,
      initial: result.data.initial,
      username: result.data.username,
      position: result.data.position,
      siteCode: result.data.siteCode,
      siteName: result.data.siteName,
      zipCode: result.data.zipCode,
      address: result.data.address,
      tel: result.data.tel,
      memo: result.data.memo || "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    for (const detail of details) {
      transaction.set(orderRef.collection("orderDetails").doc(), {
        orderId: orderRef.id,
        serialNumber: newCount,
        skuId: detail.id,
        skuRef: detail.skuRef,
        productNumber: detail.productNumber,
        productName: detail.productName,
        salePrice: detail.salePrice || 0,
        costPrice: detail.costPrice || 0,
        size: detail.size,
        orderQuantity: detail.quantity,
        quantity: detail.quantity,
        inseam: detail.inseam || null,
        sortNum: detail.sortNum,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  }).catch((e) => {
    console.error(e);
  });

  return;
}
