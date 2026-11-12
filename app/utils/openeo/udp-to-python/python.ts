/**
 * Python as text: names, string literals, and the layout of a module.
 * Nothing here knows about openEO.
 */

const KEYWORDS = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(
    ' '
  )
);

/** The binding strength of an expression that never needs brackets. */
export const ATOM = 9;

export interface Expression {
  src: string;
  /** Binding strength: an operand with a lower one gets brackets. */
  prec: number;
}

/** Whether a name can be written as a keyword argument: `name=value`. */
export const isKeyword = (name: string) =>
  /^[A-Za-z_]\w*$/.test(name) && !KEYWORDS.has(name);

/** A valid Python name that reads like the given text. */
export function identifier(text: string): string {
  const name = text.replace(/\W+/g, '_') || 'value';
  const safe = /^\d/.test(name) ? `_${name}` : name;
  return KEYWORDS.has(safe) ? `${safe}_` : safe;
}

export function pyString(text: string): string {
  // Text of several lines, such as UDF code, stays readable in a block.
  const quote = ['"""', "'''"].find(
    (q) => !text.includes(q) && !text.endsWith(q[0])
  );
  return text.includes('\n') && quote
    ? `${quote}${text.replace(/\\/g, '\\\\')}${quote}`
    : JSON.stringify(text);
}

/** A number, text, boolean or null as a Python literal. */
export function pyScalar(value: null | undefined | boolean | number | string) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return typeof value === 'number' ? String(value) : pyString(value);
}

/** The lines of a function, with its body indented. */
export function pyFunction(name: string, params: string[], body: string[]) {
  return [
    `def ${name}(${params.join(', ')}):`,
    ...body.map((line) => `    ${line}`)
  ];
}

/**
 * Joins the sections of a module: two blank lines around a function, one
 * between the other sections.
 */
export function pyModule(sections: string[]): string {
  const code = sections.filter(Boolean).reduce((text, section, i, all) => {
    const isFunction = [section, all[i - 1]].some((s) => s.startsWith('def '));
    return `${text}${isFunction ? '\n\n\n' : '\n\n'}${section}`;
  });
  return `${code}\n`;
}

/** Hands out names that are free in a scope and in the scopes around it. */
export class Names {
  private used: Set<string>;

  constructor(
    taken: Iterable<string>,
    private outer?: Names
  ) {
    this.used = new Set(taken);
  }

  has(name: string): boolean {
    return this.used.has(name) || !!this.outer?.has(name);
  }

  fresh(base: string): string {
    const root = identifier(base);
    let name = root;
    for (let i = 2; this.has(name); i++) name = `${root}_${i}`;
    this.used.add(name);
    return name;
  }
}
