import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

function randomToken(prefix = "xbt") {
  return `${prefix}_${crypto.randomBytes(24).toString("hex")}`;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function main() {
  const prisma = new PrismaClient();
  const plainTextToken = randomToken("xbt");
  const tokenHash = sha256(plainTextToken);
  const prefix = plainTextToken.slice(0, 12);

  const token = await prisma.apiToken.create({
    data: {
      label: "OpenClaw CLI",
      scopes: ["*"],
      prefix,
      tokenHash,
      isActive: true,
    },
  });

  console.log("✅ Successfully generated CLI Token!");
  console.log("ID:", token.id);
  console.log("Token:", plainTextToken);
  console.log("\nAdd this to your .env file as XBLOG_CLI_TOKEN");
  
  await prisma.$disconnect();
}

main().catch(console.error);
