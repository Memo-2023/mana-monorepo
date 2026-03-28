package parser

import (
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// Result holds the extracted content from a page.
type Result struct {
	Title    string
	Content  string
	Markdown string
	Links    []string
	Metadata map[string]string
}

// Selectors defines custom CSS selectors for extraction.
type Selectors struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Links   string `json:"links"`
}

var (
	reScript = regexp.MustCompile(`(?is)<script.*?</script>`)
	reStyle  = regexp.MustCompile(`(?is)<style.*?</style>`)
	reTags   = regexp.MustCompile(`<[^>]+>`)
	reSpaces = regexp.MustCompile(`\s+`)
)

// Parse extracts content from HTML.
func Parse(html string, baseURL string, selectors *Selectors) (*Result, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		return nil, err
	}

	base, _ := url.Parse(baseURL)

	result := &Result{
		Title:    extractTitle(doc, selectors),
		Metadata: extractMetadata(doc),
	}

	// Extract content
	contentHTML := extractContentHTML(doc, selectors)
	result.Content = cleanText(contentHTML)
	result.Markdown = htmlToMarkdown(contentHTML)

	// Extract links
	result.Links = extractLinks(doc, base, selectors)

	return result, nil
}

func extractTitle(doc *goquery.Document, sel *Selectors) string {
	if sel != nil && sel.Title != "" {
		if t := doc.Find(sel.Title).First().Text(); t != "" {
			return strings.TrimSpace(t)
		}
	}
	if t := doc.Find("h1").First().Text(); t != "" {
		return strings.TrimSpace(t)
	}
	if t := doc.Find("title").First().Text(); t != "" {
		return strings.TrimSpace(t)
	}
	if t, _ := doc.Find(`meta[property="og:title"]`).Attr("content"); t != "" {
		return t
	}
	return ""
}

func extractContentHTML(doc *goquery.Document, sel *Selectors) string {
	if sel != nil && sel.Content != "" {
		if h, err := doc.Find(sel.Content).First().Html(); err == nil && h != "" {
			return h
		}
	}

	contentSelectors := []string{
		"article", "main", `[role="main"]`,
		".main-content", ".content", ".post-content", ".article-content", ".entry-content",
		"#content", "#main",
	}
	for _, s := range contentSelectors {
		if h, err := doc.Find(s).First().Html(); err == nil && h != "" {
			return h
		}
	}

	h, _ := doc.Find("body").Html()
	return h
}

func extractLinks(doc *goquery.Document, base *url.URL, sel *Selectors) []string {
	linkSel := "a[href]"
	if sel != nil && sel.Links != "" {
		linkSel = sel.Links
	}

	seen := make(map[string]bool)
	var links []string

	doc.Find(linkSel).Each(func(_ int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}
		href = strings.TrimSpace(href)

		// Skip non-HTTP
		if strings.HasPrefix(href, "javascript:") || strings.HasPrefix(href, "mailto:") ||
			strings.HasPrefix(href, "tel:") || strings.HasPrefix(href, "#") {
			return
		}

		// Resolve relative
		parsed, err := url.Parse(href)
		if err != nil {
			return
		}
		resolved := base.ResolveReference(parsed)

		// Same origin only
		if resolved.Host != base.Host {
			return
		}

		resolved.Fragment = ""
		u := resolved.String()
		if !seen[u] {
			seen[u] = true
			links = append(links, u)
		}
	})

	return links
}

func extractMetadata(doc *goquery.Document) map[string]string {
	meta := make(map[string]string)

	// OpenGraph
	doc.Find(`meta[property^="og:"]`).Each(func(_ int, s *goquery.Selection) {
		prop, _ := s.Attr("property")
		content, _ := s.Attr("content")
		if prop != "" && content != "" {
			meta[prop] = content
		}
	})

	// Standard meta
	for _, name := range []string{"description", "keywords", "author"} {
		if content, _ := doc.Find(`meta[name="` + name + `"]`).Attr("content"); content != "" {
			meta[name] = content
		}
	}

	// Canonical
	if href, _ := doc.Find(`link[rel="canonical"]`).Attr("href"); href != "" {
		meta["canonical"] = href
	}

	return meta
}

func cleanText(html string) string {
	text := reScript.ReplaceAllString(html, "")
	text = reStyle.ReplaceAllString(text, "")
	text = reTags.ReplaceAllString(text, " ")
	text = strings.ReplaceAll(text, "&nbsp;", " ")
	text = strings.ReplaceAll(text, "&amp;", "&")
	text = strings.ReplaceAll(text, "&lt;", "<")
	text = strings.ReplaceAll(text, "&gt;", ">")
	text = strings.ReplaceAll(text, "&quot;", `"`)
	text = reSpaces.ReplaceAllString(text, " ")
	return strings.TrimSpace(text)
}

// htmlToMarkdown does a basic HTML → Markdown conversion.
func htmlToMarkdown(html string) string {
	// Remove scripts/styles
	md := reScript.ReplaceAllString(html, "")
	md = reStyle.ReplaceAllString(md, "")

	// Headings
	for i := 6; i >= 1; i-- {
		prefix := strings.Repeat("#", i)
		re := regexp.MustCompile(`(?i)<h` + strings.Repeat("", 0) + string(rune('0'+i)) + `[^>]*>(.*?)</h` + string(rune('0'+i)) + `>`)
		md = re.ReplaceAllString(md, "\n"+prefix+" $1\n")
	}
	// Paragraphs
	md = regexp.MustCompile(`(?i)<p[^>]*>`).ReplaceAllString(md, "\n")
	md = strings.ReplaceAll(md, "</p>", "\n")
	// Line breaks
	md = regexp.MustCompile(`(?i)<br\s*/?\s*>`).ReplaceAllString(md, "\n")
	// Bold
	md = regexp.MustCompile(`(?i)<(?:strong|b)>(.*?)</(?:strong|b)>`).ReplaceAllString(md, "**$1**")
	// Italic
	md = regexp.MustCompile(`(?i)<(?:em|i)>(.*?)</(?:em|i)>`).ReplaceAllString(md, "*$1*")
	// Code
	md = regexp.MustCompile(`(?i)<code>(.*?)</code>`).ReplaceAllString(md, "`$1`")
	// Pre
	md = regexp.MustCompile(`(?i)<pre[^>]*>(.*?)</pre>`).ReplaceAllString(md, "\n```\n$1\n```\n")
	// Links
	md = regexp.MustCompile(`(?i)<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>`).ReplaceAllString(md, "[$2]($1)")
	// Lists
	md = regexp.MustCompile(`(?i)<li[^>]*>`).ReplaceAllString(md, "- ")
	md = strings.ReplaceAll(md, "</li>", "\n")
	// Remove remaining tags
	md = reTags.ReplaceAllString(md, "")
	// Clean up whitespace
	md = regexp.MustCompile(`\n{3,}`).ReplaceAllString(md, "\n\n")
	return strings.TrimSpace(md)
}
