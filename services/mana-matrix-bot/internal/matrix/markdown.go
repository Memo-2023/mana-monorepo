package matrix

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	reBold          = regexp.MustCompile(`\*\*(.+?)\*\*`)
	reItalic        = regexp.MustCompile(`\*(.+?)\*`)
	reStrikethrough = regexp.MustCompile(`~~(.+?)~~`)
	reCode          = regexp.MustCompile("`(.+?)`")
)

// MarkdownToHTML converts simple markdown to HTML for Matrix messages.
// Matches the exact behavior of the TypeScript markdownToHtml function.
func MarkdownToHTML(text string) string {
	result := text
	result = reBold.ReplaceAllString(result, "<strong>$1</strong>")
	result = reItalic.ReplaceAllString(result, "<em>$1</em>")
	result = reStrikethrough.ReplaceAllString(result, "<del>$1</del>")
	result = reCode.ReplaceAllString(result, "<code>$1</code>")
	result = strings.ReplaceAll(result, "\n", "<br>")
	return result
}

// EscapeHTML escapes HTML special characters.
func EscapeHTML(text string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&#039;",
	)
	return r.Replace(text)
}

// FormatNumberedList formats items as a numbered markdown list.
func FormatNumberedList[T any](items []T, formatter func(T, int) string) string {
	var sb strings.Builder
	for i, item := range items {
		if i > 0 {
			sb.WriteByte('\n')
		}
		sb.WriteString(fmt.Sprintf("%d. %s", i+1, formatter(item, i)))
	}
	return sb.String()
}

// FormatBulletList formats items as a bullet markdown list.
func FormatBulletList[T any](items []T, formatter func(T) string) string {
	var sb strings.Builder
	for i, item := range items {
		if i > 0 {
			sb.WriteByte('\n')
		}
		sb.WriteString("• ")
		sb.WriteString(formatter(item))
	}
	return sb.String()
}
