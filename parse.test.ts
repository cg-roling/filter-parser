import { iDateCompare, parseFilter } from "./parse";

// (([City] is equal to "Dubuque"))
describe("parseFilter", () => {
  test("clause", () => {
    const input = `(((([City] is equal to "Dubuque"))))`;
    const expected = {
      type: "Compare",
      op: "is equal to",
      lhs: "City",
      rhs: "Dubuque",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("clause or", () => {
    const input = `(([City] is equal to "Dubuque")) OR (([City] is equal to "Chicago"))`;
    const expected = {
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "Compare",
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        type: "Compare",
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
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "Compare",
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        type: "Compare",
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
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "Compare",
        op: "is equal to",
        lhs: "City",
        rhs: "Dubuque",
      },
      rhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          op: "is equal to",
          lhs: "City",
          rhs: "Chicago",
        },
        rhs: {
          type: "Compare",
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
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "Compare",
        op: "is equal to",
        lhs: "City",
        rhs: "Akron",
      },
      rhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          op: "is equal to",
          lhs: "City",
          rhs: "Aubrey",
        },
        rhs: {
          type: "Compare",
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
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          op: "is equal to",
          lhs: "City",
          rhs: "Akron",
        },
        rhs: {
          type: "Compare",
          op: "is equal to",
          lhs: "City",
          rhs: "Aubrey",
        },
      },
      rhs: {
        type: "Compare",
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
      type: "Compare",
      op: "is not equal to",
      lhs: "City",
      rhs: "Fennimore, WI",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to and", () => {
    const input = `(([City] is not equal to "Fennimore, WI")) AND (([City] is not equal to "Chicago"))`;
    const expected = {
      type: "AndOr",
      op: "AND",
      lhs: {
        type: "Compare",
        op: "is not equal to",
        lhs: "City",
        rhs: "Fennimore, WI",
      },
      rhs: {
        type: "Compare",
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
      type: "Compare",
      op: "is before",
      lhs: "EntryDate",
      rhs: "2022-09-01 12:00:00 AM",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("is not today", () => {
    const input = `(([EntryDate] is not today))`;
    const expected = {
      type: "Compare",
      op: "is not today",
      lhs: "EntryDate",
      rhs: undefined,
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test.only("is not within the last 5 days", () => {
    const input = `(([EntryDate] is not within the last 5 days))`;
    const expected = {
      type: "Compare",
      op: "is not within the last [] days",
      lhs: "EntryDate",
      rhs: "5",
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("number", () => {
    const input = `(([cgConsequenceOfFailureScore] < 5.0))`;
    const expected = {
      type: "Compare",
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
      lhs: {
        type: "Compare",
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
      type: "Compare",
      lhs: "cgInspections\\EnteredBy",
      op: "is null",
      rhs: undefined,
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count or", () => {
    const input = `(Count(([cgInspections\\EnteredBy] is null)) > 0) OR (([City] is equal to "Dubuque"))`;
    const expected = {
      type: "AndOr",
      op: "OR",
      lhs: {
        type: "Count",
        lhs: {
          type: "Compare",
          lhs: "cgInspections\\EnteredBy",
          op: "is null",
          rhs: undefined,
        },
        op: ">",
        rhs: "0",
      },
      rhs: {
        type: "Compare",
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
      lhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          lhs: "cgAttachments\\EnteredBy",
          op: "is null",
          rhs: undefined,
        },
        rhs: {
          type: "Compare",
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
});
