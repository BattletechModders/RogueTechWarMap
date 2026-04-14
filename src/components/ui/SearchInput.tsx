interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDesktop: boolean;
}

const SearchInput = ({ searchTerm, setSearchTerm, isDesktop }: SearchInputProps) => {
  return (
    <div style={{ flex: 1, paddingRight: '0.75rem' }}>
      <input
        type="text"
        placeholder="Search systems…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: isDesktop ? '50%' : '100%',
          padding: '6px 10px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          outline: 'none',
          backgroundColor: 'white',
          color: 'black',
          margin: '0 0.25rem 0.5rem',
        }}
      />
    </div>
  );
};

export default SearchInput;
