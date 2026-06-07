LEARNZUR CLASSROOM ENGINE — FULL SPEC

============================================================
1. CLASSROOM ENGINE PURPOSE
============================================================

Engine name:
classroom

Path:
backend/engines/classroom/

Purpose:
The Classroom engine powers Learnzur’s live online classroom system.

It handles:
- Live video classroom
- Teacher + up to 50 students
- Maximum 10 active cameras at once
- Pion WebRTC video/audio
- SFU-style video routing
- Realtime teacher whiteboard
- Realtime drawing
- Realtime typed text on board
- Realtime erasing
- Realtime image upload to board
- Realtime board sync for all students
- Classroom chat
- Hand raising
- Attendance tracking
- Disconnect and reconnect recovery
- Meetings
- Meeting reminders
- Class-start rings
- Recording references
- Classroom announcements
- Redis live room state
- PostgreSQL permanent records
- Notify engine integration
- Gamfy engine integration
- Flag engine integration

Classroom is not just video calling.
It is a full live learning room with video, audio, board, chat, attendance, reminders, reconnects, and safety controls.

============================================================
2. CLASSROOM ENGINE FILE STRUCTURE
============================================================

backend/
└── engines/
    └── classroom/
        ├── cmd/
        │   └── classroom/
        │       └── main.go
        │
        └── internal/
            └── classroom/
                ├── handler.go
                ├── service.go
                ├── repository.go
                ├── models.go
                ├── webrtc.go
                ├── board.go
                ├── chat.go
                ├── attendance.go
                ├── meeting.go
                ├── recording.go
                ├── rpc.go
                ├── jobs.go
                ├── cache.go
                ├── security.go
                ├── speed.go
                └── errors.go

============================================================
3. WHAT EACH CLASSROOM FILE DOES
============================================================

cmd/classroom/main.go
- Starts the Classroom engine.
- Loads environment configuration.
- Connects to PostgreSQL.
- Connects to Redis.
- Starts HTTP routes.
- Starts WebSocket handling.
- Starts internal RPC server.
- Registers background jobs.
- Keeps Classroom isolated so it can fail without crashing the whole platform.

internal/classroom/handler.go
- Handles Classroom REST API requests.
- Handles WebSocket upgrade requests.
- Routes requests to service.go.
- Handles:
  - create classroom room
  - join classroom room
  - leave classroom room
  - end classroom room
  - start meeting
  - join meeting
  - send chat message
  - raise hand
  - camera on/off
  - board WebSocket connection
  - WebRTC signaling messages

internal/classroom/service.go
- Contains main Classroom business logic.
- Creates rooms.
- Allows teachers to start rooms.
- Allows learners to join rooms.
- Checks enrollment.
- Checks teacher ownership.
- Controls room lifecycle.
- Controls participant lifecycle.
- Calls attendance logic.
- Calls board logic.
- Calls WebRTC logic.
- Calls chat logic.
- Calls meeting logic.
- Calls Notify, Gamfy, and Flag through rpc.go.

internal/classroom/repository.go
- Handles all PostgreSQL queries for Classroom.
- Saves and reads:
  - classroom rooms
  - room participants
  - attendance records
  - board states
  - reconnect logs
  - camera events
  - hand raise events
  - room chat
  - meetings
  - meeting participants
  - recordings
  - classroom announcements
  - classroom audit logs

internal/classroom/models.go
- Defines Classroom data structs.
- Includes:
  - Room
  - Participant
  - Attendance
  - Meeting
  - MeetingParticipant
  - Recording
  - BoardState
  - BoardEvent
  - BoardStroke
  - BoardText
  - BoardImage
  - CameraEvent
  - HandRaise
  - ChatMessage
  - ReconnectLog
  - ClassroomAnnouncement
  - ClassroomAuditLog

