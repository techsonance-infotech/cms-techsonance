import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/[-_\s]/g, "");

  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let colorClass = "";

  switch (normalized) {
    case "completed":
    case "active":
    case "paid":
    case "success":
    case "approved":
    case "present":
      badgeVariant = "secondary";
      colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/20";
      break;

    case "inprogress":
    case "sent":
    case "scoping":
    case "deployed":
    case "review":
      badgeVariant = "secondary";
      colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/20";
      break;

    case "atrisk":
    case "warning":
    case "pending":
    case "paused":
      badgeVariant = "secondary";
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/20";
      break;

    case "overdue":
    case "delayed":
    case "destructive":
    case "rejected":
    case "failed":
    case "churned":
    case "absent":
      badgeVariant = "secondary";
      colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/20";
      break;

    case "draft":
    case "closed":
    case "archived":
    default:
      badgeVariant = "outline";
      colorClass = "bg-muted text-muted-foreground border-muted-foreground/10";
      break;
  }

  // Capitalize format helper
  const formattedLabel = status
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Badge
      variant={badgeVariant}
      className={cn("px-2.5 py-0.5 font-medium rounded-full text-xs transition-colors", colorClass, className)}
    >
      {formattedLabel}
    </Badge>
  );
}
