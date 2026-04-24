"use client";

type AdminStepperInputProps = {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
};

function normalizeNumber(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export function AdminStepperInput({
  label,
  value,
  min = 0,
  step = 1,
  onChange,
}: AdminStepperInputProps) {
  function update(nextValue: number) {
    onChange(Math.max(min, nextValue));
  }

  return (
    <label>
      {label}
      <div className="admin-stepper-field">
        <input
          className="admin-stepper-input"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => update(normalizeNumber(event.target.value, value))}
        />
        <div className="admin-stepper-controls" aria-hidden="true">
          <button className="admin-stepper-button" onClick={() => update(value + step)} type="button">
            +
          </button>
          <button className="admin-stepper-button" onClick={() => update(value - step)} type="button">
            −
          </button>
        </div>
      </div>
    </label>
  );
}
