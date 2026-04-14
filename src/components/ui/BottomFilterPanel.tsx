import { useState, useEffect, useRef } from 'react';
import { ChevronsUp, ChevronsDown } from 'lucide-react';
import SearchInput from './SearchInput';
import FactionSelector from './FactionSelector';

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
        {isOpen ? <ChevronsDown size={24} /> : <ChevronsUp size={24} />}
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
          <SearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isDesktop={isDesktop}
          />
          <FactionSelector
            factions={factions}
            selectedFactions={selectedFactions}
            setSelectedFactions={setSelectedFactions}
            isDesktop={isDesktop}
          />
        </div>
      )}
    </div>
  );
};

export default BottomFilterPanel;
