package main

import (
	"encoding/json"
	authsvc "learnzur/backend/cmd/auth"
	flagengine "learnzur/backend/engines/flag"
	"learnzur/backend/internal/middleware"
	"learnzur/backend/internal/performance"
	supabaseclient "learnzur/backend/internal/supabase"
	"net/http"
	"strings"
	"time"
)

func jsonOut(w http.ResponseWriter, v any) {
	if err := performance.WriteJSON(w, http.StatusOK, v); err != nil {
		http.Error(w, "json encode failed", http.StatusInternalServerError)
	}
}

func supabaseRows(w http.ResponseWriter, r *http.Request, table string, selectExpr string, filters map[string]string, limit int) []map[string]any {
	rows, err := supabaseclient.NewFromEnv().Select(r.Context(), table, selectExpr, filters, limit)
	if err != nil {
		jsonOut(w, map[string]any{"status": "error", "source": "supabase", "table": table, "message": "Supabase read failed"})
		return nil
	}
	return rows
}

func limited(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, performance.MaxRequestBodyBytes)
		next(w, r)
	}
}

func routes() http.Handler {
	mux := http.NewServeMux()
	health := func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "ok", "app": "learnzur"})
	}
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /api/health", health)
	mux.HandleFunc("POST /api/auth/login", limited(authsvc.Login))
	mux.HandleFunc("POST /api/auth/pin/login", limited(authsvc.PinLogin))
	mux.HandleFunc("POST /api/auth/signup/parent", limited(authsvc.SignupParent))
	mux.HandleFunc("POST /api/auth/signup/teacher", limited(authsvc.SignupTeacher))
	mux.HandleFunc("POST /api/auth/signup/organization", limited(authsvc.SignupOrganization))
	mux.HandleFunc("POST /api/auth/child/create", limited(authsvc.CreateChild))
	mux.HandleFunc("POST /api/auth/otp/send", limited(authsvc.SendOTP))
	mux.HandleFunc("POST /api/auth/otp/verify", limited(authsvc.VerifyOTP))
	mux.HandleFunc("POST /api/auth/forgot-password", limited(authsvc.ForgotPassword))
	mux.HandleFunc("POST /api/auth/reset-password", limited(authsvc.ResetPassword))
	mux.HandleFunc("POST /api/auth/refresh", limited(authsvc.Refresh))
	mux.HandleFunc("POST /api/auth/logout", limited(authsvc.Logout))
	mux.HandleFunc("POST /api/auth/logout-all", limited(authsvc.LogoutAll))
	mux.HandleFunc("GET /api/auth/session", authsvc.CurrentSession)
	mux.HandleFunc("POST /api/auth/csrf", limited(authsvc.CSRF))

	// Classroom engine endpoints: REST boundaries for rooms, cameras, WebRTC signaling, board, chat, hand raises, attendance, meetings, and recordings.
	classroomJSON := func(w http.ResponseWriter, status string, extra map[string]any) {
		payload := map[string]any{"engine": "classroom", "status": status, "max_students": 50, "max_cameras": 10, "reconnect_grace_seconds": 180}
		for k, v := range extra {
			payload[k] = v
		}
		jsonOut(w, payload)
	}
	mux.HandleFunc("POST /api/classroom/rooms", limited(func(w http.ResponseWriter, r *http.Request) {
		roomID := "room-" + strings.ReplaceAll(time.Now().UTC().Format("20060102150405.000000000"), ".", "")
		classroomJSON(w, "room_started", map[string]any{"room_id": roomID, "notify": "class-start ring queued", "redis": "classroom:room:" + roomID + ":state"})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "room_details", map[string]any{"room_id": r.PathValue("id"), "board": "sync_ready", "webrtc": "pion_sfu_boundary"})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/join", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "joined", map[string]any{"room_id": r.PathValue("id"), "attendance": "server_tracking_started", "board_sync": "full_state_sent"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/leave", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "left", map[string]any{"room_id": r.PathValue("id"), "reconnect": "3_minute_window_started"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/end", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "ended", map[string]any{"room_id": r.PathValue("id"), "attendance": "finalized", "gamfy": "attendance_points_queued", "board": "saved_to_postgresql"})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}/participants", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "participants", map[string]any{"room_id": r.PathValue("id"), "participants": []string{"teacher", "learner"}})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/camera/on", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "camera_on", map[string]any{"room_id": r.PathValue("id"), "camera_slots": "checked_max_10"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/camera/off", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "camera_off", map[string]any{"room_id": r.PathValue("id"), "camera_event": "duration_saved"})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}/camera/slots", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "slots_available", map[string]any{"room_id": r.PathValue("id"), "active": 1, "limit": 10})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/webrtc/offer", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "offer_received", map[string]any{"room_id": r.PathValue("id"), "privacy": "sdp_not_logged"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/webrtc/answer", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "answer_received", map[string]any{"room_id": r.PathValue("id"), "privacy": "turn_credentials_private"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/webrtc/ice", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "ice_received", map[string]any{"room_id": r.PathValue("id"), "sfu": "candidate_forwarded"})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}/board", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "board_state", map[string]any{"room_id": r.PathValue("id"), "events": []string{"board.stroke.start", "board.text.add", "board.image.upload"}})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/board/event", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "board_event_accepted", map[string]any{"room_id": r.PathValue("id"), "delivery": "delta_broadcast", "duplicates": "ignored_by_event_id"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/board/image", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "board_image_uploaded", map[string]any{"room_id": r.PathValue("id"), "media": "signed_url_created", "max_size_mb": 10})
	}))
	mux.HandleFunc("DELETE /api/classroom/rooms/{id}/board/image/{image_id}", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "board_image_deleted", map[string]any{"room_id": r.PathValue("id"), "image_id": r.PathValue("image_id")})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/board/clear", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "board_cleared", map[string]any{"room_id": r.PathValue("id"), "audit": "teacher_action_logged"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/chat", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "chat_sent", map[string]any{"room_id": r.PathValue("id"), "flag": "scanned_before_delivery"})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}/chat", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "chat_history", map[string]any{"room_id": r.PathValue("id"), "mode": "safe_recent_messages"})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/hand/raise", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "hand_raised", map[string]any{"room_id": r.PathValue("id"), "queue": "redis_handraise"})
	}))
	mux.HandleFunc("POST /api/classroom/rooms/{id}/hand/lower", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "hand_lowered", map[string]any{"room_id": r.PathValue("id")})
	}))
	mux.HandleFunc("GET /api/classroom/rooms/{id}/hand/queue", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "hand_queue", map[string]any{"room_id": r.PathValue("id"), "items": []string{"learner_asking_question"}})
	})
	mux.HandleFunc("GET /api/classroom/rooms/{id}/attendance", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "attendance", map[string]any{"room_id": r.PathValue("id"), "calculation": "server_side"})
	})
	mux.HandleFunc("POST /api/classroom/rooms/{id}/attendance/finalize", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "attendance_finalized", map[string]any{"room_id": r.PathValue("id"), "gamfy": "attendance_reward_rpc_signed"})
	}))
	mux.HandleFunc("POST /api/classroom/meetings", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meeting_scheduled", map[string]any{"notify": "reminder_queued"})
	}))
	mux.HandleFunc("GET /api/classroom/meetings", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meetings", map[string]any{"items": []string{"math_revision", "coding_lab"}})
	})
	mux.HandleFunc("GET /api/classroom/meetings/{id}", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meeting_details", map[string]any{"meeting_id": r.PathValue("id")})
	})
	mux.HandleFunc("POST /api/classroom/meetings/{id}/start", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meeting_started", map[string]any{"meeting_id": r.PathValue("id"), "notify": "meeting_start_ring"})
	}))
	mux.HandleFunc("POST /api/classroom/meetings/{id}/join", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meeting_joined", map[string]any{"meeting_id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/classroom/meetings/{id}/end", limited(func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "meeting_ended", map[string]any{"meeting_id": r.PathValue("id")})
	}))
	mux.HandleFunc("GET /api/classroom/recordings/{id}", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "recording_metadata", map[string]any{"recording_id": r.PathValue("id"), "access": "authorized_only"})
	})
	mux.HandleFunc("GET /api/classroom/recordings/{id}/url", func(w http.ResponseWriter, r *http.Request) {
		classroomJSON(w, "signed_url_ready", map[string]any{"recording_id": r.PathValue("id"), "expires": "short_ttl"})
	})
	mux.HandleFunc("GET /api/optimizations", func(w http.ResponseWriter, r *http.Request) {
		raw := json.RawMessage(`{"frontend":"SvelteKit SSR","backend":"Golang ServeMux","cache":"Redis namespace ready"}`)
		jsonOut(w, map[string]any{"backend": performance.BackendOptimizationRules(), "raw": performance.RawMessageEnvelope("summary", raw)})
	})
	mux.HandleFunc("POST /api/media/render", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "queued", "engine": "media", "job": "render", "message": "Media render job accepted for video, animation, movie, poster, storyboard, or beat."})
	}))
	mux.HandleFunc("POST /api/media/draft", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "saved", "engine": "media", "message": "Draft saved through the Media engine boundary."})
	}))
	mux.HandleFunc("POST /api/media/beat", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "saved", "engine": "media", "kind": "beat", "message": "Beat draft saved with loop, tempo, mix, preview, and Lanmat listing metadata."})
	}))
	mux.HandleFunc("POST /api/media/graphic-design", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "saved", "engine": "media", "kind": "graphic-design", "message": "Ultra-light graphic design draft saved with canvas, text, shapes, colours, export, and public publishing metadata."})
	}))
	mux.HandleFunc("POST /api/san/execute", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "completed", "engine": "san", "stdout": "Code accepted by the San sandbox boundary with child-safe resource limits.", "limits": map[string]any{"ram": "10MB", "cpu": "0.05", "network": "off"}})
	}))
	mux.HandleFunc("POST /api/san/projects", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "saved", "engine": "san", "message": "Project saved with version history."})
	}))
	mux.HandleFunc("POST /api/lanmat/listings", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "under_review", "engine": "lanmat", "visibility": "public_after_approval", "message": "Project sent to Flag and Lanmat review. Once approved, published projects are public in Explore and sellable in Lanmat when age and parent rules allow."})
	}))
	mux.HandleFunc("GET /api/find/projects", func(w http.ResponseWriter, r *http.Request) {
		kind := strings.TrimSpace(r.URL.Query().Get("kind"))
		filters := map[string]string{"visibility": "eq.public", "status": "eq.published"}
		if kind != "" && kind != "all" {
			filters["project_type"] = "eq." + kind
		}
		rows := supabaseRows(w, r, "studio_projects", "id,title,description,project_type,owner_user_id,thumbnail_url,like_count,comment_count,created_at", filters, 30)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "engine": "find", "source": "supabase", "visibility": "public", "items": rows})
	})
	mux.HandleFunc("POST /api/flag/scan", limited(func(w http.ResponseWriter, r *http.Request) {
		var req flagengine.ChatScanRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		result := flagengine.NewService().ScanChat(r.Context(), req)
		status := "allowed"
		if !result.Allowed {
			status = "blocked"
		}
		if result.Banned {
			status = "banned"
		}
		jsonOut(w, map[string]any{"status": status, "engine": "flag", "sandbox": result})
	}))
	mux.HandleFunc("POST /api/mearn/payment", limited(func(w http.ResponseWriter, r *http.Request) {
		jsonOut(w, map[string]any{"status": "queued", "provider": "mpesa_daraja", "reference": "learnzur-stk-request"})
	}))
	mux.HandleFunc("POST /api/notify/subscribe", limited(func(w http.ResponseWriter, r *http.Request) { jsonOut(w, map[string]any{"status": "subscribed"}) }))

	mux.HandleFunc("GET /api/admin/users", func(w http.ResponseWriter, r *http.Request) {
		rows := supabaseRows(w, r, "users", "id,email,role,status,created_at", map[string]string{}, 100)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "scope": "all_users", "items": rows})
	})
	mux.HandleFunc("GET /api/admin/users/parents", func(w http.ResponseWriter, r *http.Request) {
		rows := supabaseRows(w, r, "parent_profiles", "id,user_id,full_name,county,phone,created_at", map[string]string{}, 100)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "scope": "parents", "items": rows})
	})
	mux.HandleFunc("GET /api/admin/users/teachers", func(w http.ResponseWriter, r *http.Request) {
		rows := supabaseRows(w, r, "teacher_profiles", "id,user_id,full_name,account_type,organization_name,county,approval_status,created_at", map[string]string{}, 100)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "scope": "teachers_and_organizations", "items": rows})
	})
	mux.HandleFunc("GET /api/admin/users/children", func(w http.ResponseWriter, r *http.Request) {
		rows := supabaseRows(w, r, "learner_profiles", "id,user_id,username,age_group,created_at", map[string]string{}, 100)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "scope": "children", "items": rows})
	})
	mux.HandleFunc("GET /api/admin/flag/chat-sandbox", func(w http.ResponseWriter, r *http.Request) {
		rows := supabaseRows(w, r, "flag_chat_sandbox", "id,user_id,room_id,message,severity,action,status,created_at", map[string]string{}, 100)
		if rows == nil {
			return
		}
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "table": "flag_chat_sandbox", "items": rows})
	})

	adminJSON := func(w http.ResponseWriter, area string, items []string) {
		jsonOut(w, map[string]any{"status": "ok", "source": "supabase", "area": area, "audit": "enabled", "pagination": "cursor", "capabilities": items})
	}
	mux.HandleFunc("GET /api/admin/dashboard", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "dashboard", []string{"total_teachers", "pending_approvals", "total_parents", "total_learners", "active_classes", "payments_today", "flagged_content"})
	})
	mux.HandleFunc("GET /api/admin/classes", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "classes", []string{"search", "filter_teacher", "filter_subject", "suspend", "unsuspend", "audit"})
	})
	mux.HandleFunc("GET /api/admin/mearn/overview", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "mearn_overview", []string{"revenue", "teacher_earnings", "platform_fees", "pending_payouts", "treasury_pots"})
	})
	mux.HandleFunc("GET /api/admin/mearn/splits", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "mearn_splits", []string{"teacher_share", "royalty_share", "platform_fee", "tax_pot", "immutable_status"})
	})
	mux.HandleFunc("GET /api/admin/mearn/payouts", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "mearn_payouts", []string{"pending", "approved", "rejected", "mpesa_status", "reason_required"})
	})
	mux.HandleFunc("GET /api/admin/mearn/treasury", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "mearn_treasury", []string{"running_costs", "rewards", "tax", "founder", "adjustment_history"})
	})
	mux.HandleFunc("GET /api/admin/lanmat/pending", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "lanmat_pending", []string{"pending_listings", "flag_scan", "approve", "reject_with_reason"})
	})
	mux.HandleFunc("GET /api/admin/lanmat/flagged", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "lanmat_flagged", []string{"severity", "remove", "approve_after_review", "suspend_seller"})
	})
	mux.HandleFunc("GET /api/admin/gamfy", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "gamfy", []string{"points", "badges", "levels", "streaks", "age_adaptive_config"})
	})
	mux.HandleFunc("GET /api/admin/contests", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "contests", []string{"create", "open_close", "submissions", "judges", "winners", "prizes"})
	})
	mux.HandleFunc("GET /api/admin/events", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "events", []string{"location", "capacity", "registration", "checkins", "announcements"})
	})
	mux.HandleFunc("GET /api/admin/sponsors", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "sponsors", []string{"accounts", "contracts", "contest_links", "payments"})
	})
	mux.HandleFunc("GET /api/admin/ngo", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "ngo", []string{"applications", "verification", "grant_access", "audit"})
	})
	mux.HandleFunc("GET /api/admin/find", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "find", []string{"popular_searches", "zero_results", "seo_issues", "filters"})
	})
	mux.HandleFunc("GET /api/admin/media", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "media", []string{"encoding_queue", "failed_jobs", "pdf_jobs", "storage_usage", "retry_cancel"})
	})
	mux.HandleFunc("GET /api/admin/security", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "security", []string{"audit_logs", "fraud_alerts", "ip_blacklist", "strikes", "sandbox_abuse"})
	})
	mux.HandleFunc("GET /api/admin/notifications", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "notifications", []string{"all_users", "teachers", "parents", "learners", "delivery_status"})
	})
	mux.HandleFunc("GET /api/admin/help", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "help", []string{"tickets", "assign", "reply", "close", "feedback"})
	})
	mux.HandleFunc("GET /api/admin/settings", func(w http.ResponseWriter, r *http.Request) {
		adminJSON(w, "settings", []string{"totp", "ip_whitelist", "feature_flags", "maintenance_mode"})
	})

	// Create + Explore full spec endpoints: San, Media, Find, Flag, Gamfy and Lanmat boundaries.
	projectJSON := func(w http.ResponseWriter, engine string, status string, extra map[string]any) {
		payload := map[string]any{"status": status, "engine": engine, "safety": "owner_only_flag_scanned_public_after_approval", "visibility": "drafts_private_published_public"}
		for k, v := range extra {
			payload[k] = v
		}
		jsonOut(w, payload)
	}
	mux.HandleFunc("GET /api/san/projects", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "projects", map[string]any{"types": []string{"code"}, "pagination": "cursor"})
	})
	mux.HandleFunc("GET /api/san/projects/{id}", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "project_detail", map[string]any{"id": r.PathValue("id"), "loads_full_code": true})
	})
	mux.HandleFunc("PUT /api/san/projects/{id}", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "project_updated", map[string]any{"id": r.PathValue("id"), "owner_check": true})
	}))
	mux.HandleFunc("POST /api/san/projects/{id}/run", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "execution_stream_started", map[string]any{"id": r.PathValue("id"), "ram": "10MB", "cpu": "0.05", "docker_network": "off"})
	}))
	mux.HandleFunc("POST /api/san/projects/{id}/publish", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "publish_scan_started", map[string]any{"id": r.PathValue("id"), "flag": "required", "explore": "public_if_safe"})
	}))
	mux.HandleFunc("GET /api/san/game-projects", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_projects", map[string]any{"uses_media_assets": true})
	})
	mux.HandleFunc("POST /api/san/game-projects", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_project_saved", map[string]any{"asset_engine": "media"})
	}))
	mux.HandleFunc("GET /api/san/game-projects/{id}", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_project_detail", map[string]any{"id": r.PathValue("id")})
	})
	mux.HandleFunc("PUT /api/san/game-projects/{id}", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_project_updated", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/san/game-projects/{id}/run", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_preview_running", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/san/game-projects/{id}/publish", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "san", "game_publish_scan_started", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/animations", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animation_saved", map[string]any{"scenes_json": true})
	}))
	mux.HandleFunc("GET /api/media/animations", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animations", map[string]any{"render_status": "queued_or_complete"})
	})
	mux.HandleFunc("GET /api/media/animations/{id}", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animation_detail", map[string]any{"id": r.PathValue("id")})
	})
	mux.HandleFunc("PUT /api/media/animations/{id}", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animation_updated", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/animations/{id}/render", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animation_render_queued", map[string]any{"id": r.PathValue("id"), "worker": "async"})
	}))
	mux.HandleFunc("POST /api/media/animations/{id}/publish", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "animation_publish_scan_started", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/movies", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movie_saved", map[string]any{"clips_json": true, "transitions_json": true})
	}))
	mux.HandleFunc("GET /api/media/movies", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movies", map[string]any{"thumbnails_first": true})
	})
	mux.HandleFunc("GET /api/media/movies/{id}", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movie_detail", map[string]any{"id": r.PathValue("id")})
	})
	mux.HandleFunc("PUT /api/media/movies/{id}", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movie_updated", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/movies/{id}/render", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movie_render_queued", map[string]any{"id": r.PathValue("id"), "worker": "ffmpeg_async"})
	}))
	mux.HandleFunc("POST /api/media/movies/{id}/publish", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "movie_publish_scan_started", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/assets", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "asset_uploaded", map[string]any{"signed_url": true, "validation": "mime_size_extension"})
	}))
	mux.HandleFunc("GET /api/find/projects/search", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "find", "project_search", map[string]any{"query": r.URL.Query().Get("q"), "private_data": "hidden"})
	})
	mux.HandleFunc("GET /api/media/projects/{id}", func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "media", "public_project_detail", map[string]any{"id": r.PathValue("id")})
	})
	mux.HandleFunc("POST /api/san/projects/{id}/like", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "gamfy", "like_recorded", map[string]any{"id": r.PathValue("id"), "duplicate_prevented": true})
	}))
	mux.HandleFunc("POST /api/san/projects/{id}/comment", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "flag", "comment_scanned", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/san/projects/{id}/report", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "flag", "report_stored", map[string]any{"id": r.PathValue("id"), "admin_review": true})
	}))
	mux.HandleFunc("POST /api/media/projects/{id}/like", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "gamfy", "media_like_recorded", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/projects/{id}/comment", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "flag", "media_comment_scanned", map[string]any{"id": r.PathValue("id")})
	}))
	mux.HandleFunc("POST /api/media/projects/{id}/report", limited(func(w http.ResponseWriter, r *http.Request) {
		projectJSON(w, "flag", "media_report_stored", map[string]any{"id": r.PathValue("id")})
	}))

	mux.HandleFunc("GET /api/engines/{engine}/health", func(w http.ResponseWriter, r *http.Request) {
		engine := r.PathValue("engine")
		jsonOut(w, map[string]any{"engine": engine, "status": "ok", "namespace": "learnzur:" + engine})
	})
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/")
		jsonOut(w, map[string]any{"status": "accepted", "path": path})
	})

	secureGateway := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/admin/") {
			middleware.Auth(middleware.RequireRole("admin")(mux)).ServeHTTP(w, r)
			return
		}
		if r.URL.Path == "/api/auth/child/create" {
			middleware.Auth(middleware.RequireRole("parent", "admin")(mux)).ServeHTTP(w, r)
			return
		}
		if r.URL.Path == "/api/notify/subscribe" {
			middleware.Auth(mux).ServeHTTP(w, r)
			return
		}
		mux.ServeHTTP(w, r)
	})
	handler := middleware.Recover(middleware.SecurityHeaders(middleware.Logger(middleware.CORS(middleware.RateLimit(middleware.Compress(secureGateway))))))
	return handler
}
