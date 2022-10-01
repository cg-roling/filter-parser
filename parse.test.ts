import * as P from "parsimmon";

const binary = ["is equal to", "is not equal to"];
const unary = ["is null"];
const dateOperators = ["is before"];
const numericOperators = ["<", ">"];

const parseFilter = (filterString: string) => {
  const number = P.regexp(/[0-9.]+/); // TODO parsing a number is probably more complex
  const text = P.regexp(/[a-z ,A-Z0-9\\\._:-]*/); // TODO parsing a quoted string is probably a bit more complex than this
  const field = text.wrap(P.string("["), P.string("]"));
  const quoted = text.wrap(P.string('"'), P.string('"'));
  const date = text.wrap(P.string("#"), P.string("#"));

  const op = P.alt(...binary.map((x) => P.string(x)));
  const unaryOp = P.alt(...unary.map(P.string));
  const dateOp = P.alt(...dateOperators.map((x) => P.string(x)));
  const numOp = P.alt(...numericOperators.map((x) => P.string(x)));

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

const parseParens = unwrapParens(P.string("x"));

// (([City] is equal to "Dubuque"))
describe("parseFilter", () => {
  test("clause", () => {
    const input = `(((([City] is equal to "Dubuque"))))`;
    const expected = [
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("clause or", () => {
    const input = `(([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago"))`;
    const expected = [
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      "OR",
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Chicago",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("clause or or", () => {
    const input = `(([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago")) OR (([City] is equal to "New York"))`;
    const expected = [
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      "OR",
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Chicago",
      },
      "OR",
      {
        op: "is equal to",
        lhs: "City",
        rhs: "New York",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test.skip("nested or", () => {
    const input = `(([City] is equal to "Akron")) OR ((([City] is equal to "Aubrey")) OR (([City] is equal to "Dubuque")))`;
    const expected = [
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Akron",
      },
      "OR",
      [
        {
          op: "is equal to",
          lhs: "City",
          rhs: "Aubrey",
        },
        "OR",
        {
          op: "is equal to",
          lhs: "City",
          rhs: "Dubuque",
        },
      ],
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to", () => {
    const input = `(([City] is not equal to "Fennimore, WI"))`;
    const expected = [
      {
        op: "is not equal to",
        lhs: "City",
        rhs: "Fennimore, WI",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to and", () => {
    const input = `(([City] is not equal to "Fennimore, WI")) AND (([City] is not equal to "Chicago"))`;
    const expected = [
      {
        op: "is not equal to",
        lhs: "City",
        rhs: "Fennimore, WI",
      },
      "AND",
      {
        op: "is not equal to",
        lhs: "City",
        rhs: "Chicago",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("entry date", () => {
    const input = `(([EntryDate] is before #2022-09-01 12:00:00 AM#))`;
    const expected = [
      {
        op: "is before",
        lhs: "EntryDate",
        rhs: "2022-09-01 12:00:00 AM",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("number", () => {
    const input = `(([cgConsequenceOfFailureScore] < 5.0))`;
    const expected = [
      {
        op: "<",
        lhs: "cgConsequenceOfFailureScore",
        rhs: "5.0",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count", () => {
    const input = `(((((Count(([cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy] is equal to "Brian")) > 0)))))`;
    const expected = [
      {
        type: "Count",
        clause: {
          lhs: "cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy",
          op: "is equal to",
          rhs: "Brian",
        },
        op: ">",
        rhs: "0",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("unary", () => {
    const input = `(([cgInspections\\EnteredBy] is null))`;
    const expected = [
      {
        lhs: "cgInspections\\EnteredBy",
        op: "is null",
        rhs: undefined,
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count or", () => {
    const input = `(Count(([cgInspections\\EnteredBy] is null)) > 0) OR (([City] is equal to "Dubuque"))`;
    const expected = [
      {
        type: "Count",
        clause: {
          lhs: "cgInspections\\EnteredBy",
          op: "is null",
          rhs: undefined,
        },
        op: ">",
        rhs: "0",
      },
      "OR",
      {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
    ];
    expect(parseFilter(input)).toStrictEqual(expected);
  });
});
