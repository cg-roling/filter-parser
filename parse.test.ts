import { parseFilter } from "./parse";

// (([City] is equal to "Dubuque"))
describe("parseFilter", () => {
  test("compare", () => {
    const input = `(((([City] is equal to "Dubuque"))))`;
    const expected = {
      type: "Compare",
      op: "is equal to",
      lhs: { type: "field", value: "City" },
      rhs: { type: "string", value: "Dubuque" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("compare to field", () => {
    const input = `(((([City] is equal to [City]))))`;
    const expected = {
      type: "Compare",
      op: "is equal to",
      lhs: { type: "field", value: "City" },
      rhs: { type: "field", value: "City" },
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
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Dubuque" },
      },
      rhs: {
        type: "Compare",
        op: "is equal to",
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Chicago" },
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
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Dubuque" },
      },
      rhs: {
        type: "Compare",
        op: "is equal to",
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Chicago" },
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
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Dubuque" },
      },
      rhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          op: "is equal to",
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "Chicago" },
        },
        rhs: {
          type: "Compare",
          op: "is equal to",
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "New York" },
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
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Akron" },
      },
      rhs: {
        type: "AndOr",
        op: "OR",
        lhs: {
          type: "Compare",
          op: "is equal to",
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "Aubrey" },
        },
        rhs: {
          type: "Compare",
          op: "is equal to",
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "Dubuque" },
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
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "Akron" },
        },
        rhs: {
          type: "Compare",
          op: "is equal to",
          lhs: { type: "field", value: "City" },
          rhs: { type: "string", value: "Aubrey" },
        },
      },
      rhs: {
        type: "Compare",
        op: "is equal to",
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Dubuque" },
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("not equal to", () => {
    const input = `(([City] is not equal to "Fennimore, WI"))`;
    const expected = {
      type: "Compare",
      op: "is not equal to",
      lhs: { type: "field", value: "City" },
      rhs: { type: "string", value: "Fennimore, WI" },
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
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Fennimore, WI" },
      },
      rhs: {
        type: "Compare",
        op: "is not equal to",
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Chicago" },
      },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("date compare", () => {
    const input = `(([EntryDate] is before #2022-09-01 12:00:00 AM#))`;
    const expected = {
      type: "Compare",
      op: "is before",
      lhs: { type: "field", value: "EntryDate" },
      rhs: { type: "date", value: "2022-09-01 12:00:00 AM" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("date compare to field", () => {
    const input = `(([EntryDate] is before [EntryDate]))`;
    const expected = {
      type: "Compare",
      op: "is before",
      lhs: { type: "field", value: "EntryDate" },
      rhs: { type: "field", value: "EntryDate" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("is not today", () => {
    const input = `(([EntryDate] is not today))`;
    const expected = {
      type: "Compare",
      op: "is not today",
      lhs: { type: "field", value: "EntryDate" },
      rhs: undefined,
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("is not within the last 5 days", () => {
    const input = `(([EntryDate] is not within the last [] days 5))`;
    const expected = {
      type: "Compare",
      op: "is not within the last [] days",
      lhs: { type: "field", value: "EntryDate" },
      rhs: { type: "number", value: "5" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("compare number", () => {
    const input = `(([cgConsequenceOfFailureScore] < 5.0))`;
    const expected = {
      type: "Compare",
      op: "<",
      lhs: { type: "field", value: "cgConsequenceOfFailureScore" },
      rhs: { type: "number", value: "5.0" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("compare number to field", () => {
    const input = `(([cgConsequenceOfFailureScore] < [cgConsequenceOfFailureScore]))`;
    const expected = {
      type: "Compare",
      op: "<",
      lhs: { type: "field", value: "cgConsequenceOfFailureScore" },
      rhs: { type: "field", value: "cgConsequenceOfFailureScore" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("count", () => {
    const input = `(((((Count(([cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy] is equal to "Brian")) > 0)))))`;
    const expected = {
      type: "Count",
      lhs: {
        type: "Compare",
        lhs: {
          type: "field",
          value:
            "cgInspections\\cgConditionCategories\\ConditionCategory\\cgImpacts\\Activity\\EnteredBy",
        },
        op: "is equal to",
        rhs: { type: "string", value: "Brian" },
      },
      op: ">",
      rhs: { type: "number", value: "0" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });

  test("unary", () => {
    const input = `(([cgInspections\\EnteredBy] is null))`;
    const expected = {
      type: "Compare",
      lhs: { type: "field", value: "cgInspections\\EnteredBy" },
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
          lhs: { type: "field", value: "cgInspections\\EnteredBy" },
          op: "is null",
          rhs: undefined,
        },
        op: ">",
        rhs: { type: "number", value: "0" },
      },
      rhs: {
        type: "Compare",
        op: "is equal to",
        lhs: { type: "field", value: "City" },
        rhs: { type: "string", value: "Dubuque" },
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
          lhs: { type: "field", value: "cgAttachments\\EnteredBy" },
          op: "is null",
          rhs: undefined,
        },
        rhs: {
          type: "Compare",
          lhs: { type: "field", value: "cgAttachments\\EntryDate" },
          op: "is null",
          rhs: undefined,
        },
      },
      op: ">",
      rhs: { type: "number", value: "0" },
    };
    expect(parseFilter(input)).toStrictEqual(expected);
  });
});
