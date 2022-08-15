import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input, Flex, Button, Stack, Checkbox } from "@chakra-ui/react";
import { ForceGraph2D } from "react-force-graph";
import * as d3 from "d3";
import "./App.css";

import { QAS, MYN, LZA } from "./ExampleTrees"; // Preprocessed trees
import { K190072 } from "./ExampleBranches"; // Preprocessed branches
import Tooltip from "./Tooltip";
import Links from "./Links";
import ToggleStates from "./ToggleStates";

function App() {
  const [input, setInput] = useState(""); // User input
  const [tree, setTree] = useState({ nodes: [], links: [] }); // JSON formatted for force-graph component
  const [treeJSON, setTreeJSON] = useState({}); // JSON pulled from backend
  const [selectedNode, setSelectedNode] = useState(""); // Node clicked on by user
  const [highlightedNode, setHighlightedNode] = useState(""); // Node queried by user

  const fgRef = useRef(); // force-graph reference

  // User options
  const [options, setOptions] = useState({
    particles: true,
    labels: true,
    formatAsTree: true,
    sizeByGeneration: true,
    colorByGeneration: true,
  });

  // TODO: Change to not be hardcoded
  const getTree = () => {
    setSelectedNode("");

    // TODO: format checking for input

    if (input === "QAS") {
      setTreeJSON(QAS);
      reformatTree(QAS);
    } else if (input === "MYN") {
      setTreeJSON(MYN);
      reformatTree(MYN);
    } else if (input === "LZA") {
      setTreeJSON(LZA);
      reformatTree(LZA);
    }
  };

  // TODO: Change to not be hardcoded
  const getBranch = () => {
    setSelectedNode("");

    // TODO: format checking for input

    if (input === "K190072") {
      setHighlightedNode(input);
      setTreeJSON(K190072);
      reformatTree(K190072);
    }
  };

  // Reformat tree object for react-force-graph
  const reformatTree = (treeJSON) => {
    let res = { nodes: [], links: [] };
    let val = 1;
    for (let key in treeJSON.tree) {
      res.nodes.push({ id: key, name: key, value: val });
      treeJSON.tree[key].map((adj) =>
        res.links.push({ source: key, target: adj })
      );
      val++;
    }
    setTree(res);
  };

  // Adds collision forces
  useEffect(() => {
    const fg = fgRef.current;
    fg.d3Force("collide", d3.forceCollide(4));
  }, []);

  // Sets initial zoom size for each visualization
  useEffect(() => {
    fgRef.current.zoom(5, 10);
  }, [treeJSON]);

  // Computes node size based off generation
  const sizeByGen = (name) => {
    const VAL_DICT = [10, 2, 1];
    const DEFAULT = 0.5;
    let gen = treeJSON.info[name]["GENERATION"];
    return gen <= 2 ? VAL_DICT[gen] : DEFAULT;
  };

  // Node colors by generation
  const colorByGen = (name) => {
    const HIGHLIGHT_COLOR = "#f1f50a";
    const COLOR_DICT = ["#f56942", "#f5a442", "#f5d442", "#f5f542"];
    const DEFAULT = "#f6fc9a";
    const ODD_COLOR = "#008000";
    const EVEN_COLOR = "#FF0000";

    let gen = treeJSON.info[name]["GENERATION"];

    // Coloring gradient based off generation
    if (options.colorByGeneration) {
      return name === highlightedNode
        ? HIGHLIGHT_COLOR
        : gen <= 3
        ? COLOR_DICT[gen]
        : DEFAULT;
    }

    // Alternative coloring that just alternates color
    return name === highlightedNode
      ? HIGHLIGHT_COLOR
      : gen % 2
      ? ODD_COLOR
      : EVEN_COLOR;
  };

  // Compute node size based off number of children
  const sizeByChildren = (name) => {
    return treeJSON.tree[name].length;
  };

  return (
    <Flex flex={1} align="center" direction="column" padding="10px">
      <Stack width="100%" direction="column" align="center">
        <Stack direction="row" flex={1}>
          <Input
            placeholder="Search by Product Code or 510K Number"
            onChange={(e) => setInput(e.target.value)}
            value={input}
            maxWidth="500px"
          />
          <Button width="200px" margin="5px" onClick={getTree}>
            Get Tree
          </Button>
          <Button width="200px" margin="5px" onClick={getBranch}>
            Get Branch
          </Button>
        </Stack>

        {/* User options */}
        <ToggleStates options={options} setOptions={setOptions} />

        {/* Tooltip and Links */}
        {selectedNode && (
          <Tooltip
            treeJSON={treeJSON}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
          />
        )}
        {selectedNode && <Links selectedNode={selectedNode} />}

        {/* Predicate tree visualization */}
        {tree && (
          <ForceGraph2D
            ref={fgRef}
            nodeCanvasObjectMode={() => "after"}
            // Draw labels
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name;
              ctx.font = `${Math.sqrt(sizeByGen(label)) * 2}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.testBaseline = "middle";
              ctx.fillStyle = "black";
              if (options.labels) ctx.fillText(label, node.x, node.y + 6);
            }}
            // Format the tree as top-down DAG
            dagMode={options.formatAsTree ? "td" : "zout"}
            // Particles to indicate relationship direction
            linkDirectionalParticles={options.particles ? 3 : 0}
            linkDirectionalParticleSpeed={0.002}
            // Node styling
            nodeVal={(e) =>
              options.sizeByGeneration
                ? sizeByGen(e.name)
                : sizeByChildren(e.name)
            }
            nodeColor={(e) => colorByGen(e.name)}
            minZoom={1}
            graphData={tree}
            nodeOpacity={0.25}
            warmupTicks={100}
            cooldownTicks={100}
            onNodeClick={(n) => setSelectedNode(n.name)}
          />
        )}
      </Stack>
    </Flex>
  );
}

export default App;
