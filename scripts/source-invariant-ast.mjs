import { createRequire } from "node:module";

const require = createRequire(process.env.WWM_SOURCE_INVARIANT_TYPESCRIPT_RESOLVER ?? import.meta.url);
const ts = require("typescript");

export { ts };

export function parseTsx(source, fileName = "src/App.tsx") {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (sourceFile.parseDiagnostics.length) {
    throw new Error(`[source-invariant] ${fileName} has syntax errors`);
  }
  return sourceFile;
}

export function visit(node, predicate) {
  let found = false;
  const walk = (current) => {
    if (predicate(current)) found = true;
    if (!found) ts.forEachChild(current, walk);
  };
  walk(node);
  return found;
}

export function declarationsNamed(sourceFile, name) {
  const declarations = [];
  ts.forEachChild(sourceFile, function walk(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) declarations.push(node);
    ts.forEachChild(node, walk);
  });
  return declarations;
}

export function identifierText(node) {
  return ts.isIdentifier(node) ? node.text : undefined;
}

export function propertyName(node) {
  return ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node) ? node.name.text : undefined;
}

export function callNamed(node, name) {
  return ts.isCallExpression(node) && identifierText(node.expression) === name;
}

export function methodCallNamed(node, name) {
  return ts.isCallExpression(node) && propertyName(node.expression) === name;
}

export function hasLiteralFalseAncestor(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isIfStatement(current)
      && current.expression.kind === ts.SyntaxKind.FalseKeyword
      && node.pos >= current.thenStatement.pos
      && node.end <= current.thenStatement.end) return true;
  }
  return false;
}

export function enclosingFunction(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionLike(current)) return current;
  }
  return undefined;
}

export function isDescendantOf(node, ancestor) {
  for (let current = node; current; current = current.parent) if (current === ancestor) return true;
  return false;
}
