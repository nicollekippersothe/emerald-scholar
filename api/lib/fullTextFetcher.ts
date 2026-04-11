/**
 * fullTextFetcher.ts
 * Enriches an article with full text when available.
 *
 * Priority chain per article:
 *   1. SciELO XML/HTML (if source === "SciELO" and DOI available)
 *   2. Unpaywall OA — HTML version (oa_location with url_for_landing_page / best_oa_location)
 *   3. Unpaywall OA — PDF version (last resort, text extraction from plain response)
 *   4. Fallback → abstract only
 *
 * Each attempt has a hard 5 s timeout. Errors are silent.
 */

const UNPAYWALL_EMAIL = process.env.UNPAYWALL_EMAIL ?? "clara-ia@scholaria.app";
const FETCH_TIMEOUT_MS = 5000;
const MAX_TEXT_CHARS = 2500; // returned snippet length (>=2000 as requested)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullTextResult {
  text: string;
  source: "full_text" | "abstract";
  /** Which provider succeeded: "scielo" | "unpaywall_html" | "unpaywall_pdf" | "abstract" */
  provider: "scielo" | "unpaywall_html" | "unpaywall_pdf" | "abstract";
}

interface ArticleLike {
  doi?: string;
  source?: string;
  abstract_pt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract the most informative section from HTML/XML text.
 * Tries to grab abstract + methods + results sections first.
 */
function extractRelevantText(raw: string, maxChars: number): string {
  const text = stripHtml(raw);

  // Try to find abstract/methods/results sections
  const sectionRegex = /(?:abstract|resumo|método|method|result|conclus)[^.]{0,30}[:\n]([\s\S]{200,}?)(?=(?:introduction|introdução|background|reference|referência|$))/gi;
  const sections: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(text)) !== null) {
    sections.push(m[1].trim());
    if (sections.join(" ").length > maxChars) break;
  }

  if (sections.length > 0) {
    return sections.join(" ").slice(0, maxChars);
  }

  // Fallback: just take the first maxChars chars after stripping boilerplate
  return text.slice(0, maxChars);
}

// ─── SciELO ──────────────────────────────────────────────────────────────────

/**
 * Fetch full text from SciELO.
 * SciELO exposes article XML at:
 *   https://www.scielo.br/j/{journal}/article/{scielo_pid}/
 * and the article metadata/XML via their Article API:
 *   https://www.scielo.br/api/v1/article/?doi={doi}
 * We'll use the public HTML endpoint as the primary source.
 */
async function fetchSciELOFullText(doi: string): Promise<string | null> {
  if (!doi) return null;

  try {
    // SciELO article search by DOI via their public search API
    const metaUrl = `https://search.scielo.org/?q=doi:${encodeURIComponent(doi)}&format=json&count=1`;
    const metaRes = await fetch(metaUrl, { signal: timeout(FETCH_TIMEOUT_MS) });
    if (!metaRes.ok) return null;

    const meta = await metaRes.json();
    const hits = meta?.response?.docs;
    if (!hits?.length) return null;

    const articleUrl: string | undefined = hits[0]?.html_url ?? hits[0]?.url;
    if (!articleUrl) return null;

    const htmlRes = await fetch(articleUrl, { signal: timeout(FETCH_TIMEOUT_MS) });
    if (!htmlRes.ok) return null;

    const html = await htmlRes.text();
    return extractRelevantText(html, MAX_TEXT_CHARS);
  } catch {
    return null;
  }
}

// ─── Unpaywall ───────────────────────────────────────────────────────────────

interface UnpaywallLocation {
  url?: string;
  url_for_landing_page?: string;
  url_for_pdf?: string;
  host_type?: string;
  license?: string;
}

interface UnpaywallResponse {
  is_oa: boolean;
  best_oa_location?: UnpaywallLocation;
  oa_locations?: UnpaywallLocation[];
}

