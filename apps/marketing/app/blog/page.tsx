import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on AI customer support, knowledge management, and building better customer experiences. From the SupportAI team.",
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  categoryColor: string;
}

const posts: BlogPost[] = [
  {
    slug: "how-ai-is-transforming-customer-support-2026",
    title: "How AI is Transforming Customer Support in 2026",
    excerpt:
      "The support landscape has shifted dramatically. With RAG pipelines, confidence scoring, and seamless human handoff, AI agents now resolve the majority of routine tickets while maintaining customer satisfaction scores above 90%. Here is what has changed and what it means for your team.",
    date: "March 26, 2026",
    readTime: "5 min read",
    category: "Industry",
    categoryColor: "text-violet-400 bg-violet-400/10",
  },
  {
    slug: "setting-up-your-first-ai-knowledge-base",
    title: "Setting Up Your First AI Knowledge Base: A Step-by-Step Guide",
    excerpt:
      "Your knowledge base is the foundation of AI support quality. This guide walks through content strategy, document formatting, chunking best practices, and how to measure whether your knowledge base is actually improving resolution rates.",
    date: "March 20, 2026",
    readTime: "8 min read",
    category: "Tutorial",
    categoryColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    slug: "why-human-handoff-matters",
    title: "Why Human Handoff Matters: Balancing AI and Empathy",
    excerpt:
      "The companies getting the best results with AI support are not the ones automating everything. They are the ones that know exactly when to hand off to a human. We break down the psychology of escalation and how to configure confidence thresholds that protect customer relationships.",
    date: "March 14, 2026",
    readTime: "4 min read",
    category: "Best Practices",
    categoryColor: "text-blue-400 bg-blue-400/10",
  },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border px-6 pb-12 pt-24 text-center sm:pt-28">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Blog
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Insights on AI support, knowledge management, and building better
          customer experiences.
        </p>
      </section>

      {/* Posts */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:shadow-primary/5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${post.categoryColor}`}
                >
                  {post.category}
                </span>
                <span className="text-sm text-muted-foreground">
                  {post.date}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="mt-3 leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Read more
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-border bg-secondary/30 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Stay up to date
          </h2>
          <p className="mt-3 text-muted-foreground">
            Get the latest articles on AI support, product updates, and best
            practices delivered to your inbox. No spam, unsubscribe any time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="you@company.com"
              className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-80"
            />
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
