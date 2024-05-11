"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreateOrder, Product, Sku } from "@/types";
import { UseFormReturn } from "react-hook-form";

interface Props {
  form: UseFormReturn<CreateOrder, any, undefined>;
  index: number;
  skus: (Sku & Product)[];
}

export default function OrderFormItem({ form, index, skus }: Props) {

  return (
    <div
      className={cn("grid col-span-1 gap-2",
        index + (1 % 2) === 0 ? "md:col-span-7" : "md:col-span-5"
      )}
    >
      <div className="text-xs font-bold">{skus[0]?.displayName}</div>
      <div className="flex md:flex-row gap-2">
        <FormField
          control={form.control}
          defaultValue={""}
          name={`skus.${index}.id`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>サイズ</FormLabel>
              <FormControl>
                <select {...form.register(`skus.${index}.id`)} defaultValue={field.value} className="border rounded-md py-2 px-2 w-[90px] h-10">
                  <option value="">-</option>
                  {skus.map(({ size, id }) => (
                    <option key={size} value={id} >{size}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          defaultValue={0}
          name={`skus.${index}.quantity`}
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>数量</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="数量"
                  className="w-[80px]"
                  min={0}
                  {...field}
                  onChange={(event) => field.onChange(+event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {skus[0]?.isHem && (
          <FormField
            control={form.control}
            defaultValue={skus[0].isHem ? 0 : undefined}
            rules={{ required: true }}
            name={`skus.${index}.hem`}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>裾上げ</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="裾上げ"
                    className="w-[80px]"
                    min={0}
                    {...field}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}