internal/classroom/webrtc.go
- Handles video/audio meeting logic.
- Uses Pion WebRTC.
- Handles SDP offer/answer.
- Handles ICE candidates.
- Handles stream routing.
- Supports SFU-style video distribution.
- Enforces maximum 10 active cameras.
- Allows up to 50 students in one room.
- Supports teacher video.
- Supports learner video if allowed.
- Supports audio-first fallback.
- Handles reconnecting video sessions.
- Never exposes private WebRTC credentials.

internal/classroom/board.go
- Handles realtime whiteboard.
- Allows teacher to draw on board.
- Allows teacher to write by typing text on board.
- Allows teacher to erase board items.
- Allows teacher to clear board.
- Allows teacher to upload images onto the board.
- Allows teacher to move uploaded images.
- Allows teacher to resize uploaded images.
- Allows teacher to delete uploaded images.
- Allows teacher to change pen size.
- Allows teacher to change pen color.
- Allows teacher to use shapes if added later.
- Sends board changes to all students in realtime.
- Stores current board state in Redis.
- Saves final board state to PostgreSQL.
- Restores board state when learner reconnects.
- Uses board event IDs to prevent duplicate events.
- Broadcasts only board deltas when possible.
- Sends full board state only on first join or reconnect.

internal/classroom/chat.go
- Handles live classroom chat.
- Receives messages from teacher and learners.
- Sends learner messages to Flag engine before delivery.
- Blocks unsafe messages.
- Saves safe messages.
- Broadcasts safe messages to room participants.
- Supports parent read-only monitoring through parent dashboard.
- Rate-limits spam.

internal/classroom/attendance.go
- Tracks learner attendance server-side.
- Records join time.
- Records leave time.
- Records disconnect time.
- Records reconnect time.
- Calculates:
  - present
  - partial
  - absent
- Prevents learners from marking themselves present.
- Finalizes attendance after class ends.
- Calls Gamfy for attendance points.

internal/classroom/meeting.go
- Handles scheduled meetings.
- Allows teachers to schedule meetings.
- Allows learners to join meetings.
- Handles meeting participants.
- Handles meeting start/end.
- Calls Notify for meeting-start rings.
- Uses the same video/board logic where needed.

internal/classroom/recording.go
- Handles recording references.
- Stores recording metadata.
- Does not expose recordings publicly.
- Uses signed URLs for recording access.
- Can call Media engine if recording processing is needed.

internal/classroom/rpc.go
- Handles internal engine-to-engine communication.
- Classroom calls:
  - Notify engine for class-start rings and meeting reminders
  - Gamfy engine for attendance points
  - Flag engine for chat scanning
  - Media engine if recordings or board images need media handling

internal/classroom/jobs.go
- Handles background jobs.
- Jobs include:
  - class reminder jobs
  - meeting reminder jobs
  - room cleanup jobs
  - attendance finalization jobs
  - reconnect timeout jobs
  - recording processing jobs
  - board state persistence jobs

internal/classroom/cache.go
- Handles Redis live state.
- Stores:
  - active rooms
  - active participants
  - camera slots
  - board state
  - board events
  - reconnect state
  - hand raise queue
  - meeting live state
- Uses classroom-specific Redis namespace.
- Uses TTLs for temporary room data.

internal/classroom/security.go
- Contains 50 Classroom security rules.
- Protects:
  - room access
  - video access
  - camera limits
  - board permissions
  - uploaded board images
  - chat safety
  - meeting access
  - attendance integrity
  - recordings
  - internal RPC calls

internal/classroom/speed.go
- Contains 50 Classroom speed rules.
- Optimizes:
  - WebRTC signaling
  - WebSocket messages
  - board realtime updates
  - Redis state
  - reconnect handling
  - mobile network usage
  - attendance writes
  - meeting reminders

internal/classroom/errors.go
- Defines Classroom-specific errors.
- Examples:
  - room not found
  - room full
  - camera limit reached
  - not enrolled
  - teacher only action
  - invalid board event
  - upload too large
  - reconnect expired
  - meeting not started

============================================================
4. CLASSROOM FRONTEND ROUTES
============================================================

Teacher route:
frontend/src/routes/(teacher)/classroom/[id]/+page.svelte

