import type { FastifyInstance } from "fastify";

export async function registerPublicRoutes(app: FastifyInstance) {
  app.get("/v1/public/home", async () => app.store.getPublicHome());
  app.get("/v1/public/site-branding", async () => app.store.getPublicSiteBranding());
  app.get("/v1/public/categories", async () => app.store.listCategories());

  app.get("/v1/public/categories/:slug", async (request, reply) => {
    const category = await app.store.getPublicCategoryDetail((request.params as { slug: string }).slug);
    if (!category) {
      return reply.code(404).send({ message: "Category not found" });
    }
    return category;
  });

  app.get("/v1/public/search", async (request) => {
    const { q } = request.query as { q?: string };
    return app.store.searchPublicArticles(q ?? "");
  });

  app.get("/v1/public/articles/:slug", async (request, reply) => {
    const article = await app.store.getPublicArticleDetail((request.params as { slug: string }).slug);
    if (!article) {
      return reply.code(404).send({ message: "Article not found" });
    }
    return article;
  });
}
