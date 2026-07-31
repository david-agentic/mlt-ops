"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TeamWorkload({
  finance,
  shipping,
  admin,
}: {
  finance: number;
  shipping: number;
  admin: number;
}) {
  const max = Math.max(finance, shipping, admin, 1);
  const rows = [
    { label: "Finance", value: finance },
    { label: "Shipping", value: shipping },
    { label: "Admin", value: admin },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Today's Team Load</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground">{row.value} open</span>
            </div>
            <Progress value={(row.value / max) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
