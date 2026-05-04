package controller

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	system_setting "github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
)

// siteURL returns the canonical base URL for this deployment.
// Priority: admin-configured ServerAddress → request Host header.
func siteURL(c *gin.Context) string {
	addr := system_setting.ServerAddress
	if addr != "" {
		return strings.TrimRight(addr, "/")
	}
	scheme := "https"
	if c.Request.TLS == nil {
		scheme = "http"
	}
	return scheme + "://" + c.Request.Host
}

// activeModels returns a deduplicated, sorted list of all currently enabled model names.
func activeModels() []string {
	abilities := model.GetAllEnableAbilities()
	seen := make(map[string]struct{}, len(abilities))
	for _, a := range abilities {
		seen[a.Model] = struct{}{}
	}
	models := make([]string, 0, len(seen))
	for m := range seen {
		models = append(models, m)
	}
	sort.Strings(models)
	return models
}

// GetLLMsTxt serves /llms.txt — a concise, AI-friendly summary of this site.
func GetLLMsTxt(c *gin.Context) {
	site := siteURL(c)
	name := common.SystemName
	if name == "" {
		name = "Market Router"
	}
	models := activeModels()

	var sb strings.Builder
	fmt.Fprintf(&sb, "# %s\n\n", name)
	fmt.Fprintf(&sb, "> One API key. %d+ AI model providers. OpenAI-compatible routing for AI Agents, Vibe Coding, and workflow automation.\n\n", len(models))
	fmt.Fprintf(&sb, "%s is an OpenAI-compatible AI API relay and routing platform. Developers use a single API key to access models from OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, Qwen, Wenxin, and many other providers — with automatic failover, cost optimization, and CN-region acceleration.\n\n", name)

	sb.WriteString("## Quick Start for AI Tools\n\n")
	fmt.Fprintf(&sb, "```\nBase URL: %s/v1\nAPI Key:  Get from console → API page\nFormat:   OpenAI-compatible (Bearer token)\n```\n\n", site)

	sb.WriteString("### Cursor\n")
	fmt.Fprintf(&sb, "Settings → Models → OpenAI Base URL → `%s/v1`\n\n", site)

	sb.WriteString("### Claude Code / Cline\n")
	fmt.Fprintf(&sb, "```json\n{\n  \"apiProvider\": \"openai\",\n  \"openAiBaseUrl\": \"%s/v1\",\n  \"openAiApiKey\": \"YOUR_KEY\"\n}\n```\n\n", site)

	sb.WriteString("### Python\n")
	fmt.Fprintf(&sb, "```python\nfrom openai import OpenAI\nclient = OpenAI(base_url=\"%s/v1\", api_key=\"YOUR_KEY\")\n```\n\n", site)

	sb.WriteString("## Currently Active Models\n\n")
	for _, m := range models {
		fmt.Fprintf(&sb, "- %s\n", m)
	}

	sb.WriteString("\n## Key Pages\n\n")
	fmt.Fprintf(&sb, "- [API Documentation](%s/docs) — full OpenAI-compatible API reference\n", site)
	fmt.Fprintf(&sb, "- [Console / Dashboard](%s/console) — usage stats, balance, API keys\n", site)
	fmt.Fprintf(&sb, "- [Top Up](%s/console/topup) — add credits (Stripe / Alipay / WeChat / Crypto)\n", site)
	fmt.Fprintf(&sb, "- [Subscription](%s/console/subscription) — monthly plans with bonus credits\n", site)

	fmt.Fprintf(&sb, "\n_Last updated: %s — %d active models_\n", time.Now().UTC().Format("2006-01-02"), len(models))

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800") // 30 min cache
	c.String(http.StatusOK, sb.String())
}

