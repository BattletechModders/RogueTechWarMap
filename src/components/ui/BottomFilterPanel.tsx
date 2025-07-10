import { useState, useEffect, useRef } from 'react';
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

  /* ───────────── desktop breakpoint helper ───────────── */
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* react-select helpers */
  const options = factions.map((f) => ({ value: f, label: f }));
  const selectedOpts = options.filter((o) =>
    selectedFactions.includes(o.value)
  );
  const onFactionChange = (
    vals: MultiValue<{ value: string; label: string }>
  ) => setSelectedFactions(vals.map((v) => v.value));

  const removeFaction = (name: string) =>
    setSelectedFactions(selectedFactions.filter((f) => f !== name));

  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('32px');

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Get the current height before the change
    const startHeight = panel.offsetHeight;

    // Temporarily disable transitions to get new height
    panel.style.transition = 'none';
    panel.style.height = 'auto';

    const targetHeight = panel.scrollHeight;

    // Re-enable transitions
    requestAnimationFrame(() => {
      panel.style.transition = 'height 0.5s ease';
      panel.style.height = `${startHeight}px`;

      // Then trigger the new height
      requestAnimationFrame(() => {
        const expandedHeight = Math.max(targetHeight, 125);
        setHeight(`${isOpen ? expandedHeight : 32}px`);
      });
    });
  }, [isOpen, selectedFactions]);

  return (
    <div
      ref={panelRef}
      style={{
        height,
        minHeight: '32px',
        position: 'fixed',
        bottom: 0,
        left: isDesktop ? '200px' : 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(40, 40, 40, 0.85)',
        color: 'white',
        padding: '0.5rem 1rem',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        backdropFilter: 'blur(6px)',
        overflowY: 'hidden',
        transition: 'height 0.5s ease, opacity 0.3s ease',
        opacity: isOpen ? 1 : 0.5,
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

      {/* two-column layout */}
      {isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
          }}
        >
          {/* LEFT column — system search */}
          <div style={{ flex: 1, paddingRight: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search systems…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: isDesktop ? '50%' : '100%', // ← half width on desktop
                padding: '6px 10px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                outline: 'none',
                backgroundColor: 'white',
                color: 'black',
                margin: '0 0.25rem 0.5rem', // side + bottom space
              }}
            />
          </div>

          {/* RIGHT column — faction select */}
          <div
            style={{
              flex: 1,
              paddingLeft: '0.75rem',
              borderLeft: '1px solid #555',
            }}
          >
            <div style={{ width: isDesktop ? '50%' : '100%' }}>
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
                  /* field text colours */
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
                  /* keep menu above Konva */
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
              {/* chosen factions shown under the search bar */}
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
        </div>
      )}
    </div>
  );
};

export default BottomFilterPanel;
