package model

import (
	"encoding/json"
	"time"

	"github.com/QuantumNous/new-api/common"
)

// ─────────────────────────────────────────────
// Campaign statuses
// ─────────────────────────────────────────────

const (
	CampaignStatusDraft     = "draft"
	CampaignStatusScheduled = "scheduled"
	CampaignStatusSending   = "sending"
	CampaignStatusSent      = "sent"
	CampaignStatusPaused    = "paused"
)

// ─────────────────────────────────────────────
// UserSegment — filter criteria for recipient selection
// ─────────────────────────────────────────────

type UserSegment struct {
	// Quota thresholds (inclusive). 0 = no limit.
	MinQuota int64 `json:"min_quota"`
	MaxQuota int64 `json:"max_quota"`

	// Days since last login. 0 = no filter.
	InactiveDays int `json:"inactive_days"`

	// User group filter (empty = all groups).
	Groups []string `json:"groups"`

	// Only users who have completed at least one topup.
	HasTopup *bool `json:"has_topup,omitempty"`

	// Only users registered within the last N days. 0 = no filter.
	RegisteredWithinDays int `json:"registered_within_days"`
}

// ─────────────────────────────────────────────
// EmailCampaign — one marketing email blast
// ─────────────────────────────────────────────

type EmailCampaign struct {
	Id int `json:"id" gorm:"primaryKey;autoIncrement"`

	// Human-readable name shown only in the admin UI.
	Name string `json:"name" gorm:"type:varchar(200);not null"`

	// Email content
	Subject     string `json:"subject" gorm:"type:varchar(500)"`
	BodyHTML    string `json:"body_html" gorm:"type:longtext"`
	BodyText    string `json:"body_text" gorm:"type:text"`     // plain-text fallback
	FromName    string `json:"from_name" gorm:"type:varchar(100)"`

	// Scheduling
	Status      string `json:"status" gorm:"type:varchar(20);default:'draft';index"`
	ScheduledAt int64  `json:"scheduled_at"` // unix; 0 = send immediately on trigger

	// Targeting — stored as JSON blob
	SegmentJSON string `json:"segment_json" gorm:"type:text"`

	// Stats (updated as sends complete)
	TotalRecipients int `json:"total_recipients"`
	SentCount       int `json:"sent_count"`
	FailedCount     int `json:"failed_count"`

	CreatedBy int   `json:"created_by" gorm:"index"`
	CreatedAt int64 `json:"created_at"`
	UpdatedAt int64 `json:"updated_at"`
	SentAt    int64 `json:"sent_at"`
}

func (c *EmailCampaign) BeforeCreate(tx interface{ Set(string, interface{}) interface{ Error() } }) error {
	now := common.GetTimestamp()
	if c.CreatedAt == 0 {
		c.CreatedAt = now
	}
	c.UpdatedAt = now
	return nil
}

// GetSegment deserializes the segment criteria.
func (c *EmailCampaign) GetSegment() UserSegment {
	var seg UserSegment
	_ = json.Unmarshal([]byte(c.SegmentJSON), &seg)
	return seg
}

// SetSegment serializes the segment criteria.
func (c *EmailCampaign) SetSegment(seg UserSegment) {
	b, _ := json.Marshal(seg)
	c.SegmentJSON = string(b)
}

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

func CreateEmailCampaign(c *EmailCampaign) error {
	return DB.Create(c).Error
}

func UpdateEmailCampaign(c *EmailCampaign) error {
	c.UpdatedAt = common.GetTimestamp()
	return DB.Save(c).Error
}

func DeleteEmailCampaign(id int) error {
	return DB.Delete(&EmailCampaign{}, id).Error
}

func GetEmailCampaignByID(id int) (*EmailCampaign, error) {
	var c EmailCampaign
	err := DB.First(&c, id).Error
	return &c, err
}

func ListEmailCampaigns(page, size int) ([]*EmailCampaign, int64, error) {
	var campaigns []*EmailCampaign
	var total int64
	offset := (page - 1) * size
	if err := DB.Model(&EmailCampaign{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := DB.Order("id desc").Offset(offset).Limit(size).Find(&campaigns).Error; err != nil {
		return nil, 0, err
	}
	return campaigns, total, nil
}

// ─────────────────────────────────────────────
// Recipient resolution
// ─────────────────────────────────────────────

type CampaignRecipient struct {
	UserID   int
	Email    string
	Username string
}

// ResolveCampaignRecipients queries users matching the segment criteria.
// Returns a list of (userID, email, username) to send to.
func ResolveCampaignRecipients(seg UserSegment) ([]CampaignRecipient, error) {
	query := DB.Model(&User{}).
		Where("status = 1"). // enabled users only
		Where("email != ''") // must have email

	if seg.MinQuota > 0 {
		query = query.Where("quota >= ?", seg.MinQuota)
	}
	if seg.MaxQuota > 0 {
		query = query.Where("quota <= ?", seg.MaxQuota)
	}
	if seg.InactiveDays > 0 {
		cutoff := time.Now().AddDate(0, 0, -seg.InactiveDays).Unix()
		query = query.Where("accessed_time < ?", cutoff)
	}
	if len(seg.Groups) > 0 {
		query = query.Where("group IN ?", seg.Groups)
	}
	if seg.RegisteredWithinDays > 0 {
		cutoff := time.Now().AddDate(0, 0, -seg.RegisteredWithinDays).Unix()
		query = query.Where("created_time >= ?", cutoff)
	}
	if seg.HasTopup != nil {
		if *seg.HasTopup {
			// users with at least one successful topup
			query = query.Where("id IN (SELECT user_id FROM transactions WHERE type='topup' AND status='success')")
		} else {
			query = query.Where("id NOT IN (SELECT user_id FROM transactions WHERE type='topup' AND status='success')")
		}
	}

	var users []struct {
		Id       int
		Email    string
		Username string
	}
	if err := query.Select("id, email, username").Scan(&users).Error; err != nil {
		return nil, err
	}

	result := make([]CampaignRecipient, 0, len(users))
	for _, u := range users {
		result = append(result, CampaignRecipient{
			UserID:   u.Id,
			Email:    u.Email,
			Username: u.Username,
		})
	}
	return result, nil
}
