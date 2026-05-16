import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { MultiValue } from 'react-select';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

const FactionSelect = lazy(() => import('react-select'));

type FactionOption = {
  value: string;
  label: string;
};

const selectStyles = {
  control: (base: object) => ({
    ...base,
    color: 'black',
    width: '100%',
  }),
  input: (base: object) => ({ ...base, color: 'black' }),
  singleValue: (base: object) => ({ ...base, color: 'black' }),
  multiValueLabel: (base: object) => ({ ...base, color: 'black' }),
  option: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    color: 'black',
    backgroundColor: state.isFocused ? '#e6e6e6' : 'white',
  }),
  menuPortal: (base: object) => ({ ...base, zIndex: 9999 }),
};

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

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const options = useMemo<FactionOption[]>(
    () => factions.map((faction) => ({ value: faction, label: faction })),
    [factions]
  );

  const selectedOpts = useMemo(
    () => options.filter((option) => selectedFactions.includes(option.value)),
    [options, selectedFactions]
  );

  const onFactionChange = (vals: unknown) =>
    setSelectedFactions(
      (vals as MultiValue<FactionOption>).map((value) => value.value)
    );

  const removeFaction = (name: string) =>
    setSelectedFactions(selectedFactions.filter((faction) => faction !== name));

  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('32px');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const startHeight = panel.offsetHeight;
    panel.style.transition = 'none';
    panel.style.height = 'auto';

    const targetHeight = panel.scrollHeight;

    requestAnimationFrame(() => {
      panel.style.transition = 'height 0.5s ease';
      panel.style.height = `${startHeight}px`;

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
      ? { bottom: 22, left: 0 }
      : { bottom: 28, right: 8, left: 'auto', transform: 'none' }),
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

      {isOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
          }}
        >
          <div style={{ flex: 1, paddingRight: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search systems..."
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
                  <Suspense
                    fallback={
                      <div
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '6px',
                          background: 'white',
                          opacity: 0.85,
                        }}
                      />
                    }
                  >
                    <FactionSelect
                      isMulti
                      options={options}
                      value={selectedOpts}
                      onChange={onFactionChange}
                      menuPortalTarget={document.body}
                      menuPlacement="top"
                      placeholder="Filter factions..."
                      components={{ MultiValue: () => null }}
                      styles={selectStyles}
                    />
                  </Suspense>
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
                  {selectedFactions.map((faction) => (
                    <span
                      key={faction}
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
                      {faction}
                      <span
                        onClick={() => removeFaction(faction)}
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
