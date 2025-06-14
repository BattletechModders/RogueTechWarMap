import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const BottomFilterPanel = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

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

      {isOpen && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          {/* Space for more filters */}
        </div>
      )}
    </div>
  );
};

export default BottomFilterPanel;
