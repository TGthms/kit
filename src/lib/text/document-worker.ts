import YAML from "yaml";
import { csvToJson, jsonToCsv, parseToolYaml } from "./core";
import { parseToolJson, assertTextBudget } from "./budget";
self.onmessage = ({ data }: MessageEvent<{ input: string; from: string; to: string; spreadsheetSafe: boolean }>) => {
  try {
    assertTextBudget(data.input);
    let text: string;
    if (data.from === "yaml" && data.to === "json") text = JSON.stringify(parseToolYaml(data.input), null, 2);
    else if ((data.from === "json" || data.from === "text") && data.to === "yaml") text = YAML.stringify(parseToolJson(data.input));
    else {
      const result = data.from === "csv" && data.to === "json" ? csvToJson(data.input)
        : data.from === "json" && data.to === "csv" ? jsonToCsv(data.input, data.spreadsheetSafe) : null;
      if (!result) throw new Error("Unsupported conversion pair");
      if (!result.ok) throw new Error(result.error);
      text = result.text;
    }
    self.postMessage({ ok: true, text });
  } catch (error) { self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) }); }
};
