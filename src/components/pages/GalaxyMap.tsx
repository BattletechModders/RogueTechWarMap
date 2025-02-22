import { useEffect, useState, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Image, Circle, Text, Label, Tag } from "react-konva";
import galaxyBackground from "/src/assets/galaxyBackground2.svg";

const GalaxyMap = () => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [systems, setSystems] = useState<{ posX: string; posY: string; name: string; owner: string }[]>([]);
  const [factions, setFactions] = useState<{ [key: string]: { colour: string; prettyName: string } }>({});
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 600, y: 400 });

  useEffect(() => {
    const image = new window.Image();
    image.src = galaxyBackground;
    image.onload = () => setBackground(image);

    const fetchData = async () => {
      try {
        const [systemData, factionData] = await Promise.all([
          fetch("https://roguewar.org/api/v1/starmap/warmap").then(res => res.json()),
          fetch("https://roguewar.org/api/v1/factions/warmap").then(res => res.json()),
        ]);
        factionData["NoFaction"] = {
          colour: "gray",
          prettyName: "Unaffiliated",
        };
        setSystems(systemData);
        setFactions(factionData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.25;
  
    // Ensure that stageRef.current is not null before using it
    const stage = stageRef.current;
    if (!stage) {
      console.warn("Stage reference is null, skipping zoom.");
      return;
    }
  
    // Ensure pointer position is valid before using it
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.warn("Pointer position is null, skipping zoom.");
      return;
    }
  
    // Compute new scale
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  
    // Ensure stage position is valid before modifying it
    if (isNaN(stage.x()) || isNaN(stage.y())) {
      console.warn("Stage position is invalid, resetting to default.");
      setPosition({ x: 0, y: 0 });
      return;
    }
  
    // Preserve zoom position relative to the pointer
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
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      draggable
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      ref={stageRef}
      onWheel={handleWheel}
      onDragMove={handleDragMove} 
      onDragEnd={handleDragEnd} 
    >
      <Layer>
        {background && <Image image={background} x={-4800} y={-2700} width={9600} height={5400} opacity={0.2} />}
      </Layer>

      <Layer>
        {systems.map((system, index) => (
          <Circle
            key={index}
            x={Number(system.posX)}
            y={-Number(system.posY)}
            radius={3}
            fill={factions[system.owner]?.colour || "gray"}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;

              const pointer = stage.getPointerPosition();
              if (!pointer) {

              console.warn("Pointer position is null, skipping tooltip update.");
              return;
              }
               // Get absolute mouse position relative to the viewport
               const pointerAbs = stage.getRelativePointerPosition() || { x: pointer.x, y: pointer.y };

              setTooltip({
                visible: true,
                text: `${system.name}\n${factions[system.owner]?.prettyName}\n(${system.posX}, ${system.posY})`,
                x: pointerAbs.x,
                y: pointerAbs.y,
              });
            }}
            onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
          />
        ))}
      </Layer>

      <Layer>
        {tooltip.visible && (
          <Label 
            x={tooltip.x} // Tooltip follows mouse directly
            y={tooltip.y} 
            opacity={0.75}
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
            <Text text={tooltip.text} fontFamily="Calibri" fontSize={18} padding={5} fill="black" />
          </Label>
        )}
      </Layer>
    </Stage>
  );
};
export const Map = GalaxyMap; 
export default GalaxyMap;