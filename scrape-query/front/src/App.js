import React, { useState, useCallback } from "react";
import { Input, Flex, Button, Stack, Text } from "@chakra-ui/react";
import axios from "axios";
import "./App.css";

function App() {
  const [pcode, setPCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState("Nothing for now...");

  const getTree = useCallback(async () => {
    setLoading(true);
    console.log("clicked");
    try {
      const update = await axios
        .post("http://127.0.0.1:5000/tree", {
          pcode: pcode,
        })
        // .then((res) => console.log(res.data));
        .then((res) => setTree(JSON.stringify(res.data)));
    } catch (e) {
      console.log("fetching tree: ", e);
    }
  }, [pcode]);

  return (
    <Flex flex={1} align="center" direction="column" padding="10px">
      <Stack width="500px" direction="column">
        <Input
          placeholder="Search by Product Code or 510K Number"
          onChange={(e) => setPCode(e.target.value)}
          value={pcode}
        />
        <Flex justify="space-between">
          <Button flex={1} margin="5px" onClick={getTree}>
            Get Tree
          </Button>
          <Button flex={1} margin="5px">
            Get Branch
          </Button>
        </Flex>
        <Text>{tree}</Text>
      </Stack>
    </Flex>
  );
}

export default App;
