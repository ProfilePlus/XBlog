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
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="admin-modal-overlay" onClick={onCancel} role="presentation">
      <div
        aria-describedby="admin-confirm-dialog-description"
        aria-labelledby="admin-confirm-dialog-title"
        aria-modal="true"
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <p className="admin-kicker" style={{ color: tone === 'danger' ? '#ef4444' : 'var(--color-text-muted)' }}>
          {tone === "danger" ? "Attention Required" : "Confirmation"}
        </p>
        <h2 id="admin-confirm-dialog-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
          {title}
        </h2>
        <p id="admin-confirm-dialog-description" style={{ fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.5, marginBottom: '2rem' }}>
          {description}
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            className="admin-ghost-button" 
            onClick={onCancel}
            disabled={pending}
            type="button"
          >
            {cancelLabel}
          </button>
          <button 
            className={tone === 'danger' ? 'admin-danger-button' : 'admin-primary-button'}
            onClick={onConfirm}
            disabled={pending}
            type="button"
          >
            {pending ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
