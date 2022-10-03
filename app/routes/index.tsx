import { useState } from "react";
import { AndOr, Compare, Count, parseFilter } from "../../parse";

function ValueView(props: { value: { type: string; value: string } }) {
  return <span>{props.value.value}</span>;
}

function ExprView(props: { expr: Compare | Count | AndOr | any }) {
  const { expr } = props;
  if (!expr) return <span>?</span>;
  if (typeof expr === "string") return <span>{expr}</span>;
  if (expr.type === "Compare") return <CompareView expr={expr} />;
  if (expr.type === "Count") return <CountView expr={expr} />;
  if (expr.type === "AndOr") return <AndOrView expr={expr} />;
  if (expr.type === "string") return <span>"{expr.value}"</span>;
  if (expr.type === "date") return <span>#{expr.value}#</span>;
  if (expr.type === "number") return <span>{expr.value}</span>;
  if (expr.type === "field") return <span>[{expr.value}]</span>;
  return <span>💣</span>;
}

function CompareView(props: { expr: Compare }) {
  const [{ lhs, rhs, op }] = [props.expr];
  return (
    <View label="COMPARE" color="pink">
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
            {[lhs, op, rhs].map((x) => (
              <td style={{ padding: " 0 1em" }}>
                <ExprView expr={x} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </View>
  );
}

function CountView(props: { expr: Count }) {
  const { lhs, op, rhs } = props.expr;
  return (
    <View color="deepskyblue" label="COUNT">
      Count (<ExprView expr={lhs} />) {op} <ExprView expr={rhs} />
      ")
    </View>
  );
}

function AndOrView(props: { expr: AndOr }) {
  const { lhs, op, rhs } = props.expr;
  return (
    <View color="orange" label="AND/OR">
      (<ExprView expr={lhs} />) {op} (<ExprView expr={rhs} />)
    </View>
  );
}

function View(props: { children: any; label: string; color: string }) {
  return (
    <div
      style={{
        border: "1px solid black",
        position: "relative",
        background: props.color,
        padding: "1em",
        margin: "1em",
      }}
    >
      <Label>{props.label}</Label>
      {props.children}
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
    `(Count(([cgInspections\\EntryDate] is not within the last [] days 10)) > 0) OR (([City] is equal to "Dubuque"))`
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
