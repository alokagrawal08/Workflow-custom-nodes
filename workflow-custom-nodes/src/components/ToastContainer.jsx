/**
 * Shows a small notification at the bottom of the screen.
 * Only the most recent toast is displayed to avoid stacking.
 */
export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  const t = toasts[toasts.length - 1];
  return (
    <div className={`toast ${t.type}`} key={t.id}>
      {t.message}
    </div>
  );
}
