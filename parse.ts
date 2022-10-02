import P from "parsimmon";

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
const number = P.regexp(/[0-9.]+/); // TODO probably too simple
const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO probably too simple
const field = text.wrap(P.string("["), P.string("]"));
const quoted = text.wrap(P.string('"'), P.string('"'));
const date = text.wrap(P.string("#"), P.string("#"));

// Operator definitions discard any whitespace around them
const unaryOp = operator(["is null"]);
const binaryOp = operator(["is equal to", "is not equal to"]);
const numOp = operator(["<", ">"]);
const dateOp = operator(["is before"]);
const condOp = operator(["AND", "OR"]);

// Comparisons
const unaryCompare = P.seq(field, unaryOp);
const binaryCompare = P.seq(field, binaryOp, quoted);
const numCompare = P.seq(field, numOp, number);
const dateCompare = P.seq(field, dateOp, date);

const lang = P.createLanguage({
  expression: (r) => optParens(P.alt(r.andOr, r.count, r.compare)),

  compare: (r) =>
    P.alt(unaryCompare, binaryCompare, numCompare, dateCompare).map(
      ([lhs, op, rhs]) => ({ lhs, op, rhs })
    ),

  count: (r) =>
    P.string("Count")
      .then(P.seq(r.expression, numOp, number))
      .map(([lhs, op, rhs]) => ({ type: "Count", lhs, op, rhs })),

  andOr: (r) =>
    P.seq(parens(r.expression), condOp, r.expression).map(([lhs, op, rhs]) => ({
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
