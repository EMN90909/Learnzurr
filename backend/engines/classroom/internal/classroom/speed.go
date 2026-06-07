package classroom

import "time"

type SpeedProfile struct {
	Engine    string        `json:"engine"`
	CacheTTL  time.Duration `json:"cacheTtl"`
	BatchSize int           `json:"batchSize"`
}

func SpeedRules() []string {
	return []string{
		"1. Store live room state in Redis.",
		"2. Store active participants in Redis.",
		"3. Store active camera slots in Redis.",
		"4. Store board state in Redis.",
		"5. Store recent board events in Redis.",
		"6. Use TTLs for temporary room data.",
		"7. Clean room state after class ends.",
		"8. Use WebSocket instead of polling for live events.",
		"9. Use separate WebSocket channels for board/chat/room if needed.",
		"10. Batch board stroke points before sending.",
		"11. Throttle board draw events.",
		"12. Debounce board text updates.",
		"13. Compress large board state.",
		"14. Broadcast board deltas instead of full state.",
		"15. Send full board state only on join/reconnect.",
		"16. Cache uploaded board image metadata.",
		"17. Use signed/CDN URLs for board images.",
		"18. Lazy-load board images.",
		"19. Avoid sending large base64 images over WebSocket.",
		"20. Upload images through HTTP, then broadcast image URL event.",
		"21. Keep WebRTC signaling payloads small.",
		"22. Avoid blocking video path with database writes.",
		"23. Write attendance logs asynchronously.",
		"24. Batch attendance finalization writes.",
		"25. Write reconnect logs asynchronously.",
		"26. Use Redis for reconnect recovery.",
		"27. Restore board from Redis on reconnect.",
		"28. Restore participant state from Redis on reconnect.",
		"29. Use prepared SQL statements.",
		"30. Index room_id fields.",
		"31. Index class_id fields.",
		"32. Index user_id fields.",
		"33. Index meeting_id fields.",
		"34. Index created_at fields on logs.",
		"35. Cache classroom config.",
		"36. Cache meeting schedule.",
		"37. Send class reminders through background jobs.",
		"38. Send Gamfy attendance rewards asynchronously.",
		"39. Send Notify alerts asynchronously.",
		"40. Use audio-first fallback on slow networks.",
		"41. Reduce video quality on slow networks.",
		"42. Limit camera count to protect bandwidth.",
		"43. Use mobile-first payload sizes.",
		"44. Avoid huge JSON payloads.",
		"45. Archive old room chat and board events.",
		"46. Paginate classroom history.",
		"47. Use cursor-based pagination.",
		"48. Use classroom-specific Redis namespace.",
		"49. Use classroom-specific database pool.",
		"50. Keep Classroom engine isolated so failure does not crash the whole app.",
	}
}

func DefaultSpeedProfile() SpeedProfile {
	return SpeedProfile{Engine: "classroom", CacheTTL: 3 * time.Minute, BatchSize: 100}
}