Purpose:
- Teacher starts live class.
- Teacher controls video/audio.
- Teacher controls board.
- Teacher draws on board.
- Teacher types text on board.
- Teacher erases board content.
- Teacher uploads images to board.
- Teacher manages students.
- Teacher sees hand raises.
- Teacher ends class.

Learner route:
frontend/src/routes/(learner)/classroom/[id]/+page.svelte

Purpose:
- Learner joins live class.
- Learner watches teacher video.
- Learner sees whiteboard in realtime.
- Learner sees teacher drawings in realtime.
- Learner sees typed text in realtime.
- Learner sees uploaded board images in realtime.
- Learner hears audio.
- Learner can chat if allowed.
- Learner can raise hand.
- Learner can turn camera on if slot is available and teacher/class rules allow.

Teacher meetings route:
frontend/src/routes/(teacher)/meetings/+page.svelte

Purpose:
- Teacher schedules meetings.
- Teacher manages meetings.
- Teacher starts meetings.

Learner meetings route:
frontend/src/routes/(learner)/meetings/+page.svelte

Purpose:
- Learner views scheduled meetings.
- Learner joins meetings.

Parent chat monitor route:
frontend/src/routes/(parent)/chat-monitor/+page.svelte

Purpose:
- Parent can view child class chat read-only where allowed.
- Parent cannot participate in classroom chat as learner.
- Parent cannot control board or camera.

============================================================
5. CLASSROOM API ENDPOINTS
============================================================

Room endpoints:
POST   /api/classroom/rooms
- Teacher creates/starts a classroom room.

GET    /api/classroom/rooms/:id
- Get classroom room details.

POST   /api/classroom/rooms/:id/join
- Learner or teacher joins room.

POST   /api/classroom/rooms/:id/leave
- Participant leaves room.

POST   /api/classroom/rooms/:id/end
- Teacher ends room.

GET    /api/classroom/rooms/:id/participants
- Get current participants.

Camera endpoints:
POST   /api/classroom/rooms/:id/camera/on
- Turn camera on if allowed and slot available.

POST   /api/classroom/rooms/:id/camera/off
- Turn camera off.

GET    /api/classroom/rooms/:id/camera/slots
- Check active camera count and available slots.

WebRTC signaling endpoints:
POST   /api/classroom/rooms/:id/webrtc/offer
- Send WebRTC offer.

POST   /api/classroom/rooms/:id/webrtc/answer
- Send WebRTC answer.

POST   /api/classroom/rooms/:id/webrtc/ice
- Send ICE candidate.

WebSocket endpoints:
WS     /api/classroom/rooms/:id/ws
- Main realtime room socket.

WS     /api/classroom/rooms/:id/board/ws
- Realtime whiteboard socket.

WS     /api/classroom/rooms/:id/chat/ws
- Realtime chat socket.

Board endpoints:
GET    /api/classroom/rooms/:id/board
- Get current board state.

POST   /api/classroom/rooms/:id/board/event
- Send board event.

POST   /api/classroom/rooms/:id/board/image
- Upload image to board.

DELETE /api/classroom/rooms/:id/board/image/:image_id
- Delete image from board.

POST   /api/classroom/rooms/:id/board/clear
- Teacher clears board.

Chat endpoints:
POST   /api/classroom/rooms/:id/chat
- Send classroom chat message.

GET    /api/classroom/rooms/:id/chat
- Get classroom chat history.

Hand raise endpoints:
POST   /api/classroom/rooms/:id/hand/raise
- Learner raises hand.

POST   /api/classroom/rooms/:id/hand/lower
- Learner lowers hand.

GET    /api/classroom/rooms/:id/hand/queue
- Teacher gets hand raise queue.

Attendance endpoints:
GET    /api/classroom/rooms/:id/attendance
- Teacher gets attendance list.

POST   /api/classroom/rooms/:id/attendance/finalize
- Finalize attendance after class ends.

Meeting endpoints:
POST   /api/classroom/meetings
- Teacher schedules meeting.

