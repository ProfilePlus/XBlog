import slugify from "slugify";

export function createSlug(input: string) {
  const slug = slugify(input, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug || "article";
}

export function ensureUniqueSlug(candidate: string, existingSlugs: Set<string>, currentSlug?: string) {
  if (!existingSlugs.has(candidate) || candidate === currentSlug) {
    return candidate;
  }

  let index = 2;
  while (existingSlugs.has(`${candidate}-${index}`) && `${candidate}-${index}` !== currentSlug) {
    index += 1;
  }

  return `${candidate}-${index}`;
}
