import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

let optimisticIdSequence = 0;

/**
 * Show add / update / remove changes on a server-provided list the moment the user submits them,
 * while the real request runs in the background.
 *
 * Every change returns a `settle` function to call when its request finishes (Inertia `onFinish`):
 * on success the fresh server props already contain the change, on failure the list simply falls
 * back to the server state — so no manual rollback is needed.
 *
 * @param {Array<object>} serverItems Items from Inertia page props (each with an `id`).
 */
export default function useOptimisticList(serverItems) {
    const [operations, setOperations] = useState([]);
    const pendingCount = useRef(0);

    const items = useMemo(() => operations.reduce((list, operation) => {
        if (operation.kind === 'add') {
            return [operation.item, ...list];
        }
        if (operation.kind === 'update') {
            return list.map((item) => (item.id === operation.item.id ? { ...item, ...operation.item } : item));
        }
        return list.filter((item) => item.id !== operation.id);
    }, serverItems || []), [serverItems, operations]);

    const track = useCallback((operation) => {
        const operationId = ++optimisticIdSequence;
        pendingCount.current += 1;
        setOperations((current) => [...current, { ...operation, operationId }]);

        let settled = false;
        return () => {
            if (settled) {
                return;
            }
            settled = true;
            pendingCount.current -= 1;
            setOperations((current) => current.filter((op) => op.operationId !== operationId));
        };
    }, []);

    // Warn before closing the tab while a background save has not reached the server yet
    useEffect(() => {
        const warnIfSaving = (event) => {
            if (pendingCount.current > 0) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', warnIfSaving);
        return () => window.removeEventListener('beforeunload', warnIfSaving);
    }, []);

    return {
        items,
        add: useCallback((item) => track({
            kind: 'add',
            item: { ...item, id: `optimistic-${optimisticIdSequence + 1}`, isOptimistic: true },
        }), [track]),
        update: useCallback((item) => track({ kind: 'update', item: { ...item, isOptimistic: true } }), [track]),
        remove: useCallback((id) => track({ kind: 'remove', id }), [track]),
    };
}
