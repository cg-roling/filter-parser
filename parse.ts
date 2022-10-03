import P from "parsimmon";

const unary = [
  "is null",
  "is not null",
  "is equal to null",
  "is not equal to null",
  "is now ",
  "is today",
  "before today",
  "after today",
  "through today",
  "from today ",
  "is not today",
  "is not now",
  "was last week",
  "was last month",
  "was last quarter",
  "was last year",
  "is this week",
  "is this month",
  "is this quarter",
  "is this year",
  "is next week",
  "is next month",
  "is next quarter",
  "is next year",
];

const integerDate = [
  "before [] months from now",
  "after [] months from now",
  "before [] hours from now",
  "before [] years from now",
  "before [] days from now",
  "after [] hours from now",
  "after [] years from now",
  "after [] days from now",
  "within the last [] months",
  "within the next [] months",
  "before [] months ago",
  "within the last [] years",
  "within the next [] years",
  "before [] hours ago",
  "after [] months ago",
  "before [] years ago",
  "within the last [] days",
  "within the next [] days",
  "after [] hours ago",
  "after [] years ago",
  "before [] days ago",
  "after [] days ago",
].flatMap((x) => ["is " + x, "is not " + x]);

export interface Compare {
  type: "Compare";
  op: string;
  lhs: any;
  rhs: any;
}

export interface Count {
  type: "Count";
  lhs: Compare;
  op: string;
  rhs: any;
}

export interface AndOr {
  type: "AndOr";
  lhs: any;
  op: string;
  rhs: any;
}

// An operator, discarding leading/trailing whitespace
const operator = (strs: string[]) =>
  P.alt(...strs.map(P.string)).trim(P.optWhitespace);

// A parser wrapped in a single layer of parens.
const paren = <T>(p: P.Parser<T>) => P.string("(").then(p).skip(P.string(")"));

// A parser wrapped in any number of layers of parens.
export const parens = <T>(p: P.Parser<T>): P.Parser<T> => {
  const recur: P.Parser<any> = P.lazy(() => paren(p).or(paren(recur)));
  return recur;
};

// A parser optinally wrapped in any number of layers of parens.
export const optParens = <T>(p: P.Parser<T>): P.Parser<T> => p.or(parens(p));

// Atoms
const number = P.regexp(/[0-9.]+/).map((value) => ({ type: "number", value })); // TODO probably too simple
const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO probably too simple
const field = text
  .wrap(P.string("["), P.string("]"))
  .map((value) => ({ type: "field", value }));
const quoted = text
  .wrap(P.string('"'), P.string('"'))
  .map((value) => ({ type: "string", value }));
const date = text
  .wrap(P.string("#"), P.string("#"))
  .map((value) => ({ type: "date", value }));

// Operator definitions discard any whitespace around them
const unaryOp = operator(unary);
const binaryOp = operator(["is equal to", "is not equal to"]);
const integerDateOp = operator(integerDate);
const numOp = operator(["=", "<>", "<", ">", "<=", ">="]);
const dateOp = operator(["is before"]);
const condOp = operator(["AND", "OR"]);

// Comparisons
const unaryCompare = P.seq(field, unaryOp);
const integerDateCompare = P.seq(field, integerDateOp, number);
const binaryCompare = P.seq(field, binaryOp, P.alt(quoted, field));
const numCompare = P.seq(field, numOp, P.alt(number, field));
const dateCompare = P.seq(field, dateOp, P.alt(date, field));

const compare: P.Parser<Compare> = P.alt(
  unaryCompare,
  integerDateCompare,
  binaryCompare,
  numCompare,
  dateCompare
).map(([lhs, op, rhs]) => {
  if (typeof op === "string") return { type: "Compare", lhs, op, rhs };
  else return { type: "Compare", lhs, op: op[0], rhs: op[1] };
});

const lang = P.createLanguage({
  expression: (r) => optParens(P.alt(r.andOr, r.count, compare)),

  count: (r) =>
    P.string("Count")
      .then(P.seq(r.expression, numOp, number))
      .map(([lhs, op, rhs]) => ({ type: "Count", lhs, op, rhs })),

  andOr: (r) =>
    P.seq(parens(r.expression), condOp, r.expression).map(([lhs, op, rhs]) => ({
      type: "AndOr",
      lhs,
      op,
      rhs,
    })),
});

export const parseFilter = (filterString: string) => {
  const result = lang.expression.parse(filterString);
  if (!result.status) throw result;
  return result.value;
};
