import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";

interface LogoProps {
  className?: string;
  href?: string;
  showText?: boolean;
}

export function Logo({ className, href = "/", showText = true }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      {showText && <span className="text-lg">StackAudit</span>}
    </Link>
  );
}
