package model

import (
	"time"
)

// GuestUsage tracks anonymous trial usage by IP address.
// Each IP gets a fixed number of free messages before being asked to register.
type GuestUsage struct {
	ID        uint      `gorm:"primarykey"`
	IP        string    `gorm:"type:varchar(64);uniqueIndex;not null"`
	Count     int       `gorm:"default:0"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func init() {
	// Auto-migrate on startup (same pattern as other models)
}

// GetGuestCount returns how many messages this IP has sent.
func GetGuestCount(ip string) (int, error) {
	var g GuestUsage
	err := DB.Where("ip = ?", ip).First(&g).Error
	if err != nil {
		// Not found = 0 uses
		return 0, nil
	}
	return g.Count, nil
}

// IncrementGuestCount atomically adds 1 to the IP's message count.
func IncrementGuestCount(ip string) error {
	return DB.Exec(`
		INSERT INTO guest_usages (ip, count, created_at, updated_at)
		VALUES (?, 1, ?, ?)
		ON CONFLICT(ip) DO UPDATE SET count = count + 1, updated_at = ?
	`, ip, time.Now(), time.Now(), time.Now()).Error
}
