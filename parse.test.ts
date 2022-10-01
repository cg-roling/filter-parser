import * as P from "parsimmon";
import { parseFilter, unwrapParens } from "./parse";

const x = P.string("x");
const or = P.string("|");
const zzz = P.lazy(() => {
  return P.seq(x, or, zzz.or(x));
});

// (([City] is equal to "Dubuque"))
describe("parseFilter", () => {
  test("zzz", () => {
    expect(zzz.parse("x|x")).toStrictEqual({
      status: true,
      value: ["x", "|", "x"],
    });
  });

  test("zzz", () => {
    expect(zzz.parse("x|x|x")).toStrictEqual({
      status: true,
      value: ["x", "|", ["x", "|", "x"]],
    });
  });

  test("clause", () => {
    const input = `(((([City] is equal to "Dubuque"))))`;
    const expected = {
      op: "is equal to",
      lhs: "City",
      rhs: "Dubuque",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("clause or", () => {
    const input = `(([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago"))`;
    const expected = {
      op: "OR",
      lhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Chicago",
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("wrapped clause or", () => {
    const input = `((([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago")))`;
    const expected = {
      op: "OR",
      lhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Chicago",
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("clause or or", () => {
    const input = `(([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago")) OR (([City] is equal to "New York"))`;
    const expected = {
      op: "OR",
      lhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        op: "OR",
        lhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "Chicago",
        },
        rhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "New York",
        },
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("nested or", () => {
    const input = `(([City] is equal to "Akron")) OR ((([City] is equal to "Aubrey")) OR (([City] is equal to "Dubuque")))`;
    const expected = {
      op: "OR",
      lhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Akron",
      },
      rhs: {
        op: "OR",
        lhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "Aubrey",
        },
        rhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "Dubuque",
        },
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("left nested or", () => {
    const input = `((([City] is equal to "Akron")) OR (([City] is equal to "Aubrey"))) OR (([City] is equal to "Dubuque"))`;
    const expected = {
      op: "OR",
      lhs: {
        op: "OR",
        lhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "Akron",
        },
        rhs: {
          op: "is equal to",
          lhs: "City",
          rhs: "Aubrey",
        },
      },
      rhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to", () => {
    const input = `(([City] is not equal to "Fennimore, WI"))`;
    const expected = {
      op: "is not equal to",
      lhs: "City",
      rhs: "Fennimore, WI",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to and", () => {
    const input = `(([City] is not equal to "Fennimore, WI")) AND (([City] is not equal to "Chicago"))`;
    const expected = {
      op: "AND",
      lhs: {
        op: "is not equal to",
        lhs: "City",
        rhs: "Fennimore, WI",
      },
      rhs: {
        op: "is not equal to",
        lhs: "City",
        rhs: "Chicago",
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("entry date", () => {
    const input = `(([EntryDate] is before #2022-09-01 12:00:00 AM#))`;
    const expected = {
      op: "is before",
      lhs: "EntryDate",
      rhs: "2022-09-01 12:00:00 AM",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("number", () => {
    const input = `(([cgConsequenceOfFailureScore] < 5.0))`;
    const expected = {
      op: "<",
      lhs: "cgConsequenceOfFailureScore",
      rhs: "5.0",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count", () => {
    const input = `(((((Count(([cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy] is equal to "Brian")) > 0)))))`;
    const expected = {
      type: "Count",
      clause: {
        lhs: "cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy",
        op: "is equal to",
        rhs: "Brian",
      },
      op: ">",
      rhs: "0",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("unary", () => {
    const input = `(([cgInspections\\EnteredBy] is null))`;
    const expected = {
      lhs: "cgInspections\\EnteredBy",
      op: "is null",
      rhs: undefined,
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count or", () => {
    const input = `(Count(([cgInspections\\EnteredBy] is null)) > 0) OR (([City] is equal to "Dubuque"))`;
    const expected = {
      op: "OR",
      lhs: {
        type: "Count",
        clause: {
          lhs: "cgInspections\\EnteredBy",
          op: "is null",
          rhs: undefined,
        },
        op: ">",
        rhs: "0",
      },
      rhs: {
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("conditional count", () => {
    const input = `(Count(([cgAttachments\\EnteredBy] is null) OR ([cgAttachments\\EntryDate] is null)) > 0)`;
    const expected = {
      type: "Count",
      clause: {
        op: "OR",
        lhs: {
          lhs: "cgAttachments\\EnteredBy",
          op: "is null",
          rhs: undefined,
        },
        rhs: {
          lhs: "cgAttachments\\EntryDate",
          op: "is null",
          rhs: undefined,
        },
      },
      op: ">",
      rhs: "0",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("unwrapParens", () => {
    const input = `(x)`;
    const expected = "x";
    const parser = unwrapParens(P.string("x"));
    expect(parser.parse(input)["value"]).toStrictEqual(expected);
  });

  test("unwrapParens", () => {
    const input = `x`;
    const expected = "x";
    const parser = unwrapParens(P.string("x"));
    expect(parser.parse(input)["value"]).toStrictEqual(expected);
  });
});
