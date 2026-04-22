import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SearchClient } from "@/components/search-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索 | XBlog",
  description: "搜索 XBlog 已发布的公开文章。",
};

export default async function SearchPage() {
  return (
    <div className="page-container">
      <SiteHeader variant="secondary" />
      <SearchClient />
    </div>
  );
}
