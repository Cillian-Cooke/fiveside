export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search a team or division…',
}) {
  return (
    <label className="search-bar">
      <span className="search-label">Search</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
    </label>
  )
}
