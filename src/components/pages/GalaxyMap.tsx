import { useEffect, useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image, Circle, Text, Label, Tag } from 'react-konva';
import galaxyBackground from '/src/assets/galaxyBackground2.svg';

const GalaxyMap = () => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [systems, setSystems] = useState<
    { posX: string; posY: string; name: string; owner: string }[]
  >([]);
  const [factions, setFactions] = useState<{
    [key: string]: { colour: string; prettyName: string };
  }>({});
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [isPinching, setIsPinching] = useState(false);

  const MIN_SCALE = 0.2;
  const MAX_SCALE = 15;
  const lastDistance = useRef(0); // Ensures distance tracking persists across renders

  useEffect(() => {
    const image = new window.Image();
    image.src = galaxyBackground;
    image.onload = () => setBackground(image);

    const fetchData = async () => {
      try {
        const [systemData, factionData] = await Promise.all([
          fetch('https://roguewar.org/api/v1/starmap/warmap').then((res) =>
            res.json()
          ),
          fetch('https://roguewar.org/api/v1/factions/warmap').then((res) =>
            res.json()
          ),
        ]);

        factionData['NoFaction'] = {
          colour: 'gray',
          prettyName: 'Unaffiliated',
        };
        setSystems(systemData);
        setFactions(factionData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.25;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stage.scaleX();
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 1) {
      const stage = e.target.getStage();
      if (!stage) return;

      // Check if the tapped object is a Circle (i.e., a system)
      const isCircle = e.target.className === 'Circle';

      if (!isCircle) {
        // If tapped outside a system, hide the tooltip
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
      }
    }

    if (e.evt.touches.length === 2) {
      setIsPinching(true);
      lastDistance.current = getDistance(e.evt.touches[0], e.evt.touches[1]);
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 2 && isPinching) {
      e.evt.preventDefault();

      const [touch1, touch2] = e.evt.touches;
      const newDistance = getDistance(touch1, touch2);
      if (!lastDistance.current) return;

      const scaleFactor = 2.5; // Adjust zoom speed
      const scaleBy = Math.pow(newDistance / lastDistance.current, scaleFactor);
      let newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleBy));

      if (stageRef.current) {
        const stage = stageRef.current;
        const pointer = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const mousePointTo = {
          x: (pointer.x - stage.x()) / scale,
          y: (pointer.y - stage.y()) / scale,
        };

        setScale(newScale);
        setPosition({
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        });
      }

      lastDistance.current = newDistance;
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      setIsPinching(false);
    }
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      draggable={!isPinching} // Prevents unintended dragging while pinching
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      ref={stageRef}
      onWheel={handleWheel}
      onDragMove={handleDragMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Layer>
        <Circle x={0} y={0} radius={10} fill="red" opacity={0.8} />
        {background && (
          <Image
            image={background}
            x={-4800}
            y={-2700}
            width={9600}
            height={5400}
            opacity={0.2}
          />
        )}
      </Layer>
      <Layer>
        {systems.map((system, index) => (
          <Circle
            key={index}
            x={Number(system.posX)}
            y={-Number(system.posY)}
            radius={2.25}
            fill={factions[system.owner]?.colour || 'gray'}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;

              const pointer = stage.getPointerPosition();
              if (!pointer) return;

              const pointerPosition = stage.getPointerPosition();
              if (!pointerPosition) return;
              const stageScale = stage.scaleX(); // Assuming uniform scale

              setTooltip({
                visible: true,
                text: `${system.name}\n${
                  factions[system.owner]?.prettyName
                }\n(${system.posX}, ${system.posY})`,
                x: (pointerPosition.x - stage.x()) / stageScale,
                y: (pointerPosition.y - stage.y()) / stageScale,
              });
            }}
            onMouseLeave={() =>
              setTooltip({ visible: false, text: '', x: 0, y: 0 })
            }
            onTouchStart={(e) => {
              if (e.evt.touches.length === 1) {
                e.evt.preventDefault(); // Prevents unintended drag behavior
                const stage = e.target.getStage();
                if (!stage) return;

                const pointer = stage.getRelativePointerPosition();
                if (!pointer) return;

                setTooltip((prevTooltip) => ({
                  visible: !prevTooltip.visible, // Toggle tooltip visibility
                  text: `${system.name}\n${
                    factions[system.owner]?.prettyName
                  }\n(${system.posX}, ${system.posY})`,
                  x: pointer.x,
                  y: pointer.y,
                }));
              }
            }}
          />
        ))}
      </Layer>
      <Layer listening={false}>
        {tooltip.visible && (
          <Label
            x={tooltip.x}
            y={tooltip.y}
            opacity={0.75}
            scaleX={2 / scale}
            scaleY={2 / scale} // Keep the tooltip size constant despite zooming
          >
            <Tag
              fill="white"
              pointerDirection="down"
              pointerWidth={10}
              pointerHeight={10}
              shadowColor="gray"
              shadowBlur={10}
              shadowOffset={{ x: 10, y: 10 }}
              shadowOpacity={0.2}
            />
            <Text
              text={tooltip.text}
              fontFamily="Calibri"
              fontSize={18}
              padding={5}
              fill="black"
            />
          </Label>
        )}
      </Layer>
    </Stage>
  );
};

// Utility function for touch distance calculations
const getDistance = (touch1: Touch, touch2: Touch) => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const Map = GalaxyMap;
export default GalaxyMap;
