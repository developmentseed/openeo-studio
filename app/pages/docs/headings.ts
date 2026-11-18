import { kebabCase } from 'lodash-es';
import { isValidElement, ReactNode } from 'react';

export interface DocHeading {
  id: string;
  text: string;
  level: number;
  /** 1-based line in the markdown, to match the rendered heading. */
  line: number;
}

/** Heading levels listed in the document outline. */
export const OUTLINE_LEVELS = [2, 3];

/** Removes inline markdown so the text matches what gets rendered. */
function stripInlineMarkdown(text: string) {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .trim();
}

/**
 * Lists the outline headings of a markdown document, skipping code blocks.
 * Repeated heading texts get unique ids: "parameters", "parameters-1", …
 */
export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const idCounts = new Map<string, number>();
  let inFence = false;

  for (const [index, line] of markdown.split('\n').entries()) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    if (!OUTLINE_LEVELS.includes(level)) continue;

    const text = stripInlineMarkdown(match[2]);
    const slug = kebabCase(text);
    const count = idCounts.get(slug) ?? 0;
    idCounts.set(slug, count + 1);
    const id = count ? `${slug}-${count}` : slug;
    headings.push({ id, text, level, line: index + 1 });
  }

  return headings;
}

/** Plain text content of rendered react children. */
export function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return '';
}
