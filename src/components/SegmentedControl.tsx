import React from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.button} ${value === option.value ? styles.active : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
