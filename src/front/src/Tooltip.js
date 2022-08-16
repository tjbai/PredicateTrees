import React, { useEffect, useState } from "react";
import { Flex, Text, Stack, Button } from "@chakra-ui/react";

const Tooltip = ({ treeJSON, selectedNode, setSelectedNode }) => {
  const [predicate, setPredicate] = useState("");

  const findPredicate = () => {
    for (let key in treeJSON.tree) {
      if (treeJSON.tree[key].find((e) => e === selectedNode)) return key;
    }
    return null;
  };

  useEffect(() => {
    console.log(treeJSON);
  }, [treeJSON]);

  useEffect(() => {
    setPredicate(findPredicate);
  }, [selectedNode, treeJSON]);

  return (
    <Flex flex={1} width="100%" maxWidth="600px" direction="column">
      <Flex
        flex={1}
        border="2px solid"
        borderColor="gray.100"
        borderRadius="10px"
      >
        <Stack flex={1} m="10px">
          <Text>
            <b>Device Name:</b>{" "}
            {treeJSON.info[selectedNode]["DEVICE_TRADE_NAME"]}
          </Text>
          <Text>
            <b>Product Code(s):</b>{" "}
            {treeJSON.info[selectedNode]["PRODUCT_CODES"]}
          </Text>
          <Text>
            <b>Decision Date:</b> {treeJSON.info[selectedNode]["DECISION_DATE"]}
          </Text>
        </Stack>
        <Stack flex={1} m="10px">
          <Text>
            <b>Predicate:</b> {predicate}
          </Text>
          <Text>
            <b>Number of Children: </b>
            {treeJSON.tree[selectedNode].length}
          </Text>
          <Text>
            <b>Generation:</b> {treeJSON.info[selectedNode]["GENERATION"]}
          </Text>
        </Stack>
        <Flex
          height="100%"
          width="5%"
          bg="gray.100"
          justify="center"
          align="center"
          fontWeight="bold"
          borderRadius="inherit"
          border="2px solid"
          borderColor="inherit"
          onClick={() => setSelectedNode("")}
          _hover={{ bg: "gray.400", cursor: "pointer" }}
        >
          X
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Tooltip;
