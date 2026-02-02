"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { ToneType } from "@/fe/shared/types/common";

interface ActivityFeedItemProps {
  description: string;
  timestamp: string;
  icon?: SvgIconComponent;
  tone: ToneType;
  className?: string;
  iconClassName?: string;
  iconGlyphClassName?: string;
  textClassName?: string;
  descriptionClassName?: string;
  timestampClassName?: string;
}

/**
 * Shared activity feed item component
 * Used across admin and instructor recent activity sections
 */
export default function ActivityFeedItem({
  description,
  timestamp,
  icon: Icon,
  tone,
  className = "",
  iconClassName = "",
  iconGlyphClassName = "",
  textClassName = "",
  descriptionClassName = "",
  timestampClassName = "",
}: ActivityFeedItemProps) {
  return (
    <div className={className}>
      {Icon && (
        <div className={iconClassName} data-tone={tone}>
          <Icon className={iconGlyphClassName} fontSize="inherit" />
        </div>
      )}
      <div className={textClassName}>
        <p className={descriptionClassName}>{description}</p>
        <p className={timestampClassName}>{timestamp}</p>
      </div>
    </div>
  );
}
