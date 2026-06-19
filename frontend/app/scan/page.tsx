"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { ScanService } from "@/service/scan.service";
import { createScanDto } from "@/types/scan";

const BarScanner = dynamic(() => import("@/components/BarScanner"), {
  ssr: false,
});

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");

  const { getToken, isSignedIn } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<createScanDto>();

  const onSubmit = async (data: createScanDto) => {
    try {
      if (!isSignedIn) {
        alert("Please sign in first");
        return;
      }

      const token = await getToken();

      if (!token) {
        alert("Unable to get authentication token");
        return;
      }

      const payload: createScanDto = {
        barcode,
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
        addedby: data.addedby,
      };

      console.log("TOKEN:", token);

      const result = await ScanService.create(payload, token);

      console.log("Created:", result);

      alert("Product saved successfully");

      reset();
      setBarcode("");
    } catch (error) {
      console.error(error);
      alert("Failed to save product");
    }
  };

  return (
    <div className="p-6">
      <BarScanner onScan={setBarcode} />

      {!barcode ? (
        <p className="mt-4">Scan a barcode...</p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4 max-w-md"
        >
          <div>
            <label className="block mb-1">Barcode</label>

            <div className="flex gap-2">
              <input value={barcode} readOnly />

              <button
                type="button"
                className="border rounded px-3"
                onClick={() => navigator.clipboard.writeText(barcode)}
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label>Product Name</label>

            <input
              {...register("name", {
                required: "Product name is required",
              })}
            />

            {errors.name && (
              <p className="text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label>Price</label>

            <input
              type="number"
              {...register("price", {
                required: "Price is required",
                valueAsNumber: true,
              })}
            />

            {errors.price && (
              <p className="text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label>Quantity</label>

            <input
              type="number"
              {...register("quantity", {
                required: "Quantity is required",
                valueAsNumber: true,
              })}
            />

            {errors.quantity && (
              <p className="text-red-500">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label>Description</label>

            <textarea rows={4} {...register("description")} />
          </div>

          <div>
            <label>Added By</label>

            <input
              {...register("addedby", {
                required: "Added By is required",
              })}
            />

            {errors.addedby && (
              <p className="text-red-500">{errors.addedby.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </form>
      )}
    </div>
  );
}
