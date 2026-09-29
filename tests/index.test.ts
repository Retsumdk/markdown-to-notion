import { describe, test, expect } from "@jest/globals";
import { MarkdownToNotion } from "../src/index";

describe("parseMarkdownToBlocks", () => {
  test("converts h2 and h3 headings", () => {
    const blocks = MarkdownToNotion.parseMarkdownToBlocks("## Title\n### Sub");
    expect(blocks[0].type).toBe("heading_2");
    expect(blocks[0].heading_2.rich_text[0].text.content).toBe("Title");
    expect(blocks[1].type).toBe("heading_3");
    expect(blocks[1].heading_3.rich_text[0].text.content).toBe("Sub");
  });

  test("groups consecutive lines into one paragraph block", () => {
    const blocks = MarkdownToNotion.parseMarkdownToBlocks("line one\nline two");
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].paragraph.rich_text[0].text.content).toBe("line one\nline two");
  });

  test("emits a code block with detected language and closes the fence", () => {
    const md = "```ts\nconst x = 1;\n```\nafter";
    const blocks = MarkdownToNotion.parseMarkdownToBlocks(md);
    expect(blocks[0].type).toBe("code");
    expect(blocks[0].code.language).toBe("ts");
    expect(blocks[0].code.rich_text[0].text.content).toBe("const x = 1;");
    expect(blocks[1].type).toBe("paragraph");
    expect(blocks[1].paragraph.rich_text[0].text.content).toBe("after");
  });

  test("handles bullet list items", () => {
    const blocks = MarkdownToNotion.parseMarkdownToBlocks("- first\n- second");
    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe("bulleted_list_item");
    expect(blocks[0].bulleted_list_item.rich_text[0].text.content).toBe("first");
  });

  test("preserves order across mixed content", () => {
    const blocks = MarkdownToNotion.parseMarkdownToBlocks("# H\npara\ncode:\n```\nbody\n```");
    expect(blocks.map((b) => b.type)).toEqual([
      "heading_1",
      "paragraph",
      "code",
    ]);
  });
});
