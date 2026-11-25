/** A row of key hints: <Keys items={[["W A S D", "move"], ["Esc", "back to the site"]]} />. */
export default function Keys({ items }: { items: [string, string][] }) {
  return (
    <div className="xp-keys">
      {items.map(([keys, label]) => (
        <span key={label} className="xp-keys__item">
          {keys.split(" ").map((k) => <kbd key={k}>{k}</kbd>)}
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
