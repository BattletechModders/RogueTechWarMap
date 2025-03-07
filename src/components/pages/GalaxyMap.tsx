import { useEffect, useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image, Circle, Text, Label, Tag } from 'react-konva';
import warmapAPIFeeds, { StarSystemType } from '../hooks/warmapAPIFeeds';
import galaxyBackground from '/src/assets/galaxyBackground2.svg';

const GalaxyMap = () => {
  const { systems, factions } = warmapAPIFeeds();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  // const [systems, setSystems] = useState<
  //   {
  //     posX: string;
  //     posY: string;
  //     name: string;
  //     owner: string;
  //     sysUrl: string;
  //   }[]
  // >([]);
  // const [factions, setFactions] = useState<{
  //   [key: string]: { colour: string; prettyName: string };
  // }>({});
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });
  const scaleRef = useRef(1);
  const positionRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const [isPinching, setIsPinching] = useState(false);

  const MIN_SCALE = 0.2;
  const MAX_SCALE = 15;
  const lastDistance = useRef(0);

  useEffect(() => {
    const image = new window.Image();
    image.src = galaxyBackground;
    image.onload = () => setBackground(image);

    // const fetchData = async () => {
    //   try {
    //     const [systemData, factionData] = await Promise.all([
    //       fetch('https://roguewar.org/api/v1/starmap/warmap').then((res) =>
    //         res.json()
    //       ),
    //       fetch('https://roguewar.org/api/v1/factions/warmap').then((res) =>
    //         res.json()
    //       ),
    //     ]);

    //     factionData['NoFaction'] = {
    //       colour: 'gray',
    //       prettyName: 'Unaffiliated',
    //     };
    //     setSystems(systemData);
    //     setFactions(factionData);
    //   } catch (error) {
    //     console.error('Failed to fetch data:', error);
    //   }
    // };

    // fetchData();

    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    const preventDefault = (e: Event) => e.preventDefault();

    container.addEventListener('touchmove', preventDefault, { passive: true });

    return () => {
      container.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.25;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scaleRef.current;
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    scaleRef.current = newScale;
    positionRef.current = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(positionRef.current);
    stage.batchDraw();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    positionRef.current = { x: e.target.x(), y: e.target.y() };
  };

  // Begin mobile functionality

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const pinchMidpoint = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 1) {
      const stage = e.target.getStage();
      if (!stage) return;

      const isCircle = e.target.className === 'Circle';

      if (!isCircle) {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
      }
    }

    if (e.evt.touches.length === 2) {
      setIsPinching(true);
      lastDistance.current = getDistance(e.evt.touches[0], e.evt.touches[1]);

      pinchMidpoint.current = {
        x: (e.evt.touches[0].clientX + e.evt.touches[1].clientX) / 2,
        y: (e.evt.touches[0].clientY + e.evt.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 2 && isPinching) {
      e.evt.preventDefault();

      if (!pinchMidpoint.current) return;

      const [touch1, touch2] = e.evt.touches;
      const newDistance = getDistance(touch1, touch2);
      if (!lastDistance.current) return;

      const scaleBy = newDistance / lastDistance.current;
      let newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, scaleRef.current * scaleBy)
      );

      if (stageRef.current) {
        const stage = stageRef.current;

        const newPosition = {
          x:
            pinchMidpoint.current.x -
            (pinchMidpoint.current.x - positionRef.current.x) * scaleBy,
          y:
            pinchMidpoint.current.y -
            (pinchMidpoint.current.y - positionRef.current.y) * scaleBy,
        };

        scaleRef.current = newScale;
        positionRef.current = newPosition;

        requestAnimationFrame(() => {
          stage.scale({ x: newScale, y: newScale });
          stage.position(positionRef.current);
          stage.batchDraw();
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
      draggable={!isPinching}
      scaleX={scaleRef.current}
      scaleY={scaleRef.current}
      x={positionRef.current.x}
      y={positionRef.current.y}
      ref={stageRef}
      onWheel={handleWheel}
      onDragMove={handleDragMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Layer>
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
        {systems.map((system: StarSystemType, index: number) => (
          <Circle
            key={index}
            x={Number(system.posX)}
            y={-Number(system.posY)}
            radius={2.25}
            fill={factions[system.owner]?.colour || 'gray'}
            onClick={() => {
              if (system.sysUrl) {
                window.location.href = `https://www.roguewar.org${system.sysUrl}`;
              }
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;

              const pointer = stage.getPointerPosition();
              if (!pointer) return;

              const pointerPosition = stage.getPointerPosition();
              if (!pointerPosition) return;
              const stageScale = stage.scaleX();

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
                e.evt.preventDefault();
                const stage = e.target.getStage();
                if (!stage) return;

                const pointer = stage.getRelativePointerPosition();
                if (!pointer) return;

                if (tooltip.visible && tooltip.text.includes(system.name)) {
                  window.location.href = `https://www.roguewar.org${system.sysUrl}`;
                  return;
                }

                setTooltip((prevTooltip) => ({
                  visible: !prevTooltip.visible,
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
            scaleX={2 / scaleRef.current}
            scaleY={2 / scaleRef.current}
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
              cornerRadius={8}
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

export const Map = GalaxyMap;
export default GalaxyMap;
