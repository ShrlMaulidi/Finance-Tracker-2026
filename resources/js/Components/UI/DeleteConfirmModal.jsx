import React from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * Reusable Delete Confirmation Modal component
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Cancel / close callback
 * @param {function} onConfirm - Delete execution callback
 * @param {boolean} loading - Loading state while deleting (alias: isDeleting)
 * @param {boolean} isDeleting - Loading state while deleting
 * @param {string} title - Modal heading title (default: 'Hapus Data')
 * @param {string} subtitle - Modal subtext (default: 'Tindakan ini tidak dapat dibatalkan.')
 * @param {string|React.ReactNode} message - Warning explanation text
 * @param {string} itemTitle - Main label/name of item being deleted
 * @param {string} itemSubtitle - Secondary info of item being deleted
 * @param {string|React.ReactNode} itemExtra - Right badge/price of item being deleted
 * @param {string} confirmText - Button text for confirm action (default: 'Hapus')
 * @param {string} cancelText - Button text for cancel action (default: 'Batal')
 * @param {string} maxWidth - Modal max width ('sm'|'md'|'lg', default: 'sm')
 * @param {React.ReactNode} children - Optional custom body content
 */
export default function DeleteConfirmModal({
    isOpen = false,
    onClose = () => {},
    onConfirm = () => {},
    loading = false,
    isDeleting = false,
    title = 'Hapus Data',
    subtitle = 'Tindakan ini tidak dapat dibatalkan.',
    message = 'Data ini akan dihapus secara permanen dan tidak dapat dipulihkan kembali.',
    itemTitle = '',
    itemSubtitle = '',
    itemExtra = null,
    confirmText = 'Hapus',
    cancelText = 'Batal',
    maxWidth = 'sm',
    children = null,
}) {
    const isProcessing = loading || isDeleting;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isProcessing && onClose()}
            title={title}
            subtitle={subtitle}
            maxWidth={maxWidth}
        >
            <div className="space-y-4">

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="!py-2 !px-3.5 text-xs"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                        loading={isProcessing}
                        className="!py-2 !px-3.5 text-xs !bg-rose-600 hover:!bg-rose-700 !text-white !shadow-none"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
