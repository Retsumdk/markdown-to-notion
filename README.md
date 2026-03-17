# Markdown-to-Notion

Convert Markdown documents to Notion pages preserving formatting and structure.

## Features

- Markdown to Notion block conversion
- Preserves formatting: bold, italics, code blocks, quotes, lists
- Automatic image gallery embedding
- Heading and subheading transformation
- Code breaks with language detection
- Command-line Interface
- Built-in authentication for Notion API

## Installation

```bash
git clone https://github.com/Retsumdk/markdown-to-notion.git
cd markdown-to-notion
npm install
npm run build
```

## Usage

### Command Line

```bash
# Run the CLI
node dist/index.js --input path/to/markdown.md --output PARENT_PAGE_ID
```

### Integration

Code example:

```typescript
import { MarkdownToNotion } from './src';

const markdown = `# My Markdown
## Section

This is a paragraph with **bold** and *italic* text.

\`\`\`javascript
console.log('hello world');
\`\`\`

- list item 1
- list item 2
`;

const notionPage = await MarkdownToNotion.convert({
    markdown: markdown,
    notionToken: 'NOTION_TOKEN',
    parentPageId: '<parent_page_id>'
});
```

## Notion Blocks Converted

It creates the following notion blocks:

- Headings (and subheadings)
- Paragraphs
- Code blocks
- Unordered and ordered lists
- Blockquotes and horizontal separators
- Bold and italic text
- Links and images

## License
MIT License - See LICENSE file for details.
