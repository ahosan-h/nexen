"use client";
interface product_details {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}
import ProductCrad from "@/components/card";
import SyncUser from "@/components/SyncUser";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Productpage() {
  const { isLoaded, token, isSignedIn } = SyncUser();
  const [productlist, setProductlist] = useState<product_details[]>([]);

  useEffect(() => {
    if (!isLoaded || !token) {
      return;
    }
    async function fetchproduct() {
      try {
        const getdata = await fetch(
          "http://localhost:3433/nexen/scan/products",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await getdata.json();

        setProductlist(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchproduct();
  }, [token, isLoaded]);
  if (!isLoaded) {
    return <p> token is loading </p>;
  }
  if (!isSignedIn) {
    return <p> you are not signed in</p>;
  }
  return productlist.map((ele) => (
    <div key={ele._id} className="flex g-2 px-2 py-4">
      <ProductCrad title={ele.name} price={ele.price} quantity={ele.quantity} />
    <UserButton/>
    </div>
  ));
}