// GetLLMsFullTxt serves /llms-full.txt — complete reference for AI agents (ChatGPT crawls this 3-4x more than llms.txt).
func GetLLMsFullTxt(c *gin.Context) {
	site := siteURL(c)
	name := common.SystemName
	if name == "" {
		name = "Market Router"
	}
	models := activeModels()

	var sb strings.Builder

	fmt.Fprintf(&sb, "# %s — Complete API Reference for AI Agents\n\n", name)
	fmt.Fprintf(&sb, "> OpenAI-compatible AI API routing. One key, %d active models, smart cost optimization.\n\n", len(models))
	sb.WriteString("---\n\n")

	fmt.Fprintf(&sb, "## What is %s?\n\n", name)
	fmt.Fprintf(&sb, "%s is an AI API relay service that sits between your application and AI model providers. You send requests using the standard OpenAI API format, and %s routes to the optimal provider by cost, latency, or availability — and returns the response in standard OpenAI format.\n\n", name, name)
	sb.WriteString("**Target users**: Developers, AI Agent builders, Vibe Coders, teams using Cursor/Cline/Claude Code/Continue/n8n/LangChain/AutoGen, and anyone wanting to reduce AI API costs or access CN-region models without a VPN.\n\n")
	sb.WriteString("---\n\n")

	sb.WriteString("## Base URL\n\n")
	fmt.Fprintf(&sb, "```\n%s/v1\n```\n\n", site)
	fmt.Fprintf(&sb, "Replace `https://api.openai.com` with `%s` in any existing OpenAI integration.\n\n", site)
	sb.WriteString("---\n\n")

	sb.WriteString("## Authentication\n\n")
	sb.WriteString("```http\nAuthorization: Bearer YOUR_API_KEY\n```\n\n")
	fmt.Fprintf(&sb, "Get your API key: Log in → Console → API page → Create API Key.\n\n")
	sb.WriteString("---\n\n")

	sb.WriteString("## Chat Completions\n\n")
	fmt.Fprintf(&sb, "```bash\ncurl %s/v1/chat/completions \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Authorization: Bearer YOUR_API_KEY\" \\\n  -d '{\"model\":\"gpt-4o\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'\n```\n\n", site)

	sb.WriteString("Supports: streaming (`stream: true`), function calling (`tools`), vision (image_url), JSON mode (`response_format`), reasoning models.\n\n")

	sb.WriteString("## List Models\n\n")
	fmt.Fprintf(&sb, "```bash\ncurl %s/v1/models -H \"Authorization: Bearer YOUR_API_KEY\"\n```\n\n", site)
	sb.WriteString("---\n\n")

	sb.WriteString("## Active Models\n\n")
	fmt.Fprintf(&sb, "The following %d models are currently enabled on this platform:\n\n", len(models))
	for _, m := range models {
		fmt.Fprintf(&sb, "- `%s`\n", m)
	}
	sb.WriteString("\n---\n\n")

	sb.WriteString("## SDK Examples\n\n")
	sb.WriteString("### Python\n")
	fmt.Fprintf(&sb, "```python\nfrom openai import OpenAI\n\nclient = OpenAI(\n    base_url=\"%s/v1\",\n    api_key=\"YOUR_API_KEY\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"gpt-4o\",\n    messages=[{\"role\": \"user\", \"content\": \"Hello\"}],\n)\nprint(response.choices[0].message.content)\n```\n\n", site)

	sb.WriteString("### Node.js\n")
	fmt.Fprintf(&sb, "```javascript\nimport OpenAI from 'openai';\nconst client = new OpenAI({ baseURL: '%s/v1', apiKey: 'YOUR_API_KEY' });\n```\n\n", site)

	sb.WriteString("### LangChain\n")
	fmt.Fprintf(&sb, "```python\nfrom langchain_openai import ChatOpenAI\nllm = ChatOpenAI(model=\"gpt-4o\", openai_api_base=\"%s/v1\", openai_api_key=\"YOUR_API_KEY\")\n```\n\n", site)
	sb.WriteString("---\n\n")

	sb.WriteString("## AI Tool Configuration\n\n")
	fmt.Fprintf(&sb, "| Tool | Setting |\n|---|---|\n| Cursor | Settings → OpenAI Base URL → `%s/v1` |\n| Claude Code | `export ANTHROPIC_BASE_URL=%s/v1` |\n| Cline | API Provider: OpenAI Compatible, Base URL: `%s/v1` |\n| Continue | `\"apiBase\": \"%s/v1\"` |\n| n8n | OpenAI credential Base URL → `%s/v1` |\n| OpenWebUI | `%s/v1` |\n\n", site, site, site, site, site, site)
	sb.WriteString("---\n\n")

	sb.WriteString("## Why Use This Instead of Direct APIs?\n\n")
	sb.WriteString("- Single API key for all providers\n")
	sb.WriteString("- CN-region acceleration (no VPN for DeepSeek, Qwen, Wenxin)\n")
	sb.WriteString("- Automatic failover between providers\n")
	sb.WriteString("- Cost optimization routing\n")
	sb.WriteString("- Alipay / WeChat Pay / Stripe / Crypto payment\n")
	sb.WriteString("- Usage analytics dashboard\n")
	sb.WriteString("- First-time top-up bonus credits\n\n")
	sb.WriteString("---\n\n")

	sb.WriteString("## Links\n\n")
	fmt.Fprintf(&sb, "- Homepage: %s\n", site)
	fmt.Fprintf(&sb, "- Console: %s/console\n", site)
	fmt.Fprintf(&sb, "- API Docs: %s/docs\n", site)
	fmt.Fprintf(&sb, "- Top Up: %s/console/topup\n", site)
	fmt.Fprintf(&sb, "- API Keys: %s/console/token\n", site)
	fmt.Fprintf(&sb, "- Model List (live): %s/v1/models\n\n", site)

	fmt.Fprintf(&sb, "_Generated: %s — %d active models_\n", time.Now().UTC().Format("2006-01-02 15:04 UTC"), len(models))

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800")
	c.String(http.StatusOK, sb.String())
}

