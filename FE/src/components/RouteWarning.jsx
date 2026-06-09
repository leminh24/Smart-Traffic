/**
 * RouteWarning.jsx
 * Warning banner hiển thị khi tuyến đi bộ có đoạn không có vỉa hè.
 * Dùng trong Sidebar.jsx: <RouteWarning segments={warningSegments} />
 */

export default function RouteWarning({ segments = [] }) {
  if (!segments.length) return null;

  return (
    <div className="route-warning">
      <div className="route-warning__icon">⚠️</div>
      <div className="route-warning__body">
        <strong>Một số đoạn đường không có vỉa hè</strong>
        <p>Hãy cẩn thận khi đi qua:</p>
        <ul className="route-warning__list">
          {segments.map((seg, i) => (
            <li key={i}>{seg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
