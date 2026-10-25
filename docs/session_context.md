# Hopback — Session Context (MVP v1)

> Tài liệu tổng hợp toàn bộ context kỹ thuật của dự án, dùng làm điểm xuất phát cho các session build MVP.
> Cập nhật: 16/10/2026.
>
> Quy ước trạng thái:
> - **[Đã chốt]**: đã thống nhất trong các buổi thảo luận.
> - **[Đề xuất]**: phương án mặc định do Tech Lead đưa ra, chưa bàn kỹ, có thể đổi khi build.
> - **[Mở]**: chưa quyết định.

---

## 0. TL;DR

- **Hopback** là một "Context Container Workspace" cho người làm 2–3 công việc/client song song (freelancer, người đa nhiệm).
- **Mục tiêu kép:** giải quyết bài toán thực tế của chính tác giả, đồng thời là dự án end-to-end để đưa vào CV ứng tuyển Software Engineer.
- **MVP gồm 4 tính năng:** Fast Workspace Switcher, Client Resource Hub, Unified Master Calendar, "Where was I?".
- **Stack:** TypeScript end-to-end trong monorepo (pnpm + Turborepo). Frontend là React + Vite SPA với TanStack Router, TanStack Query và Zustand. Backend là NestJS theo Clean Architecture. Database là PostgreSQL + Drizzle. Contract dùng chung bằng Zod. Hạ tầng gồm Docker, GitHub Actions, VPS + Caddy.
- **Database:** 7 bảng; composite FK đảm bảo tenant isolation; Row-Level Security; xử lý múi giờ theo ngày địa phương. Đã chạy thử trên PostgreSQL 16.

---

## 1. Sản phẩm

### 1.1 Tên và nhận diện [Đã chốt]

| Mục | Giá trị |
|---|---|
| Tên | **Hopback** (repo `hopback`, package scope `@hopback/*`) |
| Tagline | *"Hop back into any client, instantly."* |
| Logo | Con tôm thân cong, chia đốt, mỗi đốt một màu client. Hai râu kéo dài ra phía sau đầu, đóng vai trò vệt tốc độ, thể hiện cú búng đuôi bật lùi (tôm "hop back" theo nghĩa đen). |
| Wordmark | `hopback` viết thường: "hop" đậm (700), "back" thường (400) |
| Font | Sora, fallback `'Segoe UI', system-ui, sans-serif` |
| Canvas logo | https://claude.ai/artifact/RiCTVGtnapar2aUiwp78MV (gồm logo ngang, biểu tượng đơn, bảng kích thước) |

Bảng màu logo (bản "clients"):

| Vai trò | Hex |
|---|---|
| Đầu tôm / râu (màu thương hiệu) | `#E5573F` |
| Đốt 1 | `#6E5BD6` |
| Đốt 2 | `#18A08A` |
| Đốt 3 | `#F2A33A` |
| Đốt 4 + đuôi | `#3A7FE8` |
| Ink (chữ, nền tối) | `#14161F` |
| Chữ phụ (nền sáng / nền tối) | `#5B6070` / `#A9AEBD` |

Các bản logo khác: `mono` (các tông san hô đậm dần về phía đầu), `ink` (đen tuyền), `white` (trắng). Ở cỡ 16 px (favicon, system tray), nên dùng bản `mono` hoặc `ink` thay cho bản nhiều màu.

Tên đã cân nhắc và loại, không đề xuất lại: Switchyard (trùng NVIDIA), Cairn (quá nhiều dev tool trùng tên), Waypoint (HashiCorp), Mise (dev tool), Bento (BentoML), Backburner (Autodesk), Hummingbird (thuật toán của Google), Dragonfly (datastore).

### 1.2 Problem statement [Đã chốt]

Đối tượng là người làm nhiều công việc hoặc dự án song song, mỗi việc với một client base khác nhau. Họ gặp bốn vấn đề:

1. **Context switching cost:** tốn thời gian và năng lượng nhận thức mỗi lần nhảy giữa các việc.
2. **Tài nguyên phân mảnh:** mỗi client có hệ sinh thái riêng (links, docs, contacts), dẫn tới mở tab hỗn loạn.
3. **Xung đột deadline:** thiếu một timeline tổng hợp để thấy các hạn chót có chồng chéo trong cùng ngày hoặc tuần hay không.
4. **Mất dấu công việc:** khó bắt nhịp lại sau khi switch ("lần trước mình đang làm dở đến đâu?").

### 1.3 Tính năng MVP

Ngoài 4 tính năng chính, MVP còn cần ba phần nền: auth (đăng ký, đăng nhập), CRUD và lưu trữ workspace, và CRUD task (vì task chính là nguồn deadline cho calendar).

**F1. Fast Workspace Switcher** [Đã chốt về mục tiêu; tiêu chí chi tiết là Đề xuất]
- Chuyển workspace qua Sidebar hoặc Command Palette `Cmd/Ctrl + K`, không reload trang.
- Cmd+K mặc định sắp workspace theo thứ tự dùng gần nhất (MRU, dựa trên `last_opened_at`); gõ để tìm workspace và task (tìm theo tiêu đề, fuzzy).
- Prefetch dữ liệu của workspace khi hover item trong Sidebar hoặc Cmd+K.
- Ghi nhớ route cuối cùng của từng workspace; switch về là quay đúng màn hình đang xem.
- Tiêu chí: switch sang workspace đã có trong cache phải hiển thị ngay, không có trạng thái loading.

