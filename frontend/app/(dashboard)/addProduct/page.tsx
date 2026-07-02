"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@clerk/nextjs";
import { ScanService } from "@/service/scan.service";
import { createScanDto } from "@/types/scan";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Files, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

const BarScanner = dynamic(() => import("@/components/BarScanner"), {
  ssr: false,
});

export default function AddProductPage() {
  const [barcode, setBarcode] = useState("");

  const { getToken, isSignedIn } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<createScanDto>();

  const onSubmit = async (data: createScanDto) => {
    console.log("Submitted!", data);
    try {
      if (!isSignedIn) {
        alert("Please sign in first");
        return;
      }

      const token = await getToken();

      if (!token) {
        toast.error("Unable to get authentication token");
        return;
      }

      const payload: createScanDto = {
        barcode,
        name: data.name,
        bprice: data.bprice,
        sprice: data.sprice,
        quantity: data.quantity,
        category: data.category,
        description: data.description,
        addedby: data.addedby,
      };

      console.log("TOKEN:", token);

      const result = await ScanService.create(payload, token);

      console.log("Created:", result);

      toast.success("Product saved successfully");

      reset();
      setBarcode("");
    } catch (error) {
      if (error instanceof ApiError) {
        console.log("Status:", error.status);
        console.log("Response:", error.data);

        toast.error(
          typeof error.data === "object"
            ? JSON.stringify(error.data)
            : error.message,
        );
      } else {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 flex items-center justify-center ">
      {!barcode ? (
        <div className="flex items-center justify-center w-full flex-col">
          <BarScanner onScan={setBarcode} />
          <p className="mt-4">Scan a barcode for add Product</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4 max-w-md"
        >
          <FieldGroup>
            <div className="flex flex-col md:flex-row gap-4 ">
              <Field>
                <FieldLabel htmlFor="barcode">Barcode</FieldLabel>

                <InputGroup>
                  <InputGroupInput id="barcode" value={barcode} readOnly />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await navigator.clipboard.writeText(barcode);
                        toast.success("Barcode copied");
                      }}
                    >
                      <Files className="size-4" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    type="text"
                    id="name"
                    placeholder="Enter product name"
                    {...register("name", {
                      required: "Product name is required",
                    })}
                  />
                </InputGroup>

                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </Field>
            </div>
            <div className="flex flex-col md:flex-row gap-4 ">
              <Field>
                <FieldLabel htmlFor="bprice">Buying Price</FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    type="number"
                    id="bprice"
                    placeholder="Enter buying price"
                    {...register("bprice", {
                      required: "Product Buying Price is required",
                      valueAsNumber: true,
                    })}
                  />
                </InputGroup>

                {errors.bprice && (
                  <p className="text-sm text-red-500">
                    {errors.bprice.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="selling">Selling Price</FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    id="selling"
                    type="number"
                    placeholder="Enter selling price"
                    {...register("sprice", {
                      required: "Product selling price is required",
                      valueAsNumber: true,
                    })}
                  />
                </InputGroup>

                {errors.sprice && (
                  <p className="text-sm text-red-500">
                    {errors.sprice.message}
                  </p>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="discreption">Description</FieldLabel>
              <InputGroup className="h-40">
                <InputGroupTextarea
                  id="discreption"
                  placeholder="Provide details about this product..."
                  {...register("description")}
                />
              </InputGroup>
            </Field>{" "}
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="addedby">Category</FieldLabel>

            <InputGroup>
              <InputGroupInput
                id="category"
                type="text"
                placeholder="Enter product category"
                {...register("category", {
                  required: "Product category is required",
                })}
              />
            </InputGroup>

            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </Field>

          <div className="flex flex-col md:flex-row gap-4 ">
            <Field>
              <FieldLabel htmlFor="quantity">Quantity</FieldLabel>

              <InputGroup>
                <InputGroupInput
                  type="number"
                  id="quantity"
                  placeholder="Enter quantity"
                  {...register("quantity", {
                    required: "Product quantity is required",
                    valueAsNumber: true,
                  })}
                />
              </InputGroup>

              {errors.quantity && (
                <p className="text-sm text-red-500">
                  {errors.quantity.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="addedby">Added By</FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id="selling"
                  type="text"
                  placeholder="Enter added by"
                  {...register("addedby", {
                    required: "Please enter who added this item",
                  })}
                />
              </InputGroup>

              {errors.addedby && (
                <p className="text-sm text-red-500">{errors.addedby.message}</p>
              )}
            </Field>
          </div>

          <Button className="h-12" type="submit" disabled={isSubmitting}>
            <Send />
            {isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </form>
      )}
    </div>
  );
}
