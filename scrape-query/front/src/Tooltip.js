import React, { useEffect, useState } from "react";
import { Flex, Text, Stack } from "@chakra-ui/react";

const Tooltip = ({ treeJSON, selectedNode }) => {
  const [predicate, setPredicate] = useState("");

  const findPredicate = () => {
    for (let key in treeJSON.tree) {
      if (treeJSON.tree[key].find((e) => e === selectedNode)) return key;
    }
    return null;
  };

  useEffect(() => {
    setPredicate(findPredicate);
  }, [selectedNode, treeJSON]);

  return (
    <Flex
      flex={1}
      width="100%"
      maxWidth="600px"
      padding="10px"
      border="2px solid"
      borderColor="gray.100"
      borderRadius="10px"
      direction="row"
    >
      <Stack flex={1}>
        <Text>
          <b>510k Number: </b> {selectedNode}
        </Text>
        <Text>
          <b>Device Name:</b> {treeJSON.info[selectedNode]["DEVICE_TRADE_NAME"]}
        </Text>
        <Text>
          <b>Product Code(s):</b> {treeJSON.info[selectedNode]["PRODUCT_CODES"]}
        </Text>
        <Text>
          <b>Decision Date:</b> {treeJSON.info[selectedNode]["DECISION_DATE"]}
        </Text>
      </Stack>
      <Stack flex={1}>
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
    </Flex>
  );
};

export default Tooltip;
