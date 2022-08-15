import React from "react";
import { Flex } from "@chakra-ui/react";
import LinkButton from "./LinkButton";

const Links = ({ selectedNode }) => {
  return (
    <Flex flex={1} width="100%" maxWidth="600px" direction="row">
      <LinkButton name="Image 2000" selectedNode={selectedNode} />
      <LinkButton name="CTS" selectedNode={selectedNode} />
      <LinkButton name="Sharepoint" selectedNode={selectedNode} />
    </Flex>
  );
};

export default Links;
