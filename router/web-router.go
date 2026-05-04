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

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))

	// ── AI Search Optimization ─────────────────────────────────────────────
	// /llms.txt — dynamic AI-friendly site summary (models read from DB)
	router.GET("/llms.txt", controller.GetLLMsTxt)

	// /llms-full.txt — complete reference; ChatGPT crawls this 3-4x more than llms.txt
	router.GET("/llms-full.txt", controller.GetLLMsFullTxt)

	// /docs.md — Markdown API reference for AI agents (Cursor, Claude Code, etc.)
	router.GET("/docs.md", controller.GetDocsMd)

	// /docs — content negotiation: Accept: text/markdown → Markdown; else → React SPA
	router.GET("/docs", func(c *gin.Context) {
		accept := c.GetHeader("Accept")
		if strings.Contains(accept, "text/markdown") || strings.Contains(accept, "text/plain") {
			controller.GetDocsMd(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
	// ── End AI Search Optimization ─────────────────────────────────────────

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
