package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// docsMarkdown is the plain-text API reference served at /docs.md and via
// content-negotiation (Accept: text/markdown) for AI agents like Cursor and Claude Code.
const docsMarkdown = `# Market Router API Reference

One API key. 40+ AI providers. OpenAI-compatible.

## Base URL
` + "`https://marketrouter.ai/v1`" + `

## Auth
` + "`Authorization: Bearer YOUR_API_KEY`" + `

## Chat Completions
POST /v1/chat/completions

Compatible with OpenAI SDK. Supports streaming, function calling, vision, JSON mode.

## List Models
GET /v1/models

## Supported Providers
OpenAI (gpt-4o, o3, o4-mini), Anthropic (claude-3-5-sonnet, claude-opus-4),
Google (gemini-2.5-pro, gemini-2.0-flash), DeepSeek (deepseek-v3, deepseek-r1),
Alibaba (qwen-max, qwen3), Baidu (ernie-4.0), xAI (grok-3), Mistral,
Cohere, Perplexity, Meta (llama-3.3), MiniMax, Moonshot, Zhipu, and 20+ more.

## Quick Start (Python)
` + "```python" + `
from openai import OpenAI
client = OpenAI(base_url="https://marketrouter.ai/v1", api_key="YOUR_KEY")
resp = client.chat.completions.create(model="gpt-4o", messages=[{"role":"user","content":"Hello"}])
print(resp.choices[0].message.content)
` + "```" + `

## AI Tool Config
- Cursor: Settings → OpenAI Base URL → https://marketrouter.ai/v1
- Claude Code: export ANTHROPIC_BASE_URL=https://marketrouter.ai/v1
- Cline: API Provider = OpenAI Compatible, base https://marketrouter.ai/v1
- Continue, n8n, LangChain: same base URL pattern

Full reference: https://marketrouter.ai/llms-full.txt
`

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))

	// /docs.md — Markdown API reference for AI agents (Cursor, Claude Code, etc.)
	router.GET("/docs.md", func(c *gin.Context) {
		c.Header("Content-Type", "text/markdown; charset=utf-8")
		c.Header("Cache-Control", "public, max-age=3600")
		c.String(http.StatusOK, docsMarkdown)
	})

	// Content negotiation: GET /docs with Accept: text/markdown → return Markdown
	router.GET("/docs", func(c *gin.Context) {
		accept := c.GetHeader("Accept")
		if strings.Contains(accept, "text/markdown") || strings.Contains(accept, "text/plain") {
			c.Header("Content-Type", "text/markdown; charset=utf-8")
			c.Header("Cache-Control", "public, max-age=3600")
			c.String(http.StatusOK, docsMarkdown)
			return
		}
		// Default: serve React SPA
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})

	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