GET    /api/classroom/meetings
- Get meetings for current user.

GET    /api/classroom/meetings/:id
- Get meeting details.

POST   /api/classroom/meetings/:id/start
- Teacher starts meeting.

POST   /api/classroom/meetings/:id/join
- Participant joins meeting.

POST   /api/classroom/meetings/:id/end
- Teacher ends meeting.

Recording endpoints:
GET    /api/classroom/recordings/:id
- Get recording metadata.

GET    /api/classroom/recordings/:id/url
- Get signed URL for recording if authorized.

============================================================
6. REALTIME WHITEBOARD FEATURES
============================================================

The whiteboard is controlled mainly by the teacher.

Teacher can:
- Draw freehand using pen tool.
- Write by typing text on the board.
- Erase strokes, text, and images.
- Clear the whole board.
- Upload image to the board.
- Move uploaded image.
- Resize uploaded image.
- Delete uploaded image.
- Change pen color.
- Change pen thickness.
- Use pointer/laser pointer if added.
- Save board state automatically.
- Restore board after reconnect.

Students can:
- See teacher drawings in realtime.
- See teacher typed text in realtime.
- See teacher erasing in realtime.
- See uploaded images in realtime.
- See moved/resized/deleted board images in realtime.
- Receive latest board state after joining late.
- Receive latest board state after reconnecting.

Optional student board permissions:
- By default, students are view-only.
- Teacher may allow a student to draw temporarily.
- Teacher may revoke student board permission.
- Student board actions must be permission-checked.
- Student board actions must be audited.

Realtime board event types:
- board.stroke.start
- board.stroke.move
- board.stroke.end
- board.text.add
- board.text.update
- board.text.delete
- board.erase
- board.clear
- board.image.upload
- board.image.move
- board.image.resize
- board.image.delete
- board.pointer.move
- board.undo
- board.redo
- board.sync.request
- board.sync.full_state

Board event fields:
- event_id
- room_id
- actor_user_id
- actor_role
- event_type
- timestamp
- payload
- sequence_number

Board stroke payload:
- stroke_id
- points
- color
- width
- tool
- created_by
- created_at

Board text payload:
- text_id
- x
- y
- value
- font_size
- color
- width
- height
- created_by
- updated_at

Board image payload:
- image_id
- file_id
- url
- x
- y
- width
- height
- rotation
- uploaded_by
- created_at

Board erase payload:
- target_type
- target_id
- erased_by
- erased_at

Board sync behavior:
- Teacher sends board event.
- Classroom validates event.
- Classroom stores event in Redis.
- Classroom broadcasts event to all connected students.
- Students apply event immediately.
- Classroom periodically saves board state to PostgreSQL.
- Late joiners receive full current board state.
- Reconnected users receive full current board state.
- Duplicate events are ignored using event_id.
- Out-of-order events are handled using sequence_number.

============================================================
7. CLASSROOM VIDEO MEETING FLOW
============================================================

Teacher starts class:
Teacher dashboard
→ classroom/[id]
→ Start Live Class
→ Classroom engine creates room
→ Redis stores room as active
→ Notify engine sends/rings class-start alert
→ Teacher WebRTC session starts
→ Teacher board session starts

Learner joins class:
Learner dashboard
→ classroom/[id]
→ Join Class
→ Classroom checks enrollment
→ Classroom checks room status
→ Classroom checks participant limit
→ Learner joins room
→ Attendance starts tracking
→ Learner receives current board state
→ Learner receives WebRTC signaling data
→ Learner sees teacher video/audio and board

During class:
Teacher can:
- Speak on camera/mic
- Draw on whiteboard
- Type text on whiteboard
- Erase whiteboard content
- Upload image on whiteboard
- Manage camera slots
- See students
- See hand raises
- Send announcements
- Moderate class flow
- End class

Learner can:
- Watch teacher video/audio
- See board updates realtime
- Chat if allowed
- Raise hand
- Turn camera on if allowed and slot available
- Reconnect if network drops