**F2. Client Resource Hub** [Đã chốt]
- Quick links: URL, tiêu đề, `provider` (figma, google_drive, github…) suy ra từ host để hiển thị icon.
- Ghi chú dạng markdown.
- Key contacts: tên, vai trò, email, điện thoại, handle Zalo/Slack/Telegram.
- Ghim và sắp xếp thủ công.
- **Không lưu credentials hay secret trong MVP.** Chỉ lưu link sang password manager. Mã hóa (AES-256-GCM với envelope encryption) nằm trong roadmap.

**F3. Unified Master Calendar** [Đã chốt về mục tiêu; quy tắc xung đột là Đề xuất]
- Hiển thị deadline của mọi workspace trên một timeline, có view tháng và tuần, tô màu theo workspace, lọc được theo workspace.
- Phát hiện xung đột theo **ngày địa phương** của người dùng. Database chỉ tổng hợp tải theo từng ngày; quy tắc "thế nào là xung đột" nằm trong domain (`DeadlineConflictPolicy`). Mặc định đề xuất: ngày có từ 2 workspace có deadline trở lên, hoặc có từ 4 task chưa xong trở lên.

**F4. "Where was I?" (Session Resume)** [Đã chốt]
- Trước khi switch đi, lưu nhanh một snapshot: `current_state` (đang làm gì), `next_step` (bước tiếp theo), và tùy chọn task liên quan.
- Khi quay lại workspace, hiển thị snapshot mới nhất. Sidebar có thể hiển thị gợi ý từ snapshot mới nhất của mọi workspace.
- Lịch sử là append-only, không ghi đè.
- [Đề xuất] Khi switch đi, hiện một ô nhập nhỏ có thể bỏ qua (Esc), không chặn thao tác switch.

---

## 2. Tech stack [Đã chốt]

| Tầng | Lựa chọn | Lý do chính |
|---|---|---|
| Ngôn ngữ | TypeScript end-to-end | Một ngôn ngữ, type-safety xuyên FE/BE |
| Monorepo | pnpm workspaces + Turborepo | Chia sẻ contract; CI chỉ build phần thay đổi |
| Frontend | React + Vite (SPA) | Dashboard sau login, không cần SEO; dễ đóng gói desktop sau này |
| Routing | TanStack Router | Type-safe params; URL là nguồn sự thật (`/w/:slug/...`) |
| Server state | TanStack Query | Cache theo workspace, prefetch, optimistic UI |
| Client state | Zustand | Route cuối của từng workspace, trạng thái palette, UI state |
| UI | Tailwind + shadcn/ui + cmdk | Command palette, tốc độ build |
| Form + validation | React Hook Form + Zod | Dùng chung schema với backend |
| Backend | NestJS | Module và DI ánh xạ tự nhiên vào các tầng Clean Architecture |
| Database | PostgreSQL ≥ 15 (đã test trên 16) | Partial index, RLS, `ON DELETE SET NULL (col)` |
| Data access | Drizzle ORM | SQL-first, thể hiện được năng lực SQL |
| Contracts | Zod, package `@hopback/contracts` | Một nguồn schema cho FE/BE |
| Auth | Tự triển khai session-based, argon2id | Hiểu bản chất; dùng chung cho web và desktop |
| Testing | Vitest, Testcontainers, Playwright | Unit domain, integration với DB thật, E2E |
| Logging, lỗi | Pino (structured log), Sentry | Tư duy production |
| Container | Docker multi-stage, `turbo prune --docker` | Image gọn |
| CI/CD | GitHub Actions → GHCR → VPS | Tự động hóa toàn bộ |
| Hosting | VPS + Docker Compose + Caddy (HTTPS tự động) | Link demo luôn sống, thể hiện năng lực vận hành |

**[Mở]** Câu hỏi "nhắm vào nhóm công ty nào?" chưa được trả lời. Nếu nhắm ngân hàng, fintech lớn hoặc outsourcing (nơi Java chiếm ưu thế), có thể thay NestJS bằng Spring Boot và giữ nguyên phần còn lại. Tài liệu này giả định TypeScript.

### 2.1 Cố ý KHÔNG dùng trong MVP [Đã chốt]

Microservices, Kubernetes, Kafka, GraphQL, tRPC (chọn REST cho dễ giải thích), Redis (chỉ thêm khi đo được nhu cầu thật), Next.js/SSR. Mỗi lựa chọn loại bỏ nên có một ADR trong `docs/adr/`.

---

## 3. Kiến trúc

### 3.1 Monorepo và quy tắc phụ thuộc [Đã chốt]

- **App là vỏ mỏng, logic nằm trong packages.** Khi thêm desktop, chỉ cần viết thêm một vỏ.
- **Chiều phụ thuộc:** `apps/*` → `packages/*`, không bao giờ ngược lại. `packages/app` không import `apps/api`. Ép bằng `eslint-plugin-boundaries` hoặc `dependency-cruiser` trong CI.
- Turborepo cache task; CI chỉ chạy lại cho package bị ảnh hưởng.

### 3.2 Backend: Clean Architecture [Đã chốt]

Bốn tầng trong mỗi module NestJS:

- `domain/`: entity và business rule thuần TypeScript, không import framework.
- `application/`: use case và port (interface repository).
- `infrastructure/`: Drizzle repository và các adapter bên ngoài.
- `presentation/`: controller và DTO (lấy từ Zod contracts).

**Chỉ áp đủ 4 tầng cho module có logic thật:** `calendar` (phát hiện xung đột) và `snapshots` (resume). Các module CRUD (`resources`, `contacts`, phần lớn `workspaces`, `tasks`) để mỏng: controller → service → repository. Áp Clean Architecture máy móc cho CRUD là dấu hiệu over-engineering.

**Ngữ cảnh RLS trong mỗi request:** mỗi request chạy trong một transaction, bắt đầu bằng `SET LOCAL app.current_user_id = '<uuid>'`. Đặt việc này trong một helper hoặc interceptor dùng chung, ví dụ `withUserTx(userId, fn)` trong `shared/db`.

### 3.3 Frontend: state architecture [Đã chốt]

Ba loại state, mỗi loại một chỗ:

| Loại | Công cụ | Nội dung |
|---|---|---|
| Server state | TanStack Query | tasks, resources, contacts, snapshots, calendar |
| Client state | Zustand | `lastRouteByWorkspace`, trạng thái palette, UI tạm |
| URL | TanStack Router | workspace đang active (`/w/:slug`), view hiện tại |

Quy ước query key [Đề xuất], luôn scope theo workspace để cache của từng workspace độc lập:

```ts
['workspaces']
['workspace', workspaceId, 'tasks', filters]
['workspace', workspaceId, 'resources']
['workspace', workspaceId, 'contacts']
['workspace', workspaceId, 'snapshot', 'latest']
['snapshots', 'latest']                    // mọi workspace, cho sidebar
['calendar', from, to]
['calendar', 'day-load', from, to]
['search', q]
```

Các mutation dùng optimistic update (cập nhật UI trước, rollback nếu API lỗi): tick task, tạo task, ghim hoặc sắp xếp resource, lưu snapshot. Mẫu chuẩn: `onMutate` (snapshot cache cũ, ghi cache mới) → `onError` (rollback) → `onSettled` (invalidate). Khi `due_at` của task thay đổi, phải invalidate cả các key `['calendar', ...]`.

Hai chi tiết giúp optimistic UI đơn giản:
- **UUIDv7 do client sinh:** không cần ánh xạ ID tạm sang ID thật.
- **`sort_key` dạng fractional index:** sắp xếp lại chỉ cập nhật một dòng.

### 3.4 Sẵn sàng cho desktop [Đã chốt về hướng; công nghệ là Mở]

- Package `@hopback/platform` định nghĩa interface cho các khả năng phụ thuộc nền tảng: `notify()`, `openExternal(url)`, `registerGlobalShortcut()`, `secureStorage`. Web và desktop mỗi bên có implementation riêng, inject vào `@hopback/app`. Đây là Ports & Adapters ở frontend.
- Tính năng desktop đáng làm sau MVP: phím tắt toàn cục mở Cmd+K từ mọi ứng dụng, icon system tray hiển thị workspace đang active, thông báo native khi deadline đến gần, cửa sổ nhỏ luôn nổi trên cùng hiển thị "Where was I?".
- **[Mở]** Tauri hay Electron. Electron dùng thuần JS/TS và Chromium đồng nhất. Tauri nhẹ hơn, là điểm khác biệt trên CV, nhưng dùng webview của hệ điều hành (WebKit trên macOS) và phần native viết bằng Rust.

### 3.5 Auth [Đã chốt]

- Đăng ký và đăng nhập bằng email + mật khẩu, hash bằng argon2id.
- Server sinh token ngẫu nhiên; DB chỉ lưu SHA-256 của token (bảng `sessions`).
- Web nhận token qua cookie `httpOnly`, `Secure`, `SameSite=Lax`.
- **Ngay từ đầu, auth middleware chấp nhận cả cookie lẫn header `Authorization: Bearer <token>`**, cùng tra vào bảng `sessions`. Mục đích là để desktop app sau này dùng được mà không phải sửa auth.
- Google OAuth: để sau MVP.

---

## 4. Cấu trúc source [Đề xuất]

