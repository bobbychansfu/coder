import Image from "next/image";
import styles from "../styles/StatisticsCard.module.css";

interface StatisticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  subtitleColor?: string;
}

export default function StatisticsCard({
  title,
  value,
  subtitle,
  icon,
  subtitleColor = "#4a5565",
}: StatisticsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.iconWrapper}>
          <Image
            src={icon}
            alt={title}
            width={16}
            height={16}
            className={styles.icon}
          />
        </div>
      </div>
      <div className={styles.content}>
        <p className={styles.value}>{value}</p>
        <p className={styles.subtitle} style={{ color: subtitleColor }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
