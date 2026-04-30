package service

import (
	"errors"
	"math/rand"
	"sync"
	"sync/atomic"

	"github.com/QuantumNous/new-api/model"
)

// poolCounters holds round-robin counters per pool (poolID → *int64).
var poolCounters sync.Map

// GetNextPoolEntry picks the next key from a pool based on its rotation mode.
// Returns the entry and a masked version of the key (first 8 chars + "...").
func GetNextPoolEntry(poolID int) (*model.KeyPoolEntry, string, error) {
	entries, err := model.GetEnabledPoolEntries(poolID)
	if err != nil {
		return nil, "", err
	}
	if len(entries) == 0 {
		return nil, "", errors.New("no enabled entries in pool")
	}

	pool, err := model.GetKeyPool(poolID)
	if err != nil {
		return nil, "", err
	}

	var entry *model.KeyPoolEntry
	switch pool.RotationMode {
	case "weighted":
		entry = weightedSelect(entries)
	case "random":
		entry = randomSelect(entries)
	default: // round_robin
		entry = roundRobinSelect(poolID, entries)
	}

	plainKey, err := DecryptPoolEntryKey(entry)
	if err != nil {
		return nil, "", err
	}

	return entry, MaskKey(plainKey), nil
}

// roundRobinSelect picks an entry using an atomic counter per pool.
func roundRobinSelect(poolID int, entries []model.KeyPoolEntry) *model.KeyPoolEntry {
	counter, _ := poolCounters.LoadOrStore(poolID, new(int64))
	c := counter.(*int64)
	idx := atomic.AddInt64(c, 1) - 1
	return &entries[int(idx)%len(entries)]
}

// weightedSelect picks an entry proportional to its Weight field.
func weightedSelect(entries []model.KeyPoolEntry) *model.KeyPoolEntry {
	total := 0
	for _, e := range entries {
		w := e.Weight
		if w <= 0 {
			w = 1
		}
		total += w
	}
	r := rand.Intn(total)
	cumulative := 0
	for i, e := range entries {
		w := e.Weight
		if w <= 0 {
			w = 1
		}
		cumulative += w
		if r < cumulative {
			return &entries[i]
		}
	}
	return &entries[len(entries)-1]
}

// randomSelect picks a uniformly random entry.
func randomSelect(entries []model.KeyPoolEntry) *model.KeyPoolEntry {
	return &entries[rand.Intn(len(entries))]
}

// MaskKey returns a display-safe version of the key (first 8 chars + "...").
func MaskKey(key string) string {
	if len(key) <= 8 {
		return "..."
	}
	return key[:8] + "..."
}

// DecryptPoolEntryKey decrypts a stored pool entry key for actual use.
// TODO: replace with common.DecryptKey(entry.EncryptedKey) when that function is available.
func DecryptPoolEntryKey(entry *model.KeyPoolEntry) (string, error) {
	if entry == nil {
		return "", errors.New("nil entry")
	}
	// Currently stored as-is (plaintext) until encryption helpers are wired up.
	return entry.EncryptedKey, nil
}