```
hopback/
├── apps/
│   ├── api/                          # NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── shared/
│   │   │   │   ├── db/               # Drizzle client, schema.ts, withUserTx (SET LOCAL)
│   │   │   │   ├── auth/             # session guard (cookie + Bearer), argon2
│   │   │   │   ├── config/           # env validation bằng Zod
│   │   │   │   └── errors/           # problem+json filter
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── workspaces/       # CRUD + archive + touch last_opened_at
│   │   │       ├── tasks/            # CRUD
│   │   │       ├── resources/        # CRUD mỏng
│   │   │       ├── contacts/         # CRUD mỏng
│   │   │       ├── search/
│   │   │       ├── calendar/         # Clean Architecture đủ 4 tầng
│   │   │       │   ├── domain/           # day-load.ts, deadline-conflict.policy.ts
│   │   │       │   ├── application/      # get-calendar.use-case.ts, ports/
│   │   │       │   ├── infrastructure/   # drizzle-calendar.repository.ts
│   │   │       │   └── presentation/     # calendar.controller.ts
│   │   │       └── snapshots/        # Clean Architecture đủ 4 tầng
│   │   ├── drizzle/migrations/
│   │   ├── test/                     # integration test (Testcontainers)
│   │   └── Dockerfile
│   ├── web/                          # vỏ mỏng cho trình duyệt
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── router.tsx            # khai báo route TanStack Router
│   │   │   └── platform/web-platform.ts
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── desktop/                      # sau MVP
├── packages/
│   ├── contracts/                    # Zod schema + type suy ra
│   │   └── src/{auth,workspace,task,resource,contact,snapshot,calendar,search}.ts
│   ├── app/                          # toàn bộ tính năng frontend
│   │   └── src/
│   │       ├── api/                  # fetch client, query keys, hooks
│   │       ├── stores/               # Zustand
│   │       └── features/{switcher,resource-hub,calendar,resume,tasks,auth}/
│   ├── ui/                           # shadcn components, cmdk wrapper, logo, workspace color dot
│   ├── platform/                     # interface Platform
│   └── config/                       # tsconfig, eslint dùng chung
├── e2e/                              # Playwright
├── db/
│   ├── schema.sql                    # DDL tham chiếu (mục 5)
│   └── queries.sql                   # query chính (mục 5)
├── infra/
│   ├── docker-compose.yml            # dev: postgres
│   ├── docker-compose.prod.yml       # api + web + postgres + caddy
│   └── Caddyfile
├── docs/adr/
├── .github/workflows/{ci.yml,deploy.yml}
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Chiến lược migration** [Đề xuất]: dùng chính `db/schema.sql` làm migration đầu tiên (Drizzle hỗ trợ custom SQL migration), rồi khai báo `schema.ts` khớp với nó để có query type-safe. Các thay đổi sau dùng `drizzle-kit generate`, và viết tay những phần Drizzle không biểu diễn được. Cần kiểm tra mức hỗ trợ của phiên bản Drizzle đang dùng với RLS policy, trigger, partial index và composite FK có `ON DELETE SET NULL (column)`.

---

## 5. Database

### 5.1 Quy ước [Đã chốt]

- **ID:** UUID. Ứng dụng (kể cả client) sinh UUIDv7; default trong DB chỉ là phương án dự phòng. Từ PostgreSQL 18 có thể dùng hàm `uuidv7()` có sẵn.
- **Mọi bảng tenant mang cả `workspace_id` và `user_id`**, ràng buộc bằng composite FK `(workspace_id, user_id) → workspaces(id, user_id)`. Nhờ vậy DB đảm bảo `user_id` luôn khớp với chủ workspace, đồng thời query calendar xuyên workspace chỉ cần index `(user_id, due_at)` và RLS policy chỉ là một phép so sánh bằng.
- **Enum:** dùng `text` + `CHECK` thay cho PG ENUM để migration dễ hơn.
- **Thứ tự thủ công:** `sort_key text COLLATE "C"` theo fractional indexing.
- **Thời gian:** luôn `timestamptz`. Ngày "địa phương" tính bằng `AT TIME ZONE users.timezone` (tên IANA, kiểm tra hợp lệ ở tầng ứng dụng).
- **Deadline cả ngày** [Đề xuất]: `is_all_day = true`, và `due_at` lưu 23:59:59 giờ địa phương tại thời điểm tạo. Hạn chế đã biết: nếu người dùng đổi múi giờ, deadline cả ngày có thể lệch ngày.
- **Xóa:** workspace dùng soft-archive (`archived_at`). Các bảng khác xóa cứng trong MVP.
- **RLS:** bật trên `workspaces`, `tasks`, `resources`, `contacts`, `context_snapshots`. API kết nối bằng role **không phải owner** (ví dụ `app_user`), vì owner bỏ qua RLS. `users` và `sessions` không bật RLS vì lúc đăng nhập chưa có user context.

### 5.2 Các bảng

| Bảng | Vai trò | Index chính |
|---|---|---|
| `users` | Tài khoản, `timezone` | unique `email` (citext) |
| `sessions` | Session server-side, lưu hash token | `user_id`, `expires_at` |
| `workspaces` | Mỗi client/project một workspace; màu, MRU, archive | `(user_id, sort_key)` partial chưa archive; unique `(user_id, slug)` |
| `tasks` | Task và deadline | `(user_id, due_at)` partial `due_at IS NOT NULL`; `(workspace_id, status, due_at)`; GIN trigram trên `title` |
| `resources` | Link và ghi chú (CHECK hình dạng theo `kind`) | `(workspace_id, is_pinned DESC, sort_key)` |
| `contacts` | Liên hệ của client | `(workspace_id, sort_key)` |
| `context_snapshots` | "Where was I?", append-only | `(workspace_id, created_at DESC)` |

Quan hệ: `users 1–n sessions`, `users 1–n workspaces`, `workspaces 1–n tasks/resources/contacts/context_snapshots`, `tasks 0..1–n context_snapshots`. Snapshot chỉ được trỏ tới task **cùng workspace** (composite FK `(task_id, workspace_id)`); khi task bị xóa thì chỉ `task_id` bị đặt NULL, ghi chú vẫn giữ.

### 5.3 Đã kiểm chứng trên PostgreSQL 16

- Composite FK chặn task có `user_id` khác chủ workspace.
- Snapshot không trỏ được tới task của workspace khác.
- CHECK `resources_kind_shape` và `tasks_done_has_completed_at` hoạt động.
- RLS: chưa đặt user context thì trả về 0 dòng; insert dữ liệu cho user khác bị chặn.
- Xóa task thì snapshot giữ nguyên, chỉ `task_id` thành NULL.
- Query calendar dùng Index Scan trên `idx_tasks_calendar`.
- Gom nhóm theo ngày địa phương đúng: task hạn 01:00 ngày 21/10 giờ Việt Nam (tức 18:00 ngày 20/10 UTC) được xếp vào ngày 21/10.

### 5.4 DDL đầy đủ (`db/schema.sql`)

```sql
-- =====================================================================
-- Context Container Workspace — MVP schema
-- Target: PostgreSQL 15+  (uses ON DELETE SET NULL (column) from PG15)
--
-- Conventions
--   * IDs are UUIDs. The application generates UUIDv7 (time-ordered) so the
--     client can create IDs itself for optimistic UI; the DB default is only
--     a fallback. (PG18+ can use the native uuidv7() as the default.)
--   * Every tenant-owned table carries BOTH workspace_id and user_id.
--     A composite FK (workspace_id, user_id) -> workspaces(id, user_id)
--     guarantees the denormalized user_id always matches the workspace owner.
--   * Enumerations are text + CHECK instead of PG ENUM (easier migrations).
--   * Manual ordering uses fractional-index sort keys (text, COLLATE "C"):
--     a reorder is a single-row update, which keeps optimistic UI simple.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Returns the user id the app set for the current transaction, or NULL.
-- App code runs:  SET LOCAL app.current_user_id = '<uuid>';
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

