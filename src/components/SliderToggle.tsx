import React from 'react';
import styles from './SliderToggle.module.css';

interface SliderToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export const SliderToggle: React.FC<SliderToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.toggle}
      />
    </div>
  );
};
