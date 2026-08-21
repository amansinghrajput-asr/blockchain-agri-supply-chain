export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          <span>
            {t.type === "success" && "✓"}
            {t.type === "error" && "✕"}
            {t.type === "info" && "ℹ"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
