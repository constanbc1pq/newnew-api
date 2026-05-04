package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

func ListEmailCampaigns(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	campaigns, total, err := model.ListEmailCampaigns(page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": campaigns, "total": total})
}

func GetEmailCampaign(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	campaign, err := model.GetEmailCampaignByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "campaign not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": campaign})
}

func CreateEmailCampaign(c *gin.Context) {
	var campaign model.EmailCampaign
	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	adminID := c.GetInt("id")
	campaign.CreatedBy = adminID
	campaign.Status = model.CampaignStatusDraft
	if err := model.CreateEmailCampaign(&campaign); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": campaign})
}

func UpdateEmailCampaign(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	existing, err := model.GetEmailCampaignByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "campaign not found"})
		return
	}
	// Prevent editing campaigns that are already sending or sent
	if existing.Status == model.CampaignStatusSending || existing.Status == model.CampaignStatusSent {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "cannot edit a campaign that is sending or already sent"})
		return
	}
	if err := c.ShouldBindJSON(existing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	existing.Id = id // ensure ID not overwritten
	if err := model.UpdateEmailCampaign(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": existing})
}

func DeleteEmailCampaign(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	if err := model.DeleteEmailCampaign(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ─────────────────────────────────────────────
// Preview recipients
// ─────────────────────────────────────────────

func PreviewCampaignRecipients(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	campaign, err := model.GetEmailCampaignByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "campaign not found"})
		return
	}
	seg := campaign.GetSegment()
	recipients, err := model.ResolveCampaignRecipients(seg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	// Return count + first 20 as preview
	preview := recipients
	if len(preview) > 20 {
		preview = preview[:20]
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"total":   len(recipients),
		"preview": preview,
	})
}

// ─────────────────────────────────────────────
// Send / Schedule
// ─────────────────────────────────────────────

// TriggerCampaignSend starts an async send for a campaign (status → sending).
// The request returns immediately; sends happen in background goroutines.
func TriggerCampaignSend(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	campaign, err := model.GetEmailCampaignByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "campaign not found"})
		return
	}
	if campaign.Status == model.CampaignStatusSent || campaign.Status == model.CampaignStatusSending {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "campaign already sent or sending"})
		return
	}

	seg := campaign.GetSegment()
	recipients, err := model.ResolveCampaignRecipients(seg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if len(recipients) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "no recipients match the segment criteria"})
		return
	}

	// Mark as sending and update recipient count
	campaign.Status = model.CampaignStatusSending
	campaign.TotalRecipients = len(recipients)
	campaign.SentCount = 0
	campaign.FailedCount = 0
	if err := model.UpdateEmailCampaign(campaign); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Fire off async send
	go runCampaignSend(campaign, recipients)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    fmt.Sprintf("campaign send started, %d recipients", len(recipients)),
		"recipients": len(recipients),
	})
}

// runCampaignSend sends emails concurrently (max 5 workers) and updates stats.
func runCampaignSend(campaign *model.EmailCampaign, recipients []model.CampaignRecipient) {
	const workers = 5
	const batchDelay = 50 * time.Millisecond // rate-limit between sends

	var (
		sentCount   int64
		failedCount int64
		wg          sync.WaitGroup
		sem         = make(chan struct{}, workers)
	)

	for _, r := range recipients {
		wg.Add(1)
		sem <- struct{}{}
		go func(rec model.CampaignRecipient) {
			defer wg.Done()
			defer func() { <-sem }()

			err := common.SendEmail(campaign.Subject, rec.Email, campaign.BodyHTML)
			if err != nil {
				common.SysLog(fmt.Sprintf("campaign %d: failed to send to %s: %v", campaign.Id, rec.Email, err))
				atomic.AddInt64(&failedCount, 1)
			} else {
				atomic.AddInt64(&sentCount, 1)
			}
			time.Sleep(batchDelay)
		}(r)
	}

	wg.Wait()

	// Persist final stats
	final, err := model.GetEmailCampaignByID(campaign.Id)
	if err != nil {
		return
	}
	final.Status = model.CampaignStatusSent
	final.SentCount = int(atomic.LoadInt64(&sentCount))
	final.FailedCount = int(atomic.LoadInt64(&failedCount))
	final.SentAt = time.Now().Unix()
	_ = model.UpdateEmailCampaign(final)
}

// PauseCampaign sets status to paused (for scheduled campaigns only).
func PauseCampaign(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid id"})
		return
	}
	campaign, err := model.GetEmailCampaignByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "campaign not found"})
		return
	}
	if campaign.Status != model.CampaignStatusScheduled {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "only scheduled campaigns can be paused"})
		return
	}
	campaign.Status = model.CampaignStatusPaused
	if err := model.UpdateEmailCampaign(campaign); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
