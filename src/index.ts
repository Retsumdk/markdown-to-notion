import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

export interface ConvertOptions {
  markdown: string;
  notionToken: string;
  parentPageId: string;
}

export interface NotionBlock {
  type: string;
  [key: string]: any;
}

export class MarkdownToNotion {
  private notion: Client;
  private n2m: NotionToMarkdown;

  constructor(token: string) {
    this.notion = new Client({ auth: token });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
  }

  /**
   * Convert markdown text to Notion blocks
   */
  static parseMarkdownToBlocks(markdown: string): NotionBlock[] {
    const blocks: NotionBlock[] = [];
    const lines = markdown.split("\n");
    let currentParagraph: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeContent: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        blocks.push({
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: currentParagraph.join("\n") },
              },
            ],
          },
        });
        currentParagraph = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          flushParagraph();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = [];
        } else {
          blocks.push({
            type: "code",
            code: {
              rich_text: [{ type: "text", text: { content: codeContent.join("\n") } }],
              language: codeLanguage || "plain text",
            },
          });
          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      if (line.startsWith("### ")) {
        flushParagraph();
        blocks.push({
          type: "heading_3",
          heading_3: {
            rich_text: [{ type: "text", text: { content: line.slice(4) } }],
          },
        });
      } else if (line.startsWith("## ")) {
        flushParagraph();
        blocks.push({
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: line.slice(3) } }],
          },
        });
      } else if (line.startsWith("# ")) {
        flushParagraph();
        blocks.push({
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (line.match(/^[-*] /)) {
        flushParagraph();
        blocks.push({
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (line.match(/^\d+\. /)) {
        flushParagraph();
        const match = line.match(/^(\d+)\. (.*)$/);
        if (match) {
          blocks.push({
            type: "numbered_list_item",
            numbered_list_item: {
              rich_text: [{ type: "text", text: { content: match[2] } }],
            },
          });
        }
      } else if (line.startsWith("> ")) {
        flushParagraph();
        blocks.push({
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content: line.slice(2) } }],
          },
        });
      } else if (line === "---") {
        flushParagraph();
        blocks.push({ type: "divider", divider: {} });
      } else if (line.trim() === "") {
        flushParagraph();
      } else {
        currentParagraph.push(line);
      }
    }

    flushParagraph();
    return blocks;
  }

  /**
   * Convert markdown to a Notion page
   */
  async convert(options: ConvertOptions): Promise<{ id: string; url: string }> {
    const { markdown, parentPageId } = options;
    const blocks = MarkdownToNotion.parseMarkdownToBlocks(markdown);

    const response = await this.notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: "Imported from Markdown",
              },
            },
          ],
        },
      },
      children: blocks,
    });

    return {
      id: response.id,
      url: (response as any).url,
    };
  }

  /**
   * Convert a Notion page to markdown
   */
  async notionToMarkdown(pageId: string): Promise<string> {
    const mdblocks = await this.n2m.pageToMarkdown(pageId);
    return this.n2m.toMarkdownString(mdblocks).parent;
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  let inputFile: string | undefined;
  let outputPageId: string | undefined;
  let notionToken: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      outputPageId = args[i + 1];
      i++;
    } else if (args[i] === "--token" && args[i + 1]) {
      notionToken = args[i + 1];
      i++;
    }
  }

  if (!inputFile || !outputPageId) {
    console.error("Usage: node index.js --input <file.md> --output <page_id> [--token <notion_token>]");
    console.error("Or set NOTION_TOKEN environment variable");
    process.exit(1);
  }

  const token = notionToken || process.env.NOTION_TOKEN;
  if (!token) {
    console.error("Error: Notion token required. Set NOTION_TOKEN env or use --token");
    process.exit(1);
  }

  const fs = await import("fs");
  const markdown = fs.readFileSync(inputFile, "utf-8");

  const converter = new MarkdownToNotion(token);
  const result = await converter.convert({
    markdown,
    notionToken: token,
    parentPageId: outputPageId,
  });

  console.log("Page created successfully!");
  console.log(`Page ID: ${result.id}`);
  console.log(`Page URL: ${result.url}`);
}

main().catch(console.error);
