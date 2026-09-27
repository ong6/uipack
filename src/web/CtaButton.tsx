import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface CtaButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  /** Primary carries the single accent colour; keep one primary per view. */
  variant?: "primary" | "secondary";
  /** Renders a link (keep links as links). */
  href?: string;
  size?: "md" | "lg";
}

export function CtaButton({ children, variant = "primary", href, size = "md", className = "", type = "button", ...rest }: CtaButtonProps) {
  const cls = `uipack-web-cta ${className}`.trim();
  if (href)
    return (
      <a className={cls} href={href} data-variant={variant} data-size={size}>
        {children}
      </a>
    );
  return (
    <button className={cls} type={type} data-variant={variant} data-size={size} {...rest}>
      {children}
    </button>
  );
}