-- ---------------------------------------------------------------------
-- Identity & auth
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext      NOT NULL UNIQUE,
  password_hash  text        NOT NULL,                 -- argon2id
  display_name   text        NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  timezone       text        NOT NULL DEFAULT 'Asia/Ho_Chi_Minh', -- IANA name, validated in app
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Server-side sessions. Only a SHA-256 hash of the cookie token is stored,
-- so a database leak does not leak usable sessions.
CREATE TABLE sessions (
  token_hash    bytea       PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  user_id       uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at    timestamptz NOT NULL,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user    ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);   -- cleanup job

-- ---------------------------------------------------------------------
-- Workspaces (one per client / project)
-- ---------------------------------------------------------------------
CREATE TABLE workspaces (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name            text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  slug            text        NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  color           text        NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'), -- calendar colour
  sort_key        text        COLLATE "C" NOT NULL,          -- sidebar order
  last_opened_at  timestamptz,                               -- MRU order in Cmd+K
  archived_at     timestamptz,                               -- soft-archive finished clients
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT workspaces_user_slug_key UNIQUE (user_id, slug),  -- URL: /w/:slug
  CONSTRAINT workspaces_id_user_key   UNIQUE (id, user_id)     -- target of composite FKs
);
CREATE INDEX idx_workspaces_sidebar
  ON workspaces (user_id, sort_key) WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------
-- Tasks & deadlines (feed the Unified Master Calendar)
-- ---------------------------------------------------------------------
CREATE TABLE tasks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL,
  user_id       uuid        NOT NULL,
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  notes         text,
  status        text        NOT NULL DEFAULT 'todo'
                            CHECK (status IN ('todo', 'in_progress', 'done')),
  priority      smallint    NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3), -- 1 = high
  due_at        timestamptz,
  is_all_day    boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tasks_workspace_fk FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspaces (id, user_id) ON DELETE CASCADE,
  CONSTRAINT tasks_id_workspace_key UNIQUE (id, workspace_id), -- target for snapshots FK
  CONSTRAINT tasks_done_has_completed_at CHECK ((status = 'done') = (completed_at IS NOT NULL)),
  CONSTRAINT tasks_all_day_needs_due     CHECK (NOT is_all_day OR due_at IS NOT NULL)
);
-- Unified calendar: all deadlines of one user in a time range, across workspaces.
CREATE INDEX idx_tasks_calendar
  ON tasks (user_id, due_at) WHERE due_at IS NOT NULL;
-- Task list inside one workspace (also serves the FK cascade lookup).
CREATE INDEX idx_tasks_workspace
  ON tasks (workspace_id, status, due_at NULLS LAST);
-- Cmd+K fuzzy search on titles.
CREATE INDEX idx_tasks_title_trgm
  ON tasks USING gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Client Resource Hub
-- ---------------------------------------------------------------------
-- Links and notes share one table: same list, same pin/order behaviour.
-- Secrets/credentials are intentionally NOT stored in the MVP.
CREATE TABLE resources (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL,
  user_id       uuid        NOT NULL,
  kind          text        NOT NULL CHECK (kind IN ('link', 'note')),
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url           text        CHECK (url ~* '^https?://'),
  provider      text,       -- 'figma' | 'google_drive' | 'github' | ... derived from URL host, for icons
  body          text,       -- markdown, for notes
  is_pinned     boolean     NOT NULL DEFAULT false,
  sort_key      text        COLLATE "C" NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT resources_workspace_fk FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspaces (id, user_id) ON DELETE CASCADE,
  CONSTRAINT resources_kind_shape CHECK (
       (kind = 'link' AND url IS NOT NULL AND body IS NULL)
    OR (kind = 'note' AND url IS NULL     AND body IS NOT NULL)
  )
);
CREATE INDEX idx_resources_hub
  ON resources (workspace_id, is_pinned DESC, sort_key);

