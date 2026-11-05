import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface CtaButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  /** Primary carries the single accent colour; keep one primary per view. */
  variant?: "primary" | "secondary";
  /** Renders a link (keep links as links). */
  href?: string;
  size?: "md" | "lg";
  /**
   * A shorter label for a tight bar ("See your savings" for "See what you'd have saved"). GlassNav
   * shows it in its bar below 720px, where the full label no longer fits beside brand and Menu;
   * the open menu and every wider bar keep `children`.
   */
  short?: ReactNode;
}

export function CtaButton({
  children,
  variant = "primary",
  href,
  size = "md",
  className = "",
  type = "button",
  short,
  ...rest
}: CtaButtonProps) {
  const cls = `uipack-web-cta ${className}`.trim();
  if (short !== undefined)
    children = (
      <>
        <span className="uipack-web-cta__long">{children}</span>
        <span className="uipack-web-cta__short">{short}</span>
      </>
    );
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
