import { useState } from 'react';
import Select, { MultiValue } from 'react-select';
import { ChevronUp, ChevronDown } from 'lucide-react';

const BottomFilterPanel = ({
  searchTerm,
  setSearchTerm,
  factions,
  selectedFactions,
  setSelectedFactions,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  factions: string[];
  selectedFactions: string[];
  setSelectedFactions: (v: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  /* react-select data helpers */
  const options = factions.map((f) => ({ value: f, label: f }));
  const selectedOpts = options.filter((o) =>
    selectedFactions.includes(o.value)
  );
  const onFactionChange = (
    vals: MultiValue<{ value: string; label: string }>
  ) => setSelectedFactions(vals.map((v) => v.value));

  const selectStyles = {
    control: (base: any) => ({ ...base, color: 'black' }),
    input: (base: any) => ({ ...base, color: 'black' }),
    singleValue: (base: any) => ({ ...base, color: 'black' }),
    multiValueLabel: (base: any) => ({ ...base, color: 'black' }),
    option: (base: any, state: any) => ({
      ...base,
      color: 'black',
      backgroundColor: state.isFocused ? '#e6e6e6' : 'white',
    }),
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transition: 'transform 0.3s ease-in-out',
        transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 32px))',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* chevron toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: isOpen ? '0.75rem' : 0,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
      </div>

      {/* content */}
      {isOpen && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* name search */}
          <input
            type="text"
            placeholder="Search systems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              outline: 'none',
              backgroundColor: 'white',
              color: 'black',
            }}
          />

          {/* faction multi-select */}
          <div style={{ minWidth: '180px', flex: '0 0 180px' }}>
            <Select
              isMulti
              options={options}
              value={selectedOpts}
              onChange={onFactionChange}
              menuPortalTarget={document.body} /* render above Konva */
              styles={{
                ...selectStyles,
                menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
              }}
              menuPlacement="top"
              placeholder="Filter factions…"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomFilterPanel;
