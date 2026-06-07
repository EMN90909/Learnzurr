package db

import "database/sql"

const (
	MaxOpenConnections = 30
	MaxIdleConnections = 10
)

func ConfigurePool(pool *sql.DB) {
	if pool == nil {
		return
	}
	pool.SetMaxOpenConns(MaxOpenConnections)
	pool.SetMaxIdleConns(MaxIdleConnections)
}