Teacher ends class:
Teacher clicks End Class
→ Classroom marks room ended
→ Attendance finalizes
→ Board state saved
→ Recording reference saved if recording exists
→ Gamfy awards attendance points
→ Notify may send class-ended summary
→ Redis room state expires/cleans up

============================================================
8. CAMERA AND VIDEO RULES
============================================================

Classroom capacity:
- 1 teacher
- Up to 50 students
- Maximum 10 active cameras at once

Camera rules:
- Teacher camera has priority.
- Learner camera requires available slot.
- Learner camera may require teacher permission.
- If 10 cameras are active, new camera requests are denied.
- Learner can stay in class with audio/chat/board even without camera.
- Audio-first fallback is supported for slow networks.
- Camera state is stored in Redis.
- Camera events are saved to PostgreSQL.
- Camera abuse is audit logged.

Video rules:
- Use Pion WebRTC.
- Use SFU-style stream routing.
- Use secure STUN/TURN configuration.
- Do not expose private TURN credentials publicly.
- Do not log SDP secrets or sensitive connection data.
- Reconnect should restore room, board, and participant state.
- If connection drops, attendance should track disconnect time.
- If learner reconnects within allowed window, attendance continues.

Camera timer:
- Track how long each camera is active.
- Track camera on/off events.
- Store camera events.
- Use camera timer for audit and testing.
- Prevent camera spam on/off toggling through rate limits.

============================================================
9. ATTENDANCE RULES
============================================================

Attendance is server-calculated.

The frontend must never decide attendance status.

Track:
- join time
- leave time
- disconnect time
- reconnect time
- total time present
- total time disconnected
- class duration
- camera active time if needed
- participation signals if needed

Attendance statuses:
- present
- partial
- absent

Attendance flow:
Learner joins room
→ server records join time
→ learner disconnects if network drops
→ server records disconnect
→ learner reconnects
→ server records reconnect
→ teacher ends class
→ server calculates attendance
→ attendance saved to PostgreSQL
→ Gamfy awards points if eligible

Reconnect rule:
- The spec requires testing disconnect for 3 minutes and reconnect.
- If learner disconnects and reconnects within the allowed window, the system should restore their session.
- Board state must be restored.
- Participant state must be restored.
- Attendance should include the reconnect behavior fairly.

============================================================
10. CHAT AND MODERATION RULES
============================================================

Classroom chat:
- Teacher can send messages.
- Learners can send messages if chat is enabled.
- Parent can monitor child chat read-only where allowed.
- Chat messages are stored in room_chat.
- Unsafe messages must be scanned by Flag before delivery.

Chat flow:
Learner sends message
→ Classroom receives message
→ Classroom calls Flag engine
→ Flag scans message
→ If safe, Classroom broadcasts message
→ If unsafe, Classroom blocks message
→ If severe, Classroom may notify parent/admin/teacher
→ Audit log is written

Chat safety:
- Sanitize messages.
- Rate-limit messages.
- Block spam.
- Block unsafe content.
- Do not expose private learner data.
- Do not allow parents to chat as learners.
- Do not allow learners to delete audit history.

============================================================
11. HAND RAISE RULES
============================================================

Learner can:
- Raise hand.
- Lower hand.

Teacher can:
- See hand raise queue.
- Clear hand raise.
- Invite learner to speak.
- Allow learner camera/mic if needed.

Rules:
- Rate-limit hand raises.
- Store hand raises in Redis for live queue.
- Save important events in PostgreSQL.
- Prevent spam clicking.
- Teacher controls the queue.

============================================================
12. MEETING RULES
============================================================

Meetings are scheduled video sessions.

Teacher can:
- Schedule meeting.
- Start meeting.
- End meeting.
- Invite participants.
- Manage meeting participants.

Learner can:
- View assigned meetings.
- Join meeting when allowed.

Notify engine:
- Sends/rings when meeting starts.
- Sends reminder before meeting.

Meeting access:
- Only invited/allowed participants can join.
- Meeting links must not work for non-members.
- Expired meetings cannot be joined.
- Meeting recording requires authorization.

