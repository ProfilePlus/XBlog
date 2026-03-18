"use client";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <div
        aria-describedby="admin-confirm-dialog-description"
        aria-labelledby="admin-confirm-dialog-title"
        aria-modal="true"
        className="admin-dialog"
        role="dialog"
      >
        <div className="admin-dialog-copy">
          <p className="admin-kicker">{tone === "danger" ? "Danger Zone" : "Confirm Action"}</p>
          <h2 id="admin-confirm-dialog-title">{title}</h2>
          <p className="admin-subtle" id="admin-confirm-dialog-description">
            {description}
          </p>
        </div>
        <div className="admin-dialog-actions">
          <button className="admin-ghost-button" disabled={pending} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={tone === "danger" ? "admin-danger-button" : "admin-primary-button"}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
