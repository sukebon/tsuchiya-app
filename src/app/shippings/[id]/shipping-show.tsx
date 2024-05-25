"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import paths from "@/paths";
import Status from "@/components/status";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Loading from "@/app/loading";
import ShippingShowTable from "./shipping-show-table";
import ShippingInvoiceModal from "./shipping-invoice-modal";
import Link from "next/link";
import { useStore } from "@/store";
import { Shipping, ShippingDetail } from "@/types/shipping.type";
import ShippingEditModal from "./shipping-edit-modal";

interface Props {
  id: string;
}

export default function ShippingShow({ id }: Props) {
  const router = useRouter();
  const [shipping, setShipping] = useState<Shipping>();
  const [shippingDetails, setShippingDetails] = useState<ShippingDetail[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const shippingStatusSearch = useStore((state) => state.shippingStatusSearch);

  useEffect(() => {
    const shippingRef = doc(db, "shippings", id);
    const unsub = onSnapshot(shippingRef, {
      next: (snapshot) => {
        if (!snapshot.exists()) return;
        setShipping({ ...snapshot.data() } as Shipping);
      },
      error: (e) => {
        console.error(e);
      },
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const shippingDetailRef = collection(
      db,
      "shippings",
      id,
      "shippingDetails"
    );
    const q = query(shippingDetailRef, orderBy("sortNum", "asc"));
    const unsub = onSnapshot(q, {
      next: (snapshot) => {
        setShippingDetails(
          snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id } as ShippingDetail)
          )
        );
      },
      error: (e) => {
        console.error(e.message);
      },
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!shipping?.shippingNumber) return;
    const status =
      shippingStatusSearch === "all"
        ? ["picking", "finished"]
        : [shippingStatusSearch];
    const ordersRef = collection(db, "shippings");
    const q = query(
      ordersRef,
      orderBy("shippingNumber", "asc"),
      where("status", "!=", "canceled"),
      where("status", "in", status),
      startAfter(shipping?.shippingNumber),
      limit(1)
    );
    const unsub = onSnapshot(q, {
      next: (snapshot) => {
        snapshot.docs.at(0)?.exists()
          ? setNextPage(snapshot.docs[0].data().id)
          : setNextPage(null);
      },
      error: (e) => {
        console.error(e);
      },
    });
    return () => unsub();
  }, [shipping?.shippingNumber, shippingStatusSearch]);

  useEffect(() => {
    if (!shipping?.shippingNumber) return;
    const status =
      shippingStatusSearch === "all"
        ? ["picking", "finished"]
        : [shippingStatusSearch];
    const ordersRef = collection(db, "shippings");
    const q = query(
      ordersRef,
      orderBy("shippingNumber", "desc"),
      where("status", "!=", "canceled"),
      where("status", "in", status),
      startAfter(shipping?.shippingNumber),
      limit(1)
    );
    const unsub = onSnapshot(q, {
      next: (snapshot) => {
        snapshot.docs.at(0)?.exists()
          ? setPrevPage(snapshot.docs[0].data().id)
          : setPrevPage(null);
      },
      error: (e) => {
        console.error(e);
      },
    });
    return () => unsub();
  }, [shipping?.shippingNumber, shippingStatusSearch]);

  const getCourierName = (courier: string) => {
    switch (courier) {
      case "seino":
        return "西濃運輸";
      case "sagawa":
        return "佐川急便";
      case "fukuyama":
        return "福山通運";
    }
  };

  if (!shipping) return <Loading />;

  return (
    <Card className="w-full md:w-[1200px] overflow-auto">
      <CardHeader>
        <div className="flex justify-between mb-4">
          <ArrowLeft
            className="cursor-pointer"
            onClick={() => router.push(paths.shippingAll())}
          />
          <span className="flex items-center gap-3 ml-auto">
            <ShippingInvoiceModal
              shippingId={id}
              trackingNumber={shipping.trackingNumber}
              courier={shipping.courier}
            />
            {shipping.status !== "finished" && (
              <ShippingEditModal
                shipping={shipping}
                shippingDetails={shippingDetails}
              />
            )}
            <ChevronLeft
              className={cn("cursor-pointer", !prevPage && "opacity-35")}
              onClick={() =>
                prevPage && router.push(paths.shippingShow(prevPage))
              }
            />
            <ChevronRight
              className={cn("cursor-pointer", !nextPage && "opacity-35")}
              onClick={() =>
                nextPage && router.push(paths.shippingShow(nextPage))
              }
            />
          </span>
        </div>
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            出荷詳細
            <span className="flex items-center">
              <Status value={shipping.status} />
            </span>
          </div>
          <div className="text-base">
            {format(new Date(shipping.createdAt.toDate()), "yyyy-MM-dd")}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 mb-5">
          <div>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>出荷No.</dt>
              <dd>{shipping.shippingNumber}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>送状No.</dt>
              <dd>{shipping.trackingNumber}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>運送便</dt>
              <dd>
                <Link href={``}>{getCourierName(shipping.courier)}</Link>
              </dd>
            </dl>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>発注No.</dt>
              <dd>{shipping.orderNumber}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>所属名</dt>
              <dd>{shipping.section}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>社員コード</dt>
              <dd>{shipping.employeeCode}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>イニシャル</dt>
              <dd>{shipping.initial}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>会社刺繍</dt>
              <dd>{shipping.companyName ? "あり" : "-"}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>氏名</dt>
              <dd>{shipping.username}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>役職</dt>
              <dd>{shipping.position}</dd>
            </dl>
          </div>
          <div>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>工事コード</dt>
              <dd>{shipping.siteCode}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>現場名</dt>
              <dd>{shipping.siteName}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>郵便番号</dt>
              <dd>{shipping.zipCode}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>住所</dt>
              <dd>{shipping.address}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>TEL</dt>
              <dd>{shipping.tel}</dd>
            </dl>
            <dl className={cn(dlStyles)}>
              <dt className={cn(dtStyles)}>申請者</dt>
              <dd>{shipping.applicant}</dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <ShippingShowTable shippingDetails={shippingDetails} />
          {/* <OrderShowTable shippingDetails={shippingDetails} /> */}
        </div>
      </CardContent>
    </Card>
  );
}

const dlStyles = "grid grid-cols-[100px_1fr] text-sm leading-7 px-4";
const dtStyles = "text-zinc-500 font-bold";
