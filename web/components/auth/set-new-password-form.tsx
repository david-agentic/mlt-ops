"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z
  .object({
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export function SetNewPasswordForm({
  token,
  action,
  submitLabel,
  successHeading,
  successBody,
}: {
  token: string;
  action: (token: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  submitLabel: string;
  successHeading: string;
  successBody: string;
}) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  function onValid(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await action(token, values.password);
      if (result.error) {
        setFormError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card>
        <CardContent className="pt-6">
          {done ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-sm font-medium">{successHeading}</p>
              <p className="text-sm text-muted-foreground">{successBody}</p>
              <Button className="mt-2 w-full" render={<Link href="/login">Sign in</Link>} />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" disabled={pending} className="mt-2 w-full">
                {pending && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
