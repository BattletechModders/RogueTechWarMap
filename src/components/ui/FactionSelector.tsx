import { useState } from 'react';
import Select, { MultiValue } from 'react-select';

interface FactionSelectorProps {
  factions: string[];
  selectedFactions: string[];
  setSelectedFactions: (v: string[]) => void;
  isDesktop: boolean;
}

const FactionSelector = ({
  factions,
  selectedFactions,
  setSelectedFactions,
  isDesktop,
}: FactionSelectorProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const options = factions.map((f) => ({ value: f, label: f }));
  const selectedOpts = options.filter((o) =>
    selectedFactions.includes(o.value)
  );
  const onFactionChange = (
    vals: MultiValue<{ value: string; label: string }>
  ) => setSelectedFactions(vals.map((v) => v.value));

  const removeFaction = (name: string) =>
    setSelectedFactions(selectedFactions.filter((f) => f !== name));

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#333',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'normal',
    width: 'max-content',
    display: 'inline-block',
    maxWidth: isDesktop ? '220px' : '90vw',
    zIndex: 10000,
    ...(isDesktop
      ? { bottom: 22, left: 0 }
      : { bottom: 28, right: 8, left: 'auto', transform: 'none' }),
  };

  return (
    <div
      style={{
        flex: 1,
        paddingLeft: '0.75rem',
        borderLeft: '1px solid #555',
      }}
    >
      <div style={{ width: isDesktop ? '50%' : '100%' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div style={{ flexGrow: 1 }}>
            <Select
              isMulti
              options={options}
              value={selectedOpts}
              onChange={onFactionChange}
              menuPortalTarget={document.body}
              menuPlacement="top"
              placeholder="Filter factions…"
              components={{ MultiValue: () => null }}
              styles={{
                control: (base) => ({
                  ...base,
                  color: 'black',
                  width: '100%',
                }),
                input: (base) => ({ ...base, color: 'black' }),
                singleValue: (base) => ({ ...base, color: 'black' }),
                multiValueLabel: (base) => ({ ...base, color: 'black' }),
                option: (base, state) => ({
                  ...base,
                  color: 'black',
                  backgroundColor: state.isFocused ? '#e6e6e6' : 'white',
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'pointer',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#888',
              color: 'white',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '18px',
            }}
            onMouseEnter={() => isDesktop && setShowTooltip(true)}
            onMouseLeave={() => isDesktop && setShowTooltip(false)}
            onClick={() => !isDesktop && setShowTooltip((prev) => !prev)}
          >
            i
            {showTooltip && (
              <div style={tooltipStyle}>
                Only factions that currently have systems on the map will
                appear here.
              </div>
            )}
          </div>
        </div>

        {selectedFactions.length > 0 && (
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            {selectedFactions.map((f) => (
              <span
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                  fontSize: '14px',
                  background: 'rgba(255,255,255,0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {f}
                <span
                  onClick={() => removeFaction(f)}
                  style={{
                    marginLeft: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    lineHeight: 1,
                  }}
                >
                  x
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FactionSelector;
