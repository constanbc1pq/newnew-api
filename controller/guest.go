package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

// GuestChatRequest is the body sent by the frontend for a guest chat message.
type GuestChatRequest struct {
	Message  string `json:"message" binding:"required"`
	History  []GuestMessage `json:"history"`
}

type GuestMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GuestChat handles unauthenticated trial chat requests.
// Each IP address gets GuestTrialMaxMessages total, after which registration is required.
func GuestChat(c *gin.Context) {
	ip := realIP(c)

	// Check current usage
	count, err := model.GetGuestCount(ip)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server_error"})
		return
	}
	if count >= common.GuestTrialMaxMessages {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":      "trial_exhausted",
			"used":       count,
			"max":        common.GuestTrialMaxMessages,
		})
		return
	}

	// Parse request
	var req GuestChatRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	// Get the guest token from settings (admin configures this in the option panel)
	guestToken := common.OptionMap["GuestTrialToken"]
	if guestToken == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "guest_trial_not_configured"})
		return
	}

	// Build messages array — include history (capped at last 6 turns to limit cost)
	messages := []map[string]string{
		{"role": "system", "content": "You are a helpful AI assistant. Be concise."},
	}
	histStart := 0
	if len(req.History) > 6 {
		histStart = len(req.History) - 6
	}
	for _, h := range req.History[histStart:] {
		if h.Role == "user" || h.Role == "assistant" {
			messages = append(messages, map[string]string{"role": h.Role, "content": h.Content})
		}
	}
	messages = append(messages, map[string]string{"role": "user", "content": req.Message})

	// Call the internal relay
	model_ := common.GuestTrialModel
	if model_ == "" {
		model_ = "deepseek-v3"
	}
	reply, err := callInternalRelay(guestToken, model_, messages)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "relay_error", "detail": err.Error()})
		return
	}

	// Increment usage AFTER successful response
	if incErr := model.IncrementGuestCount(ip); incErr != nil {
		common.SysLog(fmt.Sprintf("guest usage increment error for ip %s: %v", ip, incErr))
	}

	remaining := common.GuestTrialMaxMessages - (count + 1)
	c.JSON(http.StatusOK, gin.H{
		"reply":     reply,
		"used":      count + 1,
		"max":       common.GuestTrialMaxMessages,
		"remaining": remaining,
	})
}

// GuestStatus returns how many messages the current IP has used.
func GuestStatus(c *gin.Context) {
	ip := realIP(c)
	count, _ := model.GetGuestCount(ip)
	c.JSON(http.StatusOK, gin.H{
		"used":      count,
		"max":       common.GuestTrialMaxMessages,
		"remaining": common.GuestTrialMaxMessages - count,
		"exhausted": count >= common.GuestTrialMaxMessages,
	})
}

// realIP extracts the real client IP, respecting common proxy headers.
func realIP(c *gin.Context) string {
	if ip := c.GetHeader("X-Real-IP"); ip != "" {
		return strings.TrimSpace(strings.Split(ip, ",")[0])
	}
	if ip := c.GetHeader("X-Forwarded-For"); ip != "" {
		return strings.TrimSpace(strings.Split(ip, ",")[0])
	}
	return c.ClientIP()
}

// callInternalRelay makes a chat/completions request to the local relay server.
func callInternalRelay(token, modelName string, messages []map[string]string) (string, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = strconv.Itoa(*common.Port)
	}
	url := fmt.Sprintf("http://127.0.0.1:%s/v1/chat/completions", port)

	body, _ := json.Marshal(map[string]any{
		"model":       modelName,
		"messages":    messages,
		"max_tokens":  400,
		"temperature": 0.7,
	})

	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("relay returned %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse OpenAI-compatible response
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}
	if result.Error != nil {
		return "", fmt.Errorf("relay error: %s", result.Error.Message)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}
	return result.Choices[0].Message.Content, nil
}
