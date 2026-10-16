"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createLeadSchema,
  type CreateLeadInput,
} from "@/lib/validations/leads";
import { ApiError, useLeadMutations } from "@/hooks/use-leads";
export function CreateLeadDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { create } = useLeadMutations();
  const form = useForm<
    CreateLeadInput,
    unknown,
    ReturnType<typeof createLeadSchema.parse>
  >({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { name: "", company: "", phone: "" },
  });
  async function submit(input: ReturnType<typeof createLeadSchema.parse>) {
    try {
      await create.mutateAsync({
        name: input.name,
        company: input.company ?? "",
        phone: input.phone ?? "",
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.fields)
        for (const field of ["name", "company", "phone"] as const)
          if (error.fields[field])
            form.setError(field, { message: error.fields[field][0] });
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!create.isPending) {
          onOpenChange(value);
          if (!value) form.reset();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus size={21} />
        </div>
        <DialogTitle className="text-xl font-semibold tracking-tight">
          A new connection starts here.
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          Add a lead and turn your next conversation into an opportunity.
        </DialogDescription>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="mt-7 space-y-5"
          noValidate
        >
          {(
            [
              {
                name: "name",
                label: "Full name",
                placeholder: "e.g. Ananya Sharma",
                required: true,
              },
              {
                name: "company",
                label: "Company",
                placeholder: "e.g. Acme Studio",
              },
              {
                name: "phone",
                label: "Phone number",
                placeholder: "+91 98765 43210",
              },
            ] as const
          ).map((field) => (
            <div key={field.name}>
              <label htmlFor={`lead-${field.name}`} className="field-label">
                {field.label}{" "}
                {"required" in field ? (
                  <span className="text-primary">*</span>
                ) : (
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                )}
              </label>
              <input
                id={`lead-${field.name}`}
                {...form.register(field.name)}
                className="input"
                placeholder={field.placeholder}
                type={field.name === "phone" ? "tel" : "text"}
                maxLength={
                  field.name === "name"
                    ? 120
                    : field.name === "company"
                      ? 160
                      : 40
                }
                aria-invalid={!!form.formState.errors[field.name]}
                aria-describedby={
                  form.formState.errors[field.name]
                    ? `${field.name}-error`
                    : undefined
                }
              />
              <p id={`${field.name}-error`} className="field-error">
                {form.formState.errors[field.name]?.message}
              </p>
            </div>
          ))}
          {create.isError && (
            <p role="alert" className="field-error">
              {create.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button disabled={create.isPending}>
              {create.isPending && (
                <Loader2 size={15} className="animate-spin" />
              )}
              Create lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