============================================================
13. CLASSROOM DATABASE TABLES
============================================================

Classroom migration group:
076-090

Recommended tables:

076_classroom_rooms.sql
- Stores live classroom rooms.
Fields:
- id
- class_id
- teacher_id
- status
- started_at
- ended_at
- max_students
- max_cameras
- created_at
- updated_at

077_room_participants.sql
- Stores room participants.
Fields:
- id
- room_id
- user_id
- role
- joined_at
- left_at
- connection_status
- camera_enabled
- mic_enabled
- created_at
- updated_at

078_classroom_attendance.sql
- Stores attendance records.
Fields:
- id
- room_id
- class_id
- learner_id
- joined_at
- left_at
- total_present_seconds
- total_disconnected_seconds
- status
- finalized_at
- created_at
- updated_at

079_recordings.sql
- Stores classroom recording references.
Fields:
- id
- room_id
- file_id
- storage_url
- duration_seconds
- status
- created_at
- updated_at

080_meetings.sql
- Stores scheduled meetings.
Fields:
- id
- title
- description
- host_teacher_id
- class_id
- scheduled_start
- scheduled_end
- status
- created_at
- updated_at

081_meeting_participants.sql
- Stores meeting participants.
Fields:
- id
- meeting_id
- user_id
- role
- status
- joined_at
- left_at
- created_at
- updated_at

082_board_states.sql
- Stores whiteboard state.
Fields:
- id
- room_id
- state_json
- version
- updated_by
- created_at
- updated_at

083_reconnect_log.sql
- Stores disconnect/reconnect events.
Fields:
- id
- room_id
- user_id
- disconnected_at
- reconnected_at
- duration_seconds
- reason
- created_at

084_classroom_config.sql
- Stores classroom settings.
Fields:
- id
- max_students
- max_cameras
- reconnect_grace_seconds
- board_max_image_size_mb
- board_max_events_per_minute
- chat_enabled_default
- recording_enabled_default
- created_at
- updated_at

085_classroom_audit.sql
- Stores audit logs.
Fields:
- id
- actor_user_id
- room_id
- action
- target_type
- target_id
- metadata_json
- created_at

086_camera_events.sql
- Stores camera on/off activity.
Fields:
- id
- room_id
- user_id
- event_type
- started_at
- ended_at
- duration_seconds
- created_at

087_hand_raise_queue.sql
- Stores hand raise events.
Fields:
- id
- room_id
- learner_id
- status
- raised_at
- lowered_at
- handled_by
- created_at
- updated_at

088_room_chat.sql
- Stores classroom chat.
Fields:
- id
- room_id
- sender_id
- message
- moderation_status
- flag_id
- created_at

089_meeting_recordings.sql
- Stores meeting recording references.
Fields:
- id
- meeting_id
- file_id
- storage_url
- duration_seconds
- status
- created_at
- updated_at

090_classroom_announcements.sql
- Stores in-class announcements.
Fields:
- id
- room_id
- teacher_id
- title
- body
- created_at

Additional recommended board tables if you want more detailed board history:

091_board_events.sql
- Stores individual board events.
Fields:
- id
- room_id
- event_id
- actor_user_id
- event_type
- sequence_number
- payload_json
- created_at

092_board_assets.sql
- Stores uploaded board images/assets.
Fields:
- id
- room_id
- uploaded_by
- file_id
- storage_url
- mime_type
- size_bytes
- width
- height
- created_at

============================================================
14. CLASSROOM REDIS KEYS
============================================================

Use classroom namespace.

Examples:

classroom:room:{room_id}:state
- Active room state.

classroom:room:{room_id}:participants
- Active participant list.

classroom:room:{room_id}:cameras
- Active camera slots.

classroom:room:{room_id}:board:state
- Current board state.

classroom:room:{room_id}:board:events
- Recent board events.

classroom:room:{room_id}:handraise
- Hand raise queue.

classroom:room:{room_id}:chat:recent
- Recent chat messages.

