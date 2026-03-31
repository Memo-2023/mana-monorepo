<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8"/>
  
  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
          }
          h1 {
            color: #1a1a1a;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .description {
            color: #6b7280;
            margin-bottom: 30px;
          }
          .item {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .item h2 {
            margin-top: 0;
            color: #1a1a1a;
          }
          .item h2 a {
            color: inherit;
            text-decoration: none;
          }
          .item h2 a:hover {
            color: #3b82f6;
          }
          .meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .subscribe {
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            margin-bottom: 30px;
          }
          .subscribe:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
        
        <a href="{/rss/channel/link}" class="subscribe">Website besuchen</a>
        
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2>
              <a href="{link}"><xsl:value-of select="title"/></a>
            </h2>
            <div class="meta">
              <xsl:value-of select="pubDate"/> 
              <xsl:if test="author"> • <xsl:value-of select="author"/></xsl:if>
            </div>
            <p><xsl:value-of select="description"/></p>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>