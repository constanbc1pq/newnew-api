package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GET /api/admin/key_pools
func GetKeyPools(c *gin.Context) {
	pools, err := model.GetAllKeyPools()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, pools)
}

// POST /api/admin/key_pools
func CreateKeyPool(c *gin.Context) {
	var pool model.KeyPool
	if err := c.ShouldBindJSON(&pool); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.CreateKeyPool(&pool); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, pool)
}

// PUT /api/admin/key_pools/:id
func UpdateKeyPool(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := model.GetKeyPool(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := c.ShouldBindJSON(existing); err != nil {
		common.ApiError(c, err)
		return
	}
	existing.ID = id
	if err := model.UpdateKeyPool(existing); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, existing)
}

// DELETE /api/admin/key_pools/:id
func DeleteKeyPool(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := model.DeleteKeyPool(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GET /api/admin/key_pools/:id/entries
func GetKeyPoolEntries(c *gin.Context) {
	poolID, _ := strconv.Atoi(c.Param("id"))
	entries, err := model.GetEnabledPoolEntries(poolID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, entries)
}

type addKeyPoolEntryRequest struct {
	Name     string `json:"name"`
	Key      string `json:"key"`      // plaintext; controller stores it (encrypted when helper available)
	Provider string `json:"provider"`
	Weight   int    `json:"weight"`
}

// POST /api/admin/key_pools/:id/entries
func AddKeyPoolEntry(c *gin.Context) {
	poolID, _ := strconv.Atoi(c.Param("id"))
	var req addKeyPoolEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	weight := req.Weight
	if weight <= 0 {
		weight = 1
	}
	entry := &model.KeyPoolEntry{
		PoolID:       poolID,
		Name:         req.Name,
		EncryptedKey: req.Key, // TODO: replace with common.EncryptKey(req.Key) when available
		Provider:     req.Provider,
		Weight:       weight,
		Enabled:      true,
	}
	if err := model.AddKeyPoolEntry(entry); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, entry)
}

// PUT /api/admin/key_pools/:id/entries/:entry_id
func UpdateKeyPoolEntry(c *gin.Context) {
	entryID, _ := strconv.Atoi(c.Param("entry_id"))
	var entry model.KeyPoolEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		common.ApiError(c, err)
		return
	}
	entry.ID = entryID
	if err := model.UpdateKeyPoolEntry(&entry); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, entry)
}

// DELETE /api/admin/key_pools/:id/entries/:entry_id
func DeleteKeyPoolEntry(c *gin.Context) {
	entryID, _ := strconv.Atoi(c.Param("entry_id"))
	if err := model.DeleteKeyPoolEntry(entryID); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
