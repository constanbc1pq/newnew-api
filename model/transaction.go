package model

import (
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"gorm.io/gorm"
)

const (
	TransactionTypeTopup        = "topup"
	TransactionTypeSubscription = "subscription"
	TransactionTypeUsage        = "usage"
)

type Transaction struct {
	Id            int64   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId        int     `json:"user_id" gorm:"index;not null"`
	Type          string  `json:"type" gorm:"type:varchar(20);not null"`
	Amount        float64 `json:"amount" gorm:"type:decimal(10,4)"`
	Quota         int64   `json:"quota"`
	Currency      string  `json:"currency" gorm:"type:varchar(10)"`
	Provider      string  `json:"provider" gorm:"type:varchar(30)"`
	TradeNo       string  `json:"trade_no" gorm:"type:varchar(100);uniqueIndex"`
	Status        string  `json:"status" gorm:"type:varchar(20)"`
	Metadata      string  `json:"metadata" gorm:"type:text"`
	CreatedAt     int64   `json:"created_at"`
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	if t.CreatedAt == 0 {
		t.CreatedAt = common.GetTimestamp()
	}
	return nil
}

func InsertTransaction(t *Transaction) error {
	return DB.Create(t).Error
}

// HasCompletedTopup returns true if the user has at least one successful topup transaction.
// Used to determine new-user promo eligibility.
func HasCompletedTopup(userID int) bool {
	var count int64
	DB.Model(&Transaction{}).
		Where("user_id = ? AND type = ? AND status = ?", userID, TransactionTypeTopup, common.TopUpStatusSuccess).
		Count(&count)
	return count > 0
}

// RecordTopupTransaction writes an audit entry after a successful topup.
// tradeNo must match the TopUp.TradeNo so records can be cross-referenced.
func RecordTopupTransaction(userID int, tradeNo string, provider string, amountUSD float64, quota int64, currency string) {
	t := &Transaction{
		UserId:   userID,
		Type:     TransactionTypeTopup,
		Amount:   amountUSD,
		Quota:    quota,
		Currency: currency,
		Provider: provider,
		TradeNo:  "tx_" + tradeNo,
		Status:   common.TopUpStatusSuccess,
	}
	if err := DB.Create(t).Error; err != nil {
		common.SysError(fmt.Sprintf("failed to record transaction for %s: %v", tradeNo, err))
	}
}

func GetUserTransactions(userID int, pageInfo *common.PageInfo) (txs []*Transaction, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err = tx.Model(&Transaction{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Where("user_id = ?", userID).
		Order("id desc").
		Limit(pageInfo.GetPageSize()).
		Offset(pageInfo.GetStartIdx()).
		Find(&txs).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}
	return txs, total, nil
}

func GetAllTransactions(pageInfo *common.PageInfo) (txs []*Transaction, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err = tx.Model(&Transaction{}).Count(&total).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Order("id desc").
		Limit(pageInfo.GetPageSize()).
		Offset(pageInfo.GetStartIdx()).
		Find(&txs).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}
	return txs, total, nil
}

// RechargeCrypto is the generic recharge function for crypto providers (Coinbase, NowPayments).
// It follows the same transaction pattern as Recharge/RechargeCreem/RechargeWaffo.
func RechargeCrypto(referenceId string, provider string) (err error) {
	if referenceId == "" {
		return fmt.Errorf("未提供支付单号")
	}

	var quota int64
	var amountUSD float64
	topUp := &TopUp{}

	refCol := "`trade_no`"
	if common.UsingPostgreSQL {
		refCol = `"trade_no"`
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where(refCol+" = ?", referenceId).First(topUp).Error; err != nil {
			return fmt.Errorf("充值订单不存在")
		}

		if topUp.Status == common.TopUpStatusSuccess {
			return nil // idempotent
		}

		if topUp.Status != common.TopUpStatusPending {
			return fmt.Errorf("充值订单状态错误")
		}

		topUp.CompleteTime = common.GetTimestamp()
		topUp.Status = common.TopUpStatusSuccess
		if err := tx.Save(topUp).Error; err != nil {
			return err
		}

		// Amount field stores quota units for crypto providers (same as Creem pattern)
		quota = topUp.Amount
		amountUSD = topUp.Money

		if err := tx.Model(&User{}).Where("id = ?", topUp.UserId).
			Update("quota", gorm.Expr("quota + ?", quota)).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		common.SysError(fmt.Sprintf("%s topup failed: %v", provider, err))
		return fmt.Errorf("充值失败，请稍后重试")
	}

	RecordLog(topUp.UserId, LogTypeTopup, fmt.Sprintf("%s充值成功，充值额度: %v，支付金额：%.4f USD",
		provider, logger.FormatQuota(int(quota)), amountUSD))

	// Write audit transaction record
	RecordTopupTransaction(topUp.UserId, referenceId, provider, amountUSD, quota, "USD")

	return nil
}
