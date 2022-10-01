import * as P from "parsimmon";

// An operator, ignoring leading/trailing whitespace
const operator = (strs: string[]) =>
  P.alt(...strs.map(P.string)).trim(P.optWhitespace);

// A parser wrapped in a single layer of parens.
const paren = <T>(p: P.Parser<T>) => P.string("(").then(p).skip(P.string(")"));

// A parser wrapped in any number of layers of parens.
export const parens = <T>(p: P.Parser<T>): P.Parser<T> => {
  const recur = P.lazy(() => paren(p).or(paren(recur)));
  return recur;
};

// A parser optinally wrapped in any number of layers of parens.
export const optParens = <T>(p: P.Parser<T>): P.Parser<T> => p.or(parens(p));

// Atoms
const number = P.regexp(/[0-9.]+/); // TODO probably too simple
const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO probably too simple

// Operator definitions include any whitespace around them
const unaryOp = operator(["is null"]);
const binaryOp = operator(["is equal to", "is not equal to"]);
const numOp = operator(["<", ">"]);
const dateOp = operator(["is before"]);
const condOp = operator(["AND", "OR"]);

const field = text.wrap(P.string("["), P.string("]"));
const quoted = text.wrap(P.string('"'), P.string('"'));
const date = text.wrap(P.string("#"), P.string("#"));

const unaryClause = P.seq(field, unaryOp);
const binaryClause = P.seq(field, binaryOp, quoted);
const numClause = P.seq(field, numOp, number);
const dateClause = P.seq(field, dateOp, date);

const lang = P.createLanguage({
  clause: (r) =>
    P.alt(unaryClause, binaryClause, numClause, dateClause).map(
      ([lhs, op, rhs]) => ({ lhs, op, rhs })
    ),
  conditionalChild: (r) =>
    parens(P.alt(r.countExpr, r.clause, r.conditionalExpr)),

  conditionalExpr: (r) =>
    P.seq(
      r.conditionalChild,
      condOp,
      r.conditionalExpr.or(r.conditionalChild)
    ).map(([lhs, op, rhs]) => ({ lhs, op, rhs })),

  countExpr: (r) =>
    P.string("Count")
      .then(P.seq(r.expression, numOp, number))
      .map(([lhs, op, rhs]) => ({ type: "Count", lhs, op, rhs })),

  expression: (r) => {
    return optParens(P.alt(r.conditionalExpr, r.countExpr, r.clause));
  },
});

export const parseFilter = (filterString: string) => {
  const result = lang.expression.parse(filterString);
  if (!result.status) throw result;
  return result.value;
};
