import { useState } from "react";
import { AndOr, Compare, Count, parseFilter } from "../../parse";

function ExprView(props: { expr: Compare | Count | AndOr }) {
  const { expr } = props;
  if (expr.type === "Compare") return <CompareView expr={expr} />;
  if (expr.type === "Count") return <CountView expr={expr} />;
  if (expr.type === "AndOr") return <AndOrView expr={expr} />;
  return <span>💣</span>;
}

function CompareView(props: { expr: Compare }) {
  const { expr } = props;
  return (
    <div
      style={{
        border: "1px solid black",
        padding: "1em",
        position: "relative",
        background: "pink",
        margin: "1em",
      }}
    >
      <Label>COMPARE</Label>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Operator</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: " 0 1em" }}>[{expr.lhs}]</td>
            <td style={{ padding: " 0 1em" }}>{expr.op}</td>
            <td style={{ padding: " 0 1em" }}>"{expr.rhs}"</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CountView(props: { expr: Count }) {
  const { expr } = props;
  return (
    <div
      style={{
        border: "1px solid black",
        position: "relative",
        background: "deepskyblue",
        padding: "1em",
        margin: "1em",
      }}
    >
      <Label>Count</Label>
      Count (<ExprView expr={expr.lhs} />) {expr.op} "{expr.rhs}")
    </div>
  );
}

function AndOrView(props: { expr: AndOr }) {
  const { expr } = props;
  return (
    <div
      style={{
        border: "1px solid black",
        position: "relative",
        background: "orange",
        padding: "1em",
        margin: "1em",
      }}
    >
      <Label>AND/OR</Label>
      (<ExprView expr={expr.lhs} />) {expr.op} (<ExprView expr={expr.rhs} />)
    </div>
  );
}

function Label(props: any) {
  return (
    <div
      style={{
        borderBottom: "1px solid black",
        borderRight: "1px solid black",
        fontSize: "75%",
        background: "#eee",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {props.children}
    </div>
  );
}

export default function Index() {
  const [exampleFilter, setExampleFilter] = useState(
    `(Count(([cgInspections\\EnteredBy] is not within the last 10 days)) > 0) OR (([City] is equal to "Dubuque"))`
  );
  const onChange = (evt: any) => setExampleFilter(evt.target.value);
  const parsed = parse(exampleFilter);
  console.log(parsed);

  return (
    <div>
      <h1>Input</h1>
      <textarea
        style={{ width: "100%", height: "4em" }}
        onChange={onChange}
        value={exampleFilter}
      ></textarea>
      <h1>Visualizer</h1>
      <div>
        <ExprView expr={parsed} />
      </div>
      <h1>JSON Output</h1>
      <pre>{JSON.stringify(parsed, null, 4)}</pre>
    </div>
  );
}

function parse(filter: string) {
  try {
    return parseFilter(filter);
  } catch {
    return "";
  }
}
