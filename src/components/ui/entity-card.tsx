import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface EntityCardProps {
  avatar?: string;
  title: string;
  subtitle?: string;
  metadata?: { label: string; value: string | number }[];
  badge?: React.ReactNode;
  href?: string;
}

export function EntityCard({
  avatar,
  title,
  subtitle,
  metadata,
  badge,
  href,
}: EntityCardProps) {
  const content = (
    <Card className="hover:scale-[1.01] hover:shadow-md transition-all duration-200 border border-muted bg-card/60 backdrop-blur-sm cursor-pointer overflow-hidden group">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-muted">
              {avatar && <AvatarImage src={avatar} alt={title} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <h3 className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-muted/50">
            {metadata.map((item, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
