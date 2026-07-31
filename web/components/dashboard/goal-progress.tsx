"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Loader2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setDailyShippingGoal } from "@/lib/actions/settings";

export function GoalProgress({ goal, shippedToday }: { goal: number; shippedToday: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal));
  const [pending, startTransition] = useTransition();

  const percent = Math.min(100, Math.round((shippedToday / goal) * 100));

  function save() {
    const num = Number(value);
    startTransition(async () => {
      try {
        await setDailyShippingGoal(num);
        toast.success("Goal updated.");
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Target className="size-4" /> Today's Goal
        </CardTitle>
        {!editing && (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-24"
            />
            <Button size="sm" disabled={pending} onClick={save}>
              {pending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        ) : (
          <p className="text-sm">
            Ship <strong>{goal}</strong> orders today
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {shippedToday} / {goal}
          </span>
        </div>
        <Progress value={percent} />
      </CardContent>
    </Card>
  );
}
