import fs from "node:fs";
import path from "node:path";

// Try to load env from typical locations
const envPaths = [
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), "apps/api/.env"),
  path.join(process.cwd(), "../../apps/api/.env"),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    try {
      // @ts-ignore - only in newer node
      if (process.loadEnvFile) process.loadEnvFile(p);
    } catch (e) {}
  }
}

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:4000";
const TOKEN = "xbt_411a86924ac8adab293381fc51d7e0ab8e4a3d4a4678cb53";

if (!TOKEN) {
  console.error("❌ Error: XBLOG_CLI_TOKEN is not set in environment.");
  process.exit(1);
}

async function api(path: string, options: RequestInit = {}) {
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

function parseMarkdown(content: string) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error("Invalid format. Missing YAML frontmatter.");
  }

  const yamlStr = frontmatterMatch[1];
  const body = frontmatterMatch[2].trim();

  const meta: any = {};
  for (const line of yamlStr.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length > 0) {
      meta[key.trim()] = rest.join(":").trim();
    }
  }

  const lines = body.split("\n");
  const blocks: any[] = [];
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
      console.table(articles.map((a: any) => ({
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
      if (!id) return console.error("Usage: xblog get <id>");
      const { markdown } = await api(`/v1/admin/articles/${id}/markdown`);
      const filename = args[1] || `${id}.md`;
      fs.writeFileSync(filename, markdown);
      console.log(`✅ Saved to ${filename}`);
      break;
    }

    case "rm": {
      const id = args[0];
      if (!id) return console.error("Usage: xblog rm <id>");
      await api(`/v1/admin/articles/${id}`, { method: "DELETE" });
      console.log(`✅ Deleted article ${id}`);
      break;
    }

    case "post": {
      const file = args[0];
      if (!file) return console.error("Usage: xblog post <file.md>");
      const content = fs.readFileSync(file, "utf8");
      const { meta, blocks } = parseMarkdown(content);
      
      const payload = {
        ...meta,
        highlights: meta.highlights ? meta.highlights.split(",").map((s: string) => s.trim()) : [],
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
      if (!id || !file) return console.error("Usage: xblog edit <id> <file.md>");
      const content = fs.readFileSync(file, "utf8");
      const { meta, blocks } = parseMarkdown(content);
      
      const payload = {
        ...meta,
        highlights: meta.highlights ? meta.highlights.split(",").map((s: string) => s.trim()) : [],
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
        if (!id) return console.error("Usage: xblog publish <id>");
        await api(`/v1/admin/articles/${id}/publish`, { method: "POST" });
        console.log(`✅ Published article ${id}`);
        break;
    }

    default:
      console.log(`
XBlog CLI - OpenClaw Content Manager
Usage:
  ls                      List all articles
  get <id> [file]         Download article as Markdown
  post <file.md>          Create new article from Markdown
  edit <id> <file.md>     Update article from Markdown
  rm <id>                 Delete an article
  publish <id>            Publish a draft
      `);
  }
}

main().catch(console.error);
