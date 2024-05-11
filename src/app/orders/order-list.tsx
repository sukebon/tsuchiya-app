"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase/client";
import { Order } from "@/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      orderBy("serialNumber", "desc"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, {
      next: (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as Order)
        );
        setOrders(data);
      },
    });
    return () => unsub();
  }, []);

  return (
    <Card className="w-full overflow-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>発注一覧</CardTitle>
          <Button size="sm" asChild>
            <Link href="/orders/new">発注登録</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table className="min-w-[2000px]">
          <TableHeader>
            <TableRow>
              <TableHead>詳細</TableHead>
              <TableHead>発注No.</TableHead>
              <TableHead>所属名</TableHead>
              <TableHead>社員コード</TableHead>
              <TableHead>イニシャル</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>役職</TableHead>
              <TableHead>社名</TableHead>
              <TableHead>工事コード</TableHead>
              <TableHead>現場名 又は組織名</TableHead>
              <TableHead>郵便番号</TableHead>
              <TableHead>住所</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>備考</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Button size="xs" asChild>
                    <Link href={`/orders/${order.id}`}>詳細</Link>
                  </Button>
                </TableCell>
                <TableCell>{order.serialNumber}</TableCell>
                <TableCell>{order.section}</TableCell>
                <TableCell>{order.employeeCode}</TableCell>
                <TableCell>{order.initial}</TableCell>
                <TableCell>{order.username}</TableCell>
                <TableCell>{order.position}</TableCell>
                <TableCell>{order.companyName && " あり"}</TableCell>
                <TableCell>{order.siteCode}</TableCell>
                <TableCell>{order.siteName}</TableCell>
                <TableCell>{order.zipCode}</TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.tel}</TableCell>
                <TableCell>{order.memo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