-- Contacts are structured people records, so they get their own table.
CREATE TABLE contacts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL,
  user_id           uuid        NOT NULL,
  full_name         text        NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  role              text,       -- "PM", "Accountant", ...
  email             citext,
  phone             text,
  messaging_handle  text,       -- Zalo / Slack / Telegram handle
  notes             text,
  sort_key          text        COLLATE "C" NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contacts_workspace_fk FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspaces (id, user_id) ON DELETE CASCADE
);
CREATE INDEX idx_contacts_workspace ON contacts (workspace_id, sort_key);

-- ---------------------------------------------------------------------
-- "Where was I?" — append-only context snapshots
-- ---------------------------------------------------------------------
-- History is kept (no updates); the newest row per workspace is what the
-- UI shows when you switch back in.
CREATE TABLE context_snapshots (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid        NOT NULL,
  user_id        uuid        NOT NULL,
  task_id        uuid,       -- optional: the task I was on
  current_state  text        NOT NULL CHECK (char_length(current_state) BETWEEN 1 AND 2000),
  next_step      text        CHECK (char_length(next_step) <= 1000),
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT snapshots_workspace_fk FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspaces (id, user_id) ON DELETE CASCADE,
  -- The referenced task must belong to the SAME workspace.
  -- If the task is deleted, only task_id is nulled (PG15+ column list).
  CONSTRAINT snapshots_task_fk FOREIGN KEY (task_id, workspace_id)
    REFERENCES tasks (id, workspace_id) ON DELETE SET NULL (task_id)
);
CREATE INDEX idx_snapshots_latest ON context_snapshots (workspace_id, created_at DESC);
CREATE INDEX idx_snapshots_task   ON context_snapshots (task_id) WHERE task_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated      BEFORE UPDATE ON tasks      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resources_updated  BEFORE UPDATE ON resources  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contacts_updated   BEFORE UPDATE ON contacts   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Row-Level Security: second line of defence for tenant isolation.
-- The API must connect as a NON-owner role (e.g. app_user); table owners
-- bypass RLS. users/sessions stay outside RLS because login runs before
-- a user context exists.
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['workspaces','tasks','resources','contacts','context_snapshots'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (user_id = app_current_user_id())
         WITH CHECK (user_id = app_current_user_id())', t);
  END LOOP;
END $$;
```

### 5.5 Query chính theo tính năng (`db/queries.sql`)

```sql
-- =====================================================================
-- Key queries per MVP feature. $n = bind parameters.
-- Every request runs inside a transaction that first executes:
--   SET LOCAL app.current_user_id = $current_user_id;
-- The explicit "user_id = $1" filters stay anyway: they make the intent
-- obvious and let the planner pick the composite indexes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fast Workspace Switcher
-- ---------------------------------------------------------------------
-- 1a. Sidebar (manual order)
SELECT id, name, slug, color, last_opened_at
FROM workspaces
WHERE user_id = $1 AND archived_at IS NULL
ORDER BY sort_key;

-- 1b. Cmd+K default list (most recently used first)
SELECT id, name, slug, color
FROM workspaces
WHERE user_id = $1 AND archived_at IS NULL
ORDER BY last_opened_at DESC NULLS LAST, name;

-- 1c. Record a switch (fire-and-forget from the client)
UPDATE workspaces SET last_opened_at = now()
WHERE id = $2 AND user_id = $1;

-- 1d. Cmd+K search across workspaces (uses the trigram index)
SELECT t.id, t.title, w.slug AS workspace_slug, w.name AS workspace_name, w.color
FROM tasks t
JOIN workspaces w ON w.id = t.workspace_id AND w.archived_at IS NULL
WHERE t.user_id = $1 AND t.title ILIKE '%' || $2 || '%'
ORDER BY (t.status = 'done'), t.due_at NULLS LAST
LIMIT 20;

-- ---------------------------------------------------------------------
-- 2. Client Resource Hub — everything for one workspace
-- ---------------------------------------------------------------------
SELECT id, kind, title, url, provider, body, is_pinned
FROM resources
WHERE workspace_id = $2 AND user_id = $1
ORDER BY is_pinned DESC, sort_key;

SELECT id, full_name, role, email, phone, messaging_handle
FROM contacts
WHERE workspace_id = $2 AND user_id = $1
ORDER BY sort_key;

-- ---------------------------------------------------------------------
-- 3. Unified Master Calendar
-- ---------------------------------------------------------------------
-- 3a. All deadlines in a range, across every workspace, with client colour.
--     $2/$3 = range boundaries computed in the user's timezone by the app.
SELECT t.id, t.title, t.status, t.priority, t.due_at, t.is_all_day,
       w.id AS workspace_id, w.name AS workspace_name, w.color
FROM tasks t
JOIN workspaces w ON w.id = t.workspace_id
WHERE t.user_id = $1
  AND t.due_at >= $2 AND t.due_at < $3
  AND w.archived_at IS NULL
ORDER BY t.due_at;

-- 3b. Per-day load in the user's LOCAL day, for conflict detection.
--     The DB only aggregates; the rule "what counts as a conflict"
--     (e.g. >= 2 clients or >= 4 open tasks on one day) lives in the
--     domain layer (DeadlineConflictPolicy), so it is unit-testable.
SELECT (t.due_at AT TIME ZONE u.timezone)::date            AS local_day,
       count(*)                                            AS open_tasks,
       count(DISTINCT t.workspace_id)                      AS workspace_count,
       count(*) FILTER (WHERE t.priority = 1)              AS high_priority,
       array_agg(DISTINCT w.name ORDER BY w.name)          AS workspace_names
FROM tasks t
JOIN users u      ON u.id = t.user_id
JOIN workspaces w ON w.id = t.workspace_id AND w.archived_at IS NULL
WHERE t.user_id = $1
  AND t.status <> 'done'
  AND t.due_at >= $2 AND t.due_at < $3
GROUP BY local_day
ORDER BY local_day;

-- ---------------------------------------------------------------------
-- 4. "Where was I?"
-- ---------------------------------------------------------------------
-- 4a. Save a snapshot before switching away
INSERT INTO context_snapshots (id, workspace_id, user_id, task_id, current_state, next_step)
VALUES ($2, $3, $1, $4, $5, $6);

-- 4b. Latest snapshot when switching back in
SELECT s.current_state, s.next_step, s.created_at,
       t.id AS task_id, t.title AS task_title, t.status AS task_status
FROM context_snapshots s
LEFT JOIN tasks t ON t.id = s.task_id
WHERE s.workspace_id = $2 AND s.user_id = $1
ORDER BY s.created_at DESC
LIMIT 1;

-- 4c. Latest snapshot of EVERY workspace in one query (sidebar hints)
SELECT DISTINCT ON (s.workspace_id)
       s.workspace_id, s.current_state, s.next_step, s.created_at
FROM context_snapshots s
WHERE s.user_id = $1
ORDER BY s.workspace_id, s.created_at DESC;
```

---

## 6. REST API [Đề xuất]

Quy ước chung:
- JSON; request và response được validate bằng Zod từ `@hopback/contracts`.
- Lỗi trả theo định dạng `application/problem+json` (RFC 9457).
- Lệnh tạo nhận `id` do client sinh (UUIDv7), nhờ đó optimistic UI và retry an toàn (idempotent). Trùng `id` thì trả về bản ghi đã có.
- Mọi endpoint trừ auth và health đều yêu cầu session (cookie hoặc Bearer).

| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập, tạo session |
| POST | `/auth/logout` | Xóa session |
| GET | `/auth/me` | User hiện tại (kèm `timezone`) |
| GET | `/workspaces` | Danh sách workspace (sidebar) |
| POST | `/workspaces` | Tạo workspace |
| PATCH | `/workspaces/:id` | Sửa tên, màu, `sort_key` |
| POST | `/workspaces/:id/archive` | Lưu trữ workspace |
| POST | `/workspaces/:id/open` | Cập nhật `last_opened_at` (gọi kiểu fire-and-forget) |
| GET | `/workspaces/:id/tasks?status=` | Task của workspace |
| POST | `/workspaces/:id/tasks` | Tạo task |
| PATCH | `/tasks/:id` | Sửa task, đổi trạng thái |
| DELETE | `/tasks/:id` | Xóa task |
| GET, POST | `/workspaces/:id/resources` | Danh sách, tạo resource |
| PATCH, DELETE | `/resources/:id` | Sửa (kể cả ghim, sắp xếp), xóa |
| GET, POST | `/workspaces/:id/contacts` | Danh sách, tạo contact |
| PATCH, DELETE | `/contacts/:id` | Sửa, xóa |
| GET | `/workspaces/:id/snapshots/latest` | Snapshot mới nhất |
| POST | `/workspaces/:id/snapshots` | Lưu snapshot |
| GET | `/snapshots/latest` | Snapshot mới nhất của mọi workspace |
| GET | `/calendar?from=&to=` | Deadline xuyên workspace |
| GET | `/calendar/day-load?from=&to=` | Tải theo ngày, kèm cờ xung đột do domain tính |
| GET | `/search?q=` | Tìm workspace và task cho Cmd+K |
| GET | `/healthz` | Health check |

---

## 7. Frontend: route và màn hình [Đề xuất]

| Route | Nội dung |
|---|---|
| `/login`, `/register` | Auth |
| `/w/:slug` | Tổng quan workspace: thẻ "Where was I?", resource đã ghim, task đang mở |
| `/w/:slug/tasks` | Danh sách task |
| `/w/:slug/hub` | Resource Hub đầy đủ: links, notes, contacts |
| `/calendar` | Unified Master Calendar (tháng, tuần), làm nổi bật ngày xung đột |

Command Palette (`Cmd/Ctrl + K`) dùng được ở mọi màn hình. Sidebar hiển thị danh sách workspace (chấm màu, gợi ý snapshot) và luôn hiện.

---

## 8. Bảo mật [Đã chốt]

- Không lưu credentials hay secret của client trong MVP.
- Mật khẩu hash bằng argon2id. DB chỉ lưu hash của session token.
- Cookie `httpOnly`, `Secure`, `SameSite=Lax`.
- RLS là lớp phòng thủ thứ hai; API dùng role không phải owner. Migration chạy bằng role owner riêng.
- Validate mọi input bằng Zod. URL resource chỉ chấp nhận `http`/`https` (CHECK trong DB).
- Mở link ngoài bằng `rel="noopener noreferrer"`.

---

## 9. Chiến lược test [Đã chốt]

- **Unit (Vitest):** domain logic, đặc biệt `DeadlineConflictPolicy` và logic resume.
- **Integration (Vitest + Testcontainers):** repository chạy trên Postgres thật, không mock DB. Gồm cả các test ràng buộc ở mục 5.3 và test RLS.
- **E2E (Playwright):** 2–3 luồng quan trọng: đăng nhập; switch workspace bằng Cmd+K; lưu và xem lại "Where was I?".

---

## 10. DevOps

### 10.1 Biến môi trường [Đề xuất]

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối bằng `app_user` (không phải owner) |
| `DATABASE_MIGRATION_URL` | Kết nối bằng role owner, chỉ dùng để chạy migration |
| `WEB_ORIGIN` | Origin của web, cho CORS |
| `COOKIE_DOMAIN` | Domain của cookie session |
| `SESSION_TTL_DAYS` | Thời hạn session |
| `SENTRY_DSN` | Báo lỗi |
| `NODE_ENV`, `PORT`, `LOG_LEVEL` | Cấu hình chung |

### 10.2 CI/CD [Đã chốt]

- `ci.yml` chạy trên mọi PR: lint → typecheck → unit test → integration test (Testcontainers) → build. Turborepo chỉ chạy cho phần bị ảnh hưởng.
- `deploy.yml` chạy khi merge vào `main`: build Docker image (`turbo prune --docker`) → push lên GHCR → SSH vào VPS → `docker compose pull && up -d` → chạy migration.
- Thêm E2E Playwright chạy trên môi trường đã build.

### 10.3 Deploy [Đã chốt]

- VPS chạy Docker Compose: `api`, `web` (file tĩnh), `postgres`, `caddy` (reverse proxy, HTTPS tự động).
- Link demo phải luôn sống (tránh free tier tự "ngủ"). Có tài khoản demo với dữ liệu mẫu (seed), và nút "dùng thử bằng tài khoản demo" ở trang đăng nhập.
- **[Mở]** Chọn nhà cung cấp VPS và tên miền.

---

## 11. Kế hoạch build [Đề xuất]

| Mốc | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| M0 | Khởi tạo monorepo, các package rỗng, ESLint boundaries, CI lint + typecheck, Postgres qua docker compose | CI xanh trên một repo rỗng |
| M1 | Migration từ `schema.sql`, Drizzle `schema.ts`, `withUserTx`, auth (register, login, logout, me) | Integration test cho ràng buộc, RLS và auth |
| M2 | CRUD workspace, Sidebar, Cmd+K, prefetch, ghi nhớ route theo workspace | Switch không loading khi đã có cache |
| M3 | CRUD task, Unified Calendar, day-load + `DeadlineConflictPolicy` | Unit test policy; calendar tô màu theo client |
| M4 | Resource Hub: links, notes, contacts, ghim và sắp xếp | Optimistic pin/reorder có rollback |
| M5 | "Where was I?": lưu khi switch, hiển thị khi quay lại, gợi ý trên sidebar | E2E luồng resume |
| M6 | Hoàn thiện: E2E, Sentry, Pino, Docker, deploy, seed demo, README, ADR | Link demo live |

---

## 12. Ngoài phạm vi MVP / roadmap

- Tìm kiếm bỏ dấu tiếng Việt: hiện gõ "bao cao" sẽ không ra "báo cáo". Cách sửa là dùng `unaccent` bọc trong một hàm `IMMUTABLE` để đánh index. **Nên làm ngay sau MVP.**
- Mã hóa credentials (AES-256-GCM, envelope encryption).
- Desktop app (xem mục 3.4).
- Chia sẻ workspace với người khác (bảng `workspace_members`).
- Nhiều project con trong một client; task lặp lại; soft delete cho task.
- Google OAuth.
- Redis, chỉ khi đo được nhu cầu thật.

---

## 13. Các quyết định còn mở

1. Nhắm vào nhóm công ty nào: giữ TypeScript/NestJS hay chuyển backend sang Spring Boot.
2. Tauri hay Electron cho desktop.
3. Nhà cung cấp VPS và tên miền demo.
4. Kiểm tra tên còn trống: tổ chức hoặc repo trên GitHub, scope `@hopback` trên npm, tên miền.
5. Logo: chọn bản chính thức cho favicon và system tray (`mono` hoặc `ink`) sau khi xem bảng kích thước.

---

## 14. Gợi ý viết lên CV

- *Designed a multi-tenant PostgreSQL schema with composite foreign keys, partial indexes and Row-Level Security, powering a cross-workspace unified timeline in a single indexed query.*
- *Built a workspace-scoped caching layer with TanStack Query (prefetch-on-hover, optimistic updates with client-generated UUIDv7) enabling instant, reload-free context switching.*
- *Structured a NestJS backend following Clean Architecture where domain logic warranted it (timezone-aware deadline conflict detection), keeping CRUD modules deliberately thin.*
- *Structured a Turborepo monorepo with enforced dependency boundaries, sharing typed Zod contracts and feature modules across API, web and future desktop targets.*
- *Automated CI/CD via GitHub Actions (typecheck, Testcontainers integration tests, Playwright E2E) and deployed containerized services behind Caddy with automatic HTTPS.*
