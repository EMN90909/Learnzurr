package db

type PoolSettings struct { MaxOpen int; MaxIdle int }
func DefaultPoolSettings() PoolSettings { return PoolSettings{MaxOpen: 25, MaxIdle: 10} }
