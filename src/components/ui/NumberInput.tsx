import React from "react";
import { Input } from "./Input";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  label: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
}

export function NumberInput({
  label,
  error,
  value,
  onChange,
  min = 0,
  step = 1,
  ...props
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "" || inputValue === "-") {
      onChange(0);
      return;
    }
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <Input
      type="number"
      label={label}
      error={error}
      value={value}
      onChange={handleChange}
      min={min}
      step={step}
      {...props}
    />
  );
}

