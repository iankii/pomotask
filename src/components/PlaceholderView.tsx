import React from 'react';
import styles from './PlaceholderView.module.css';

interface PlaceholderViewProps {
  title: string;
  description?: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description }) => {
  return (
    <div className={styles.placeholder}>
      <div className={styles.content}>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        <p className={styles.coming}>Coming soon...</p>
      </div>
    </div>
  );
};
