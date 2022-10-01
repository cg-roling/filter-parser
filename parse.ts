import * as P from "parsimmon";

// Utilities
const oneOfString = (strs: string[]) =>
  P.alt(...strs.map(P.string)).trim(P.optWhitespace);

// Atoms
const number = P.regexp(/[0-9.]+/); // TODO probably too simple
const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO probably too simple

// Operator definitions include any whitespace around them
const unaryOp = oneOfString(["is null"]);
const binaryOp = oneOfString(["is equal to", "is not equal to"]);
const numOp = oneOfString(["<", ">"]);
const dateOp = oneOfString(["is before"]);
const condOp = oneOfString(["AND", "OR"]);

const field = text.wrap(P.string("["), P.string("]"));
const quoted = text.wrap(P.string('"'), P.string('"'));
const date = text.wrap(P.string("#"), P.string("#"));

const unaryClause = P.seq(field, unaryOp);
const binaryClause = P.seq(field, binaryOp, quoted);
const numClause = P.seq(field, numOp, number);
const dateClause = P.seq(field, dateOp, date);

const clause = P.alt(unaryClause, binaryClause, numClause, dateClause).map(
  ([lhs, op, rhs]) => ({ lhs, op, rhs })
);

// UTILS
const unwrapParens = <T>(p: P.Parser<T>): P.Parser<T> => {
  const recur = P.lazy(() =>
    P.string("(").then(recur.or(p)).skip(P.string(")"))
  );
  return recur;
};

// countExpr and conditional are mutually recursive - they can contain each other

const countOrConditional: P.Parser<any> = P.lazy(() => {
  const countExpr = P.seq(
    P.string("Count"),
    P.alt(countOrConditional, unwrapParens(clause)),
    numOp,
    number
  ).map(([_, c, o, v]) => ({ type: "Count", clause: c, op: o, rhs: v }));

  const conditional = P.lazy(() => {
    const ggg: P.Parser<any> = P.alt(
      unwrapParens(countExpr),
      unwrapParens(clause),
      unwrapParens(conditional)
    );

    return P.seq(ggg, P.seq(condOp, ggg).atLeast(1)).map(([clause, conds]) => [
      clause,
      ...conds.flat(),
    ]);
  });

  return conditional.or(unwrapParens(countExpr));
});

const filter = P.alt(countOrConditional, unwrapParens(clause));

export const parseFilter = (filterString: string) => {
  const result = filter.parse(filterString);
  if (!result.status) throw result;
  return result.value;
};
