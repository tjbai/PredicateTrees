import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input, Flex, Button, Stack, Checkbox } from "@chakra-ui/react";
import { ForceGraph2D } from "react-force-graph";
import * as d3 from "d3";
import "./App.css";

import { QAS, MYN, LZA } from "./ExampleTrees"; // Preprocessed trees
import { K203191, K221248 } from "./ExampleBranches"; // Preprocessed branches
import Tooltip from "./Tooltip";
import Links from "./Links";

function App() {
  const [input, setInput] = useState("");
  const [tree, setTree] = useState({ nodes: [], links: [] });
  const [treeJSON, setTreeJSON] = useState({});
  const [selectedNode, setSelectedNode] = useState("");

  const fgRef = useRef();

  // Toggle-able states
  const [particles, setParticles] = useState(true);
  const [labels, setLabels] = useState(true);
  const [treeFormat, setTreeFormat] = useState(false);
  const [sizeByGeneration, setSizeByGeneration] = useState(true);

  // TODO: Adapt getTree and getBranch to whatever database/api
  const getTree = () => {
    setSelectedNode("");

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

  const getBranch = () => {
    setSelectedNode("");

    if (input === "K203191") {
      setTreeJSON(K203191);
      reformatTree(K203191);
    } else if (input === "K221248") {
      setTreeJSON(K221248);
      reformatTree(K221248);
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
    const VAL_DICT = [10, 3, 2];
    const DEFAULT = 0.5;
    let gen = treeJSON.info[name]["GENERATION"];
    return gen <= 2 ? VAL_DICT[gen] : DEFAULT;
  };

  // Node colors by generation
  const colorByGen = (name) => {
    const COLOR_DICT = ["#f56942", "#f5a442", "#f5d442", "#f5f542"];
    const DEFAULT = "#f6fc9a";
    let gen = treeJSON.info[name]["GENERATION"];
    return gen <= 3 ? COLOR_DICT[gen] : DEFAULT;
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
        <Stack spacing={5} direction="row">
          <Checkbox
            isChecked={particles}
            onChange={(e) => setParticles(e.target.checked)}
          >
            Enable Particles
          </Checkbox>
          <Checkbox
            isChecked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          >
            View Labels
          </Checkbox>
          <Checkbox
            isChecked={treeFormat}
            onChange={(e) => setTreeFormat(e.target.checked)}
          >
            Format as Tree
          </Checkbox>
          <Checkbox
            isChecked={sizeByGeneration}
            onChange={(e) => setSizeByGeneration(e.target.checked)}
          >
            {sizeByGeneration ? "Size by Generation" : "Size by Children"}
          </Checkbox>
        </Stack>

        {/* Tooltip and Links */}
        {selectedNode && (
          <Tooltip treeJSON={treeJSON} selectedNode={selectedNode} />
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
              if (labels) ctx.fillText(label, node.x, node.y + 6);
            }}
            // Format the tree as top-down DAG
            dagMode={treeFormat ? "td" : "zout"}
            // Particles to indicate relationship direction
            linkDirectionalParticles={particles ? 3 : 0}
            linkDirectionalParticleSpeed={0.002}
            // Node styling
            nodeVal={(e) =>
              sizeByGeneration ? sizeByGen(e.name) : sizeByChildren(e.name)
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
