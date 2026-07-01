"ue client";

import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Files, FileWarningIcon, MoveRight, Send } from "lucide-react";

export default function DamagePage() {
  return (
    <div className="flex items-center justify-center">
      <form className="flex w-full max-w-lg">
        <FieldGroup>
          <div className="flex gap-4">
            <Field>
              <FieldLabel htmlFor="barcode">Barcode</FieldLabel>

              <InputGroup>
                <InputGroupInput id="barcode" value={233344343} readOnly />
                <InputGroupAddon align="inline-end">
                  <Files />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <InputGroup>
                <InputGroupInput id="name" value={"Nothing"} readOnly />
                <InputGroupAddon align="inline-end">
                  <Files />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
          <div className="flex gap-4">
            <Field>
              <FieldLabel htmlFor="category">Catagory</FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id="category"
                  value={"Have something"}
                  readOnly
                />
                <InputGroupAddon align="inline-end">
                  <Files />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="price">Price</FieldLabel>
              <InputGroup>
                <InputGroupInput id="price" value={43} readOnly />
                <InputGroupAddon align="inline-end">
                  <Files />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="discreption">Description</FieldLabel>
            <InputGroup className="h-40">
              <InputGroupTextarea
                id="discreption"
                placeholder="Provide details about the damage..."
              />
            </InputGroup>
          </Field>

          <div className="flex gap-4">
            <Field>
              <FieldLabel htmlFor="quantity">Damage Quantity</FieldLabel>
              <InputGroup>
                <InputGroupInput id="quantity" />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="addedby">Added By</FieldLabel>
              <InputGroup>
                <InputGroupInput id="addedby" value={"You Know?"} readOnly />
                <InputGroupAddon align="inline-end">
                  <Files />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="images">Image</FieldLabel>
            <label
              htmlFor="images"
              className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md cursor-pointer"
            >
              <span className="text-gray-500">
                Click here to choose an image
              </span>

              <InputGroupInput
                id="images"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </label>
          </Field>

          <Card className="rounded-xl border bg-black text-white dark:bg-white dark:text-black hover:border-primary transition-all cursor-pointer">
            <CardContent className="flex w-full px-8 sm:w-sm md:w-md flex-col items-center justify-center gap-2">
              <div className="flex gap-1">
                <Send />
                <p className="text-lg font-medium">Submit Your Report</p>
              </div>
            </CardContent>
          </Card>
        </FieldGroup>
      </form>
    </div>
  );
}
