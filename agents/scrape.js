const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";

/** Stage 2: fetch a page's content as markdown, ready for the extraction prompt. */
export async function scrape(url) {
  const res = await fetch(`${FIRECRAWL_URL}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });

  if (!res.ok) {
    throw new Error(`scrape(${url}): Firecrawl scrape failed with ${res.status}`);
  }

  const data = await res.json();
  return { url, markdown: data.data?.markdown ?? "" };
}
