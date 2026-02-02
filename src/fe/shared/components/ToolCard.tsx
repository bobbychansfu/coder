"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { ToneType } from "@/fe/shared/types";

interface ToolCardProps {
  title: string;
  description: string;
  icon: SvgIconComponent;
  tone: ToneType;
  className?: string;
  iconClassName?: string;
  iconGlyphClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  headerClassName?: string;
  onClick?: () => void;
}

/**
 * Shared tool/action card component
 * Used across admin tool hub, instructor actions, and other sections
 */
export default function ToolCard({
  title,
  description,
  icon: Icon,
  tone,
  className = "",
  iconClassName = "",
  iconGlyphClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  headerClassName = "",
  onClick,
}: ToolCardProps) {
  return (
    <button className={className} type="button" onClick={onClick}>
      <div className={headerClassName}>
        <h3 className={titleClassName}>{title}</h3>
        <div className={iconClassName} data-tone={tone}>
          <Icon className={iconGlyphClassName} fontSize="inherit" />
        </div>
      </div>
      <p className={descriptionClassName}>{description}</p>
    </button>
  );
}
