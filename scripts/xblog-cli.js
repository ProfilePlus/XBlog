#!/usr/bin/env node

/**
 * XBlog CLI - Green Edition (Zero Dependencies)
 * 
 * Usage:
 *   export API_BASE_URL="http://your-server-ip:4000"
 *   export XBLOG_CLI_TOKEN="your_xbt_token_here"
 *   node xblog-cli.js ls
 */

const fs = require("node:fs");
const crypto = require("node:crypto");

const API_BASE_URL = process.env.API_BASE_URL;
const TOKEN = process.env.XBLOG_CLI_TOKEN;

if (!API_BASE_URL || !TOKEN) {
  console.error("❌ Error: Missing configuration.");
  console.error("Please set API_BASE_URL and XBLOG_CLI_TOKEN environment variables.");
  process.exit(1);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

function parseMarkdown(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error("Invalid format. Missing YAML frontmatter.");
  }

  const yamlStr = frontmatterMatch[1];
  const body = frontmatterMatch[2].trim();

  const meta = {};
  for (const line of yamlStr.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length > 0) {
      meta[key.trim()] = rest.join(":").trim();
    }
  }

  const lines = body.split("\n");
  const blocks = [];
  let currentParagraph = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("## ")) {
      if (currentParagraph) {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
        currentParagraph = "";
      }
      blocks.push({ id: crypto.randomUUID(), type: "heading", text: line.replace("## ", ""), level: 2 });
    } else if (line.startsWith("> ")) {
       if (currentParagraph) {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
        currentParagraph = "";
      }
      blocks.push({ id: crypto.randomUUID(), type: "quote", text: line.replace("> ", "") });
    } else if (line.startsWith("```")) {
      if (currentParagraph) {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
        currentParagraph = "";
      }
      const lang = line.replace("```", "");
      let code = "";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code += lines[i] + "\n";
        i++;
      }
      blocks.push({ id: crypto.randomUUID(), type: "code", language: lang, code: code.trim() });
    } else if (line === "---") {
       if (currentParagraph) {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
        currentParagraph = "";
      }
      blocks.push({ id: crypto.randomUUID(), type: "divider" });
    } else if (line === "") {
      if (currentParagraph) {
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
        currentParagraph = "";
      }
    } else {
      currentParagraph += line + " ";
    }
  }

  if (currentParagraph) {
    blocks.push({ id: crypto.randomUUID(), type: "paragraph", text: currentParagraph.trim() });
  }

  return { meta, blocks };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "ls": {
      const articles = await api("/v1/admin/articles");
      console.table(articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        status: a.status,
        category: a.categorySlug
      })));
      break;
    }

    case "get": {
      const id = args[0];
      if (!id) return console.error("Usage: node xblog-cli.js get <id> [file]");
      const { markdown } = await api(`/v1/admin/articles/${id}/markdown`);
      const filename = args[1] || `${id}.md`;
      fs.writeFileSync(filename, markdown);
      console.log(`✅ Saved to ${filename}`);
      break;
    }

    case "rm": {
      const id = args[0];
      if (!id) return console.error("Usage: node xblog-cli.js rm <id>");
      await api(`/v1/admin/articles/${id}`, { method: "DELETE" });
      console.log(`✅ Deleted article ${id}`);
      break;
    }

    case "post": {
      const file = args[0];
      if (!file) return console.error("Usage: node xblog-cli.js post <file.md>");
      const content = fs.readFileSync(file, "utf8");
      const { meta, blocks } = parseMarkdown(content);
      
      const payload = {
        ...meta,
        highlights: meta.highlights ? meta.highlights.split(",").map((s) => s.trim()) : [],
        blocks,
        tone: meta.tone || "blue",
        kind: meta.kind || "ORIGINAL"
      };

      const result = await api("/v1/admin/articles", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      console.log(`✅ Created article: ${result.slug} (ID: ${result.id})`);
      break;
    }

    case "edit": {
      const id = args[0];
      const file = args[1];
      if (!id || !file) return console.error("Usage: node xblog-cli.js edit <id> <file.md>");
      const content = fs.readFileSync(file, "utf8");
      const { meta, blocks } = parseMarkdown(content);
      
      const payload = {
        ...meta,
        highlights: meta.highlights ? meta.highlights.split(",").map((s) => s.trim()) : [],
        blocks,
        tone: meta.tone || "blue",
        kind: meta.kind || "ORIGINAL"
      };

      const result = await api(`/v1/admin/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      console.log(`✅ Updated article: ${result.slug}`);
      break;
    }

    case "publish": {
        const id = args[0];
        if (!id) return console.error("Usage: node xblog-cli.js publish <id>");
        await api(`/v1/admin/articles/${id}/publish`, { method: "POST" });
        console.log(`✅ Published article ${id}`);
        break;
    }

    default:
      console.log(`
XBlog CLI - Green Edition
Usage:
  node xblog-cli.js ls                      List all articles
  node xblog-cli.js get <id> [file]         Download article as Markdown
  node xblog-cli.js post <file.md>          Create new article from Markdown
  node xblog-cli.js edit <id> <file.md>     Update article from Markdown
  node xblog-cli.js rm <id>                 Delete an article
  node xblog-cli.js publish <id>            Publish a draft
      `);
  }
}

main().catch(console.error);
