import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";

describe("lerSemPerda", () => {
  it("devolve todo número como o texto original, sem perda de dígitos", () => {
    const dado = lerSemPerda('{"a": 12345678901234.56, "b": 0.10, "c": [1, 2.50, 0.07]}') as {
      a: string;
      b: string;
      c: string[];
    };
    expect(dado.a).toBe("12345678901234.56");
    expect(dado.b).toBe("0.10");
    expect(dado.c).toEqual(["1", "2.50", "0.07"]);
  });

  it("não deixa 0.10 virar 0.1", () => {
    const dado = lerSemPerda('{"v": 0.10}') as { v: string };
    expect(dado.v).not.toBe("0.1");
    expect(dado.v).toBe("0.10");
  });

  it("mantém textos, objetos e vazios", () => {
    expect(lerSemPerda('{"x": "FICT-1", "y": [], "z": {}}')).toEqual({ x: "FICT-1", y: [], z: {} });
  });

  it("lança erro para JSON inválido", () => {
    expect(() => lerSemPerda("{ não é json")).toThrow();
  });
});