// GetDocsMd serves /docs.md — Markdown API reference for AI agents (Cursor, Claude Code, Cline).
func GetDocsMd(c *gin.Context) {
	site := siteURL(c)
	name := common.SystemName
	if name == "" {
		name = "Market Router"
	}
	models := activeModels()

	var sb strings.Builder
	fmt.Fprintf(&sb, "# %s API Reference\n\n", name)
	fmt.Fprintf(&sb, "One API key. %d active models. OpenAI-compatible.\n\n", len(models))

	sb.WriteString("## Base URL\n\n")
	fmt.Fprintf(&sb, "`%s/v1`\n\n", site)

	sb.WriteString("## Auth\n\n")
	sb.WriteString("`Authorization: Bearer YOUR_API_KEY`\n\n")

	sb.WriteString("## Chat Completions\n\n")
	fmt.Fprintf(&sb, "```bash\ncurl %s/v1/chat/completions \\\n  -H \"Authorization: Bearer YOUR_API_KEY\" \\\n  -d '{\"model\":\"gpt-4o\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'\n```\n\n", site)
	sb.WriteString("Supports: streaming, function calling, vision, JSON mode, reasoning.\n\n")

	sb.WriteString("## List Models\n\n")
	fmt.Fprintf(&sb, "`GET %s/v1/models`\n\n", site)

	sb.WriteString("## Active Models\n\n")
	for _, m := range models {
		fmt.Fprintf(&sb, "- `%s`\n", m)
	}
	sb.WriteString("\n")

	sb.WriteString("## AI Tool Config\n\n")
	fmt.Fprintf(&sb, "- **Cursor**: Settings → OpenAI Base URL → `%s/v1`\n", site)
	fmt.Fprintf(&sb, "- **Claude Code**: `export ANTHROPIC_BASE_URL=%s/v1`\n", site)
	fmt.Fprintf(&sb, "- **Cline**: API Provider = OpenAI Compatible, Base URL = `%s/v1`\n", site)
	fmt.Fprintf(&sb, "- **Continue / n8n / LangChain**: base URL = `%s/v1`\n\n", site)

	sb.WriteString("## Python SDK\n\n")
	fmt.Fprintf(&sb, "```python\nfrom openai import OpenAI\nclient = OpenAI(base_url=\"%s/v1\", api_key=\"YOUR_KEY\")\nresp = client.chat.completions.create(model=\"gpt-4o\", messages=[{\"role\":\"user\",\"content\":\"Hello\"}])\nprint(resp.choices[0].message.content)\n```\n\n", site)

	fmt.Fprintf(&sb, "Full reference: %s/llms-full.txt\n", site)

	c.Header("Content-Type", "text/markdown; charset=utf-8")
	c.Header("Cache-Control", "public, max-age=1800")
	c.String(http.StatusOK, sb.String())
}
