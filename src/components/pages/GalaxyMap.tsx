import { useEffect, useState, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Image, Circle, Text, Label, Tag } from "react-konva";
import galaxyBackground from "/src/assets/galaxyBackground2.svg";

const GalaxyMap = () => {
  // Reference to the Konva Stage element, used for zoom and drag operations
  const stageRef = useRef<Konva.Stage | null>(null);

  // State to store the background image once it's loaded
  const [background, setBackground] = useState<HTMLImageElement | null>(null);

  // State to store the list of star systems, each with position, name, and owner
  const [systems, setSystems] = useState<{ posX: string; posY: string; name: string; owner: string }[]>([]);

  // State to store faction data, where each faction has a color and a pretty name
  const [factions, setFactions] = useState<{ [key: string]: { colour: string; prettyName: string } }>({});

  // State to handle tooltip visibility and position
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  // State to manage zoom level (scaling factor)
  const [scale, setScale] = useState(1);

  // State to track the stage position for panning
  const [position, setPosition] = useState({ x: 600, y: 400 });

  useEffect(() => {
    // Load the background image and set it in state
    const image = new window.Image();
    image.src = galaxyBackground;
    image.onload = () => setBackground(image);

    // Fetch star system and faction data from the API
    const fetchData = async () => {
      try {
        const [systemData, factionData] = await Promise.all([
          fetch("https://roguewar.org/api/v1/starmap/warmap").then(res => res.json()),
          fetch("https://roguewar.org/api/v1/factions/warmap").then(res => res.json()),
        ]);

        // Add a default faction for systems with no owner
        factionData["NoFaction"] = {
          colour: "gray",
          prettyName: "Unaffiliated",
        };

        // Update state with fetched data
        setSystems(systemData);
        setFactions(factionData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []); // Runs only once when the component mounts

  // Handles zooming in and out with the mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.25; // Defines the zoom factor

    // Ensure the stage reference exists
    const stage = stageRef.current;
    if (!stage) {
      console.warn("Stage reference is null, skipping zoom.");
      return;
    }

    // Ensure pointer position is valid
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.warn("Pointer position is null, skipping zoom.");
      return;
    }

    // Determine the new scale based on scroll direction
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Ensure stage position is valid
    if (isNaN(stage.x()) || isNaN(stage.y())) {
      console.warn("Stage position is invalid, resetting to default.");
      setPosition({ x: 0, y: 0 });
      return;
    }

    // Adjust stage position to zoom relative to the pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Update scale and position
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Handles dragging movement of the stage
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // Handles the end of dragging, ensuring the new position is set
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Stage
      width={window.innerWidth} // Stage width set to full window
      height={window.innerHeight} // Stage height set to full window
      draggable // Allows panning by dragging
      scaleX={scale} // Sets horizontal zoom scale
      scaleY={scale} // Sets vertical zoom scale
      x={position.x} // Sets x position of stage
      y={position.y} // Sets y position of stage
      ref={stageRef} // Assigns stage reference
      onWheel={handleWheel} // Handles zooming
      onDragMove={handleDragMove} // Handles dragging movement
      onDragEnd={handleDragEnd} // Handles end of dragging
    >
      {/* Background layer */}
      <Layer>
        {background && <Image image={background} x={-4800} y={-2700} width={9600} height={5400} opacity={0.2} />}
      </Layer>

      {/* Star system layer */}
      <Layer>
        {systems.map((system, index) => (
          <Circle
            key={index}
            x={Number(system.posX)} // Converts stored X position to number
            y={-Number(system.posY)} // Converts and negates Y position to match coordinate system
            radius={3} // Size of the star system marker
            fill={factions[system.owner]?.colour || "gray"} // Uses faction color or gray as default
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;

              const pointer = stage.getPointerPosition();
              if (!pointer) {
                console.warn("Pointer position is null, skipping tooltip update.");
                return;
              }

              // Get absolute mouse position relative to viewport
              const pointerAbs = stage.getRelativePointerPosition() || { x: pointer.x, y: pointer.y };

              // Show tooltip with system name, faction, and coordinates
              setTooltip({
                visible: true,
                text: `${system.name}\n${factions[system.owner]?.prettyName}\n(${system.posX}, ${system.posY})`,
                x: pointerAbs.x,
                y: pointerAbs.y,
              });
            }}
            onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })} // Hide tooltip on mouse leave
          />
        ))}
      </Layer>

      {/* Tooltip layer */}
      <Layer>
        {tooltip.visible && (
          <Label 
            x={tooltip.x} // Tooltip follows mouse directly
            y={tooltip.y} 
            opacity={0.75}
          >
            <Tag
              fill="white" // Tooltip background color
              pointerDirection="down" // Pointer direction for tooltip arrow
              pointerWidth={10}
              pointerHeight={10}
              shadowColor="gray" // Adds slight shadow effect
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

// Export component for use in the application
export const Map = GalaxyMap; 
export default GalaxyMap;
