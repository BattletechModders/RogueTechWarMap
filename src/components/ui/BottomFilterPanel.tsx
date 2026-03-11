import { useState, useEffect, useRef } from 'react';
import Select, { MultiValue } from 'react-select';
import { ChevronsUp, ChevronsDown } from 'lucide-react';

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

  /* Desktop/mobile layout mode is driven by viewport width and updated on resize. */
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Build react-select option/value pairs from faction names for stable controlled input state. */
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

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Measure the current height so height animation starts from an exact frame.
    const startHeight = panel.offsetHeight;

    // Disable transitions temporarily so we can snapshot the target height without an
    // intermediate animated jump.
    panel.style.transition = 'none';
    panel.style.height = 'auto';

    const targetHeight = panel.scrollHeight;

    // Re-enable transition and restore the measured start height before animating.
    requestAnimationFrame(() => {
      panel.style.transition = 'height 0.5s ease';
      panel.style.height = `${startHeight}px`;

      // Apply the final target height in the next frame to trigger a clean transition.
      requestAnimationFrame(() => {
        const expandedHeight = Math.max(targetHeight, 125);
        setHeight(`${isOpen ? expandedHeight : 32}px`);
      });
    });
  }, [isOpen, selectedFactions]);

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
      ? { bottom: 22, left: 0 } // Desktop tooltip aligns under the help icon.
      : { bottom: 28, right: 8, left: 'auto', transform: 'none' }), // Mobile tooltip floats centered under the icon.
  };

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
      {/* Header trigger lets users expand/collapse the bottom filter panel. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: isOpen ? '0.75rem' : 0,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronsDown size={24} /> : <ChevronsUp size={24} />}
      </div>

      {/* Open state uses two columns: left = search, right = faction filters. */}
      {isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
          }}
        >
           {/* Left column: system search field */}
          <div style={{ flex: 1, paddingRight: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search systems…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: isDesktop ? '50%' : '100%', // Desktop keeps a compact search field width.
                padding: '6px 10px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                outline: 'none',
                backgroundColor: 'white',
                color: 'black',
                margin: '0 0.25rem 0.5rem', // Add spacing so pills and controls are not crowded.
              }}
            />
          </div>

           {/* Right column: faction selector controls */}
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

               {/* Selected factions appear as removable chips for quick feedback and edits. */}
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
