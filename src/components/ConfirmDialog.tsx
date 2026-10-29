import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrapper">
          {variant === 'danger' ? (
            <div className="icon-badge danger">
              <Trash2 size={24} />
            </div>
          ) : (
            <div className="icon-badge warning">
              <AlertTriangle size={24} />
            </div>
          )}
        </div>

        <h3 id="dialog-title" className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-${variant} btn-block`}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>

        <button
          type="button"
          className="modal-close-icon"
          onClick={onCancel}
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
