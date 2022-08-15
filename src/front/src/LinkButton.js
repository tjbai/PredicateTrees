import React, { useEffect, useState } from "react";
import { Button, Link } from "@chakra-ui/react";

const LinkButton = ({ name, selectedNode }) => {
  const [url, setURL] = useState("");

  // prettier-ignore
  useEffect(() => {
    if (name === "Image 2000") {
      setURL(
        `http://i2kplus.fda.gov/i2kplus?folderId=${selectedNode.split("/")[0]}`
      );
    } else if (name === "CTS") {
      setURL(
        `http://cts.fda.gov/division-tracking/findTrackable.do?docNum=${selectedNode}`
      );
    } else if (name === "Sharepoint") {
      setURL(
        `https://fda.sharepoint.com/sites/CDRH-OSEL-DIDSR/Shared%20Documents/Regulatory/Consults/${selectedNode.substring(0,3)}/${selectedNode}/`
      );
    }
  }, [selectedNode]);

  return (
    <Button flex={1} borderRadius="0px">
      <Link href={url} isExternal>
        To {name}
      </Link>
    </Button>
  );
};

export default LinkButton;
