package model

import (
	"time"

	"gorm.io/gorm"
)

type KeyPool struct {
	ID           int    `gorm:"primaryKey" json:"id"`
	Name         string `gorm:"uniqueIndex;size:100" json:"name"`
	Description  string `gorm:"type:text" json:"description"`
	RotationMode string `gorm:"size:20;default:'round_robin'" json:"rotation_mode"` // round_robin, weighted, random
	Enabled      bool   `gorm:"default:true" json:"enabled"`
	CreatedAt    int64  `json:"created_at"`
	UpdatedAt    int64  `json:"updated_at"`
}

type KeyPoolEntry struct {
	ID           int    `gorm:"primaryKey" json:"id"`
	PoolID       int    `gorm:"index" json:"pool_id"`
	Name         string `gorm:"size:100" json:"name"`
	EncryptedKey string `gorm:"type:text" json:"-"`     // stored encrypted, not exposed in API
	Provider     string `gorm:"size:50" json:"provider"` // openai, anthropic, gemini, etc.
	Weight       int    `gorm:"default:1" json:"weight"`
	Enabled      bool   `gorm:"default:true" json:"enabled"`
	TotalCalls   int64  `gorm:"default:0" json:"total_calls"`
	LastUsedAt   int64  `json:"last_used_at"`
	CreatedAt    int64  `json:"created_at"`
}

func (p *KeyPool) BeforeCreate(tx *gorm.DB) error {
	if p.CreatedAt == 0 {
		p.CreatedAt = time.Now().Unix()
	}
	p.UpdatedAt = time.Now().Unix()
	return nil
}

func (p *KeyPool) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now().Unix()
	return nil
}

func (e *KeyPoolEntry) BeforeCreate(tx *gorm.DB) error {
	if e.CreatedAt == 0 {
		e.CreatedAt = time.Now().Unix()
	}
	return nil
}

// GetKeyPool fetches a single pool by ID.
func GetKeyPool(id int) (*KeyPool, error) {
	var pool KeyPool
	err := DB.First(&pool, id).Error
	if err != nil {
		return nil, err
	}
	return &pool, nil
}

// GetAllKeyPools returns all pools ordered by ID.
func GetAllKeyPools() ([]KeyPool, error) {
	var pools []KeyPool
	err := DB.Order("id asc").Find(&pools).Error
	return pools, err
}

// CreateKeyPool inserts a new pool.
func CreateKeyPool(pool *KeyPool) error {
	return DB.Create(pool).Error
}

// UpdateKeyPool saves changes to an existing pool.
func UpdateKeyPool(pool *KeyPool) error {
	return DB.Save(pool).Error
}

// DeleteKeyPool removes a pool and all its entries.
func DeleteKeyPool(id int) error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	if err := tx.Where("pool_id = ?", id).Delete(&KeyPoolEntry{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&KeyPool{}, id).Error; err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}

// GetEnabledPoolEntries returns all enabled entries for a given pool.
// Used in the relay hot-path to pick the next key.
func GetEnabledPoolEntries(poolID int) ([]KeyPoolEntry, error) {
	var entries []KeyPoolEntry
	err := DB.Where("pool_id = ? AND enabled = ?", poolID, true).Find(&entries).Error
	return entries, err
}

// GetAllPoolEntries returns all entries (enabled and disabled) for a given pool.
// Used by the admin API to display the full list.
func GetAllPoolEntries(poolID int) ([]KeyPoolEntry, error) {
	var entries []KeyPoolEntry
	err := DB.Where("pool_id = ?", poolID).Order("id asc").Find(&entries).Error
	return entries, err
}

// AddKeyPoolEntry inserts a new entry.
// TODO: encrypt the key via common.EncryptKey before calling this if that function becomes available.
func AddKeyPoolEntry(entry *KeyPoolEntry) error {
	return DB.Create(entry).Error
}

// UpdateKeyPoolEntry saves changes to an existing entry.
func UpdateKeyPoolEntry(entry *KeyPoolEntry) error {
	return DB.Save(entry).Error
}

// DeleteKeyPoolEntry removes a single entry.
func DeleteKeyPoolEntry(id int) error {
	return DB.Delete(&KeyPoolEntry{}, id).Error
}

// IncrementEntryCallCount atomically increments total_calls and sets last_used_at.
func IncrementEntryCallCount(id int) error {
	return DB.Model(&KeyPoolEntry{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"total_calls":  gorm.Expr("total_calls + 1"),
			"last_used_at": time.Now().Unix(),
		}).Error
}
