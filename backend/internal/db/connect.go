package db

import "context"

type Pool struct{}

func Connect(ctx context.Context) (*Pool, error) { return &Pool{}, nil }