async function fetchUnpaywallMeta(doi: string): Promise<UnpaywallResponse | null> {
  try {
    const url = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(UNPAYWALL_EMAIL)}`;
    const res = await fetch(url, { signal: timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json() as UnpaywallResponse;
  } catch {
    return null;
  }
}

/** Attempt to fetch and extract text from an HTML landing page URL */
async function fetchHtmlText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("xml")) return null;
    const html = await res.text();
    const extracted = extractRelevantText(html, MAX_TEXT_CHARS);
    // Discard if too short — probably a paywall redirect
    if (extracted.length < 200) return null;
    return extracted;
  } catch {
    return null;
  }
}

/** Attempt to fetch a PDF and extract printable text (plain text PDFs only) */
async function fetchPdfText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/pdf,*/*" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf")) return null;
    // Read raw bytes as text — only works for text-layer PDFs
    const raw = await res.text();
    // Extract readable strings (PDF text streams start with BT/ET blocks)
    const matches = raw.match(/BT\s*([\s\S]*?)ET/g);
    if (!matches || matches.length === 0) return null;
    const readable = matches
      .join(" ")
      .replace(/\(([^)]{3,})\)/g, "$1 ")  // extract text in parentheses (PDF syntax)
      .replace(/[^\x20-\x7E\xA0-\xFF\s]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (readable.length < 150) return null;
    return readable.slice(0, MAX_TEXT_CHARS);
  } catch {
    return null;
  }
}

/**
 * Try Unpaywall: HTML first, PDF as last resort.
 * Returns { text, provider } or null.
 */
async function fetchUnpaywallText(doi: string): Promise<{ text: string; provider: "unpaywall_html" | "unpaywall_pdf" } | null> {
  const meta = await fetchUnpaywallMeta(doi);
  if (!meta?.is_oa) return null;

  // Collect candidate HTML URLs (landing pages preferred)
  const htmlCandidates: string[] = [];
  const pdfCandidates: string[] = [];

  const locations: UnpaywallLocation[] = [
    ...(meta.best_oa_location ? [meta.best_oa_location] : []),
    ...(meta.oa_locations ?? []),
  ];

  for (const loc of locations) {
    if (loc.url_for_landing_page) htmlCandidates.push(loc.url_for_landing_page);
    if (loc.url && !loc.url.endsWith(".pdf")) htmlCandidates.push(loc.url);
    if (loc.url_for_pdf) pdfCandidates.push(loc.url_for_pdf);
    if (loc.url?.endsWith(".pdf")) pdfCandidates.push(loc.url);
  }

  // 1. Try HTML (priority as requested)
  for (const url of [...new Set(htmlCandidates)]) {
    const text = await fetchHtmlText(url);
    if (text) return { text, provider: "unpaywall_html" };
  }

  // 2. Try PDF (last resort)
  for (const url of [...new Set(pdfCandidates)]) {
    const text = await fetchPdfText(url);
    if (text) return { text, provider: "unpaywall_pdf" };
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point.
 * Returns enriched text with provenance metadata.
 * Never throws — always falls back to abstract.
 */
export async function getFullText(article: ArticleLike): Promise<FullTextResult> {
  const fallback: FullTextResult = {
    text: article.abstract_pt ?? "",
    source: "abstract",
    provider: "abstract",
  };

  const doi = article.doi?.trim();
  if (!doi || doi === "n/a" || doi === "") return fallback;

  try {
    // 1. SciELO: attempt when source matches
    if (article.source?.toLowerCase().includes("scielo")) {
      const text = await fetchSciELOFullText(doi);
      if (text && text.length >= 200) {
        return { text, source: "full_text", provider: "scielo" };
      }
    }

    // 2. Unpaywall: HTML → PDF
    const unpaywall = await fetchUnpaywallText(doi);
    if (unpaywall) {
      return { text: unpaywall.text, source: "full_text", provider: unpaywall.provider };
    }
  } catch {
    // Silent failure — return abstract
  }

  return fallback;
}

/**
 * Batch enrichment: runs all articles in parallel with Promise.allSettled.
 * Returns an array of FullTextResult in the same order as input.
 */
export async function batchGetFullText(articles: ArticleLike[]): Promise<FullTextResult[]> {
  const results = await Promise.allSettled(articles.map((a) => getFullText(a)));
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { text: articles[i].abstract_pt ?? "", source: "abstract" as const, provider: "abstract" as const }
  );
}