classroom:room:{room_id}:reconnect:{user_id}
- Reconnect state for user.

classroom:meeting:{meeting_id}:state
- Live meeting state.

classroom:config
- Classroom config cache.

============================================================
15. CLASSROOM INTERNAL RPC CONNECTIONS
============================================================

Classroom → Notify
Used for:
- class starting ring
- meeting starting ring
- reminder before class
- reminder before meeting
- class-ended summary if needed

Classroom → Gamfy
Used for:
- attendance points
- participation rewards
- streak update if attendance counts as learning activity

Classroom → Flag
Used for:
- classroom chat scanning
- unsafe message blocking
- strike warning if needed

Classroom → Media
Used for:
- board image upload storage
- classroom recording storage
- meeting recording storage
- generated replay assets if needed

============================================================
16. CLASSROOM SECURITY RULES — 50
============================================================

File:
backend/engines/classroom/internal/classroom/security.go

1. Verify user authentication before joining room.
2. Check learner enrollment before joining class.
3. Check teacher owns class before starting room.
4. Check teacher owns class before ending room.
5. Check participant permission before joining meeting.
6. Generate signed room join tokens.
7. Expire room join tokens quickly.
8. Prevent token reuse after room ends.
9. Validate room status before join.
10. Prevent banned or restricted users from joining.
11. Enforce maximum 50 students per room.
12. Enforce maximum 10 active cameras.
13. Give teacher camera priority.
14. Prevent learner from forcing camera on without permission.
15. Prevent learner from controlling teacher-only tools.
16. Validate WebSocket origin.
17. Require auth on WebSocket upgrade.
18. Rate-limit WebSocket messages.
19. Validate WebRTC signaling payloads.
20. Never expose private TURN/STUN credentials.
21. Do not log sensitive WebRTC credentials.
22. Validate board event type.
23. Validate board event actor permissions.
24. Allow teacher board control by default.
25. Keep students board view-only by default.
26. Require teacher permission for student board control.
27. Validate board stroke payload size.
28. Validate board text payload size.
29. Sanitize typed board text.
30. Validate uploaded board image MIME type.
31. Limit uploaded board image size.
32. Store board images with signed/private URLs.
33. Prevent board image path traversal.
34. Prevent board event spam/flooding.
35. Prevent unauthorized board clear.
36. Prevent unauthorized board erase.
37. Ignore duplicate board events by event_id.
38. Prevent out-of-order board corruption using sequence numbers.
39. Send classroom chat through Flag before delivery.
40. Block unsafe chat messages.
41. Rate-limit chat messages.
42. Rate-limit hand raises.
43. Rate-limit reconnect attempts.
44. Prevent learner from marking own attendance.
45. Calculate attendance server-side only.
46. Track disconnect/reconnect honestly.
47. Protect recordings with authorization and signed URLs.
48. Sign RPC calls to Notify, Gamfy, Flag, and Media.
49. Audit room start, room end, camera changes, board clears, image uploads, and participant removals.
50. Store immutable classroom audit logs.

============================================================
17. CLASSROOM SPEED RULES — 50
============================================================

File:
backend/engines/classroom/internal/classroom/speed.go

