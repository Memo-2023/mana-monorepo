Add icons to external links
Using a rehype plugin, you can identify and modify links in your Markdown files that point to external sites. This example adds icons to the end of each external link, so that visitors will know they are leaving your site.

Prerequisites
An Astro project using Markdown for content pages.
Recipe
Install the rehype-external-links plugin.

npm
pnpm
Yarn
Terminal window
npm install rehype-external-links

Import the plugin into your astro.config.mjs file.

Pass rehypeExternalLinks to the rehypePlugins array, along with an options object that includes a content property. Set this property’s type to text if you want to add plain text to the end of the link. To add HTML to the end of the link instead, set the property type to raw.

// ...
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
// ...
markdown: {
rehypePlugins: [
[
rehypeExternalLinks,
{
content: { type: 'text', value: ' 🔗' }
}
],
]
},
});

Note

The value of the content property is not represented in the accessibility tree. As such, it’s best to make clear that the link is external in the surrounding content, rather than relying on the icon alone.

Resources
rehype-external-links
