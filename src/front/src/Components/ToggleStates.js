import React from "react";
import { Stack, Checkbox } from "@chakra-ui/react";

const ToggleStates = ({ options, setOptions }) => {
  return (
    <Stack spacing={5} direction="row">
      <Checkbox
        isChecked={options.labels}
        onChange={(e) => setOptions({ ...options, labels: e.target.checked })}
      >
        View Labels
      </Checkbox>
      <Checkbox
        isChecked={options.formatAsTree}
        onChange={(e) =>
          setOptions({ ...options, formatAsTree: e.target.checked })
        }
      >
        Format as Tree
      </Checkbox>
      <Checkbox
        isChecked={options.sizeByGeneration}
        onChange={(e) =>
          setOptions({ ...options, sizeByGeneration: e.target.checked })
        }
      >
        {options.sizeByGeneration ? "Size by Generation" : "Size by Children"}
      </Checkbox>
      <Checkbox
        isChecked={options.colorByGeneration}
        onChange={(e) =>
          setOptions({ ...options, colorByGeneration: e.target.checked })
        }
      >
        {options.colorByGeneration ? "Color by Generation" : "Alternate Colors"}
      </Checkbox>
    </Stack>
  );
};

export default ToggleStates;