1. Store live room state in Redis.
2. Store active participants in Redis.
3. Store active camera slots in Redis.
4. Store board state in Redis.
5. Store recent board events in Redis.
6. Use TTLs for temporary room data.
7. Clean room state after class ends.
8. Use WebSocket instead of polling for live events.
9. Use separate WebSocket channels for board/chat/room if needed.
10. Batch board stroke points before sending.
11. Throttle board draw events.
12. Debounce board text updates.
13. Compress large board state.
14. Broadcast board deltas instead of full state.
15. Send full board state only on join/reconnect.
16. Cache uploaded board image metadata.
17. Use signed/CDN URLs for board images.
18. Lazy-load board images.
19. Avoid sending large base64 images over WebSocket.
20. Upload images through HTTP, then broadcast image URL event.
21. Keep WebRTC signaling payloads small.
22. Avoid blocking video path with database writes.
23. Write attendance logs asynchronously.
24. Batch attendance finalization writes.
25. Write reconnect logs asynchronously.
26. Use Redis for reconnect recovery.
27. Restore board from Redis on reconnect.
28. Restore participant state from Redis on reconnect.
29. Use prepared SQL statements.
30. Index room_id fields.
31. Index class_id fields.
32. Index user_id fields.
33. Index meeting_id fields.
34. Index created_at fields on logs.
35. Cache classroom config.
36. Cache meeting schedule.
37. Send class reminders through background jobs.
38. Send Gamfy attendance rewards asynchronously.
39. Send Notify alerts asynchronously.
40. Use audio-first fallback on slow networks.
41. Reduce video quality on slow networks.
42. Limit camera count to protect bandwidth.
43. Use mobile-first payload sizes.
44. Avoid huge JSON payloads.
45. Archive old room chat and board events.
46. Paginate classroom history.
47. Use cursor-based pagination.
48. Use classroom-specific Redis namespace.
49. Use classroom-specific database pool.
50. Keep Classroom engine isolated so failure does not crash the whole app.

============================================================
18. CLASSROOM TESTS REQUIRED
============================================================

Test room flow:
- Teacher starts room.
- Learner joins room.
- Unauthorized learner is blocked.
- More than 50 students are blocked.
- Teacher ends room.

Test camera flow:
- Teacher camera turns on.
- Learner camera turns on when slot available.
- 11th camera is blocked.
- Camera timer records duration.
- Camera on/off events are saved.

Test WebRTC flow:
- Offer is accepted.
- Answer is returned.
- ICE candidates are exchanged.
- Reconnect works after network drop.
- Credentials are not logged.

Test board flow:
- Teacher draws and students see it realtime.
- Teacher types text and students see it realtime.
- Teacher erases and students see it realtime.
- Teacher clears board and students see it realtime.
- Teacher uploads image and students see it realtime.
- Teacher moves image and students see it realtime.
- Teacher resizes image and students see it realtime.
- Teacher deletes image and students see it realtime.
- Late learner receives current board state.
- Reconnected learner receives current board state.
- Duplicate board events are ignored.
- Unauthorized learner cannot edit board by default.

Test chat flow:
- Safe message is delivered.
- Unsafe message is blocked by Flag.
- Chat spam is rate-limited.
- Parent can view child chat read-only if allowed.

Test attendance flow:
- Join time is recorded.
- Disconnect time is recorded.
- Reconnect time is recorded.
- Disconnect for 3 minutes then reconnect is handled.
- Attendance is finalized correctly.
- Learner cannot mark self present.
- Gamfy receives attendance reward request.

Test meeting flow:
- Teacher schedules meeting.
- Notify sends meeting reminder.
- Teacher starts meeting.
- Learner joins meeting.
- Unauthorized user is blocked.
- Teacher ends meeting.

Test performance:
- Board drawing remains realtime.
- Board text updates remain realtime.
- Board image uploads do not freeze room.
- Video path does not wait for database writes.
- Redis reconnect recovery works.
- Mobile/slow network mode still works.

============================================================
19. SIMPLE SUMMARY
============================================================

Classroom engine = live online teaching room.

It must support:
- teacher video
- learner video
- 50 students
- 10 cameras max
- Pion WebRTC
- SFU-style video
- realtime whiteboard
- teacher drawing
- teacher typing text on board
- teacher erasing
- teacher image upload to board
- realtime board updates for all students
- chat
- hand raise
- meetings
- attendance
- reconnect after poor network
- class-start rings
- meeting-start rings
- recordings
- Redis live state
- PostgreSQL records
- Notify integration
- Gamfy integration
- Flag integration
- Media integration
- 50 security rules
- 50 speed rules

Main idea:
Teacher teaches live.
Students watch video and board realtime.
Teacher draws, types, erases, and uploads images.
Every student sees changes instantly.
Attendance is calculated by the server.
Chat is moderated.
Notifications ring when class or meeting starts.
The system is optimized for phones and slower networks.