export default function DataTable({ title, headers, children }) {
  return (
    <div className="bg-surface border border-subtle overflow-hidden theme-transition">
      {title && (
        <div className="p-6 border-b border-subtle bg-main/50 theme-transition">
          <h2 className="text-xl font-serif font-bold text-brand theme-transition">
            {title}
          </h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-t-muted uppercase bg-main/80 theme-transition">
            <tr>
              {headers.map((h, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 ${h.align === "right" ? "text-right" : ""}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
