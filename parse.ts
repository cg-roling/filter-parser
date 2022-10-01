import * as P from "parsimmon";

// Operator definitions
const binary = ["is equal to", "is not equal to"];
const unary = ["is null"];
const dateOperators = ["is before"];
const numericOperators = ["<", ">"];

// Atoms
const number = P.regexp(/[0-9.]+/); // TODO parsing a number is probably more complex
const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO parsing a quoted string is probably a bit more complex than this
const field = text.wrap(P.string("["), P.string("]"));
const quoted = text.wrap(P.string('"'), P.string('"'));
const date = text.wrap(P.string("#"), P.string("#"));

const op = P.alt(...binary.map(P.string));
const unaryOp = P.alt(...unary.map(P.string));
const dateOp = P.alt(...dateOperators.map(P.string));
const numOp = P.alt(...numericOperators.map(P.string));

const stringClause = P.seq(
  field.skip(P.whitespace),
  op.skip(P.whitespace),
  quoted
);

const unaryClause = P.seq(field.skip(P.whitespace), unaryOp);

const dateClause = P.seq(
  field.skip(P.whitespace),
  dateOp.skip(P.whitespace),
  date
);

const numClause = P.seq(
  field.skip(P.whitespace),
  numOp.skip(P.whitespace),
  number
);

export const parseFilter = (filterString: string) => {
  const clause = unwrapParens(
    P.alt(stringClause, dateClause, numClause, unaryClause).map(
      ([lhs, op, rhs]) => ({
        lhs,
        op,
        rhs,
      })
    )
  );

  const group: P.Parser<any> = P.lazy(() => {
    const countExpr = unwrapParens(
      P.seq(
        P.string("Count"),
        group.skip(P.whitespace),
        numOp.skip(P.whitespace),
        number
      ).map(([_, c, o, v]) => ({
        type: "Count",
        clause: c,
        op: o,
        rhs: v,
      }))
    );

    return countExpr.or(clause);
  });

  const condOp = P.alt(
    P.string("AND").trim(P.optWhitespace),
    P.string("OR").trim(P.optWhitespace)
  );

  const cond = P.seq(condOp, group);

  const conditional = P.seq(group, cond.many()).map(([clause, conds]) => [
    clause,
    ...conds.flat(),
  ]);

  const filter = P.alt(conditional, group);

  const result = filter.parse(filterString);
  if (result.status) {
    return result.value;
  } else {
    throw result;
  }
};

const unwrapParens = <T>(p: P.Parser<T>): P.Parser<T> => {
  const unwrapRecur = P.lazy(() =>
    P.string("(").then(unwrapRecur.or(p)).skip(P.string(")"))
  );
  return unwrapRecur;
};
