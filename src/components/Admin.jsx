import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_BASE_URL = "http://localhost:5000";

const SECTIONS = [
  ["dashboard", "▦", "Dashboard"],
  ["users", "♙", "Users"],
  ["documents", "▤", "Documents"],
  ["usage", "✦", "AI Usage"],
  ["reports", "▥", "Reports"],
  ["settings", "⚙", "Settings"],
  ["security", "◈", "Security"],
  ["help", "?", "Help"],
];

/* =========================================================
   HELPERS
   ========================================================= */

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${
    units[index]
  }`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatShortDate(date) {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

async function adminFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    headers: {
      Authorization: `Bearer ${
        localStorage.getItem("token") || ""
      }`,

      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),

      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "The admin request failed."
    );
  }

  return data;
}


/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
  hint,
  target,
  onNavigate,
  tone = "plum",
}) {
  return (
    <button
      type="button"
      className={`admin-stat-card ${tone}`}
      onClick={() => onNavigate(target)}
    >
      <div className="admin-stat-top">
        <span className="admin-stat-label">
          {label}
        </span>

        <span className="admin-stat-icon">
          {icon}
        </span>
      </div>

      <strong>{value}</strong>

      <small>{hint}</small>
    </button>
  );
}


/* =========================================================
   USER ACTIVITY LINE GRAPH
   Uses real reports.users data
   ========================================================= */

function UserActivityChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  if (!safeData.length) {
    return (
      <div className="admin-empty-chart">
        <span>⌁</span>
        <p>No user activity data available.</p>
      </div>
    );
  }

  const chartData = safeData.map((item) => ({
    date: item._id,
    count: Number(item.count || 0),
  }));

  const values = chartData.map((item) => item.count);

  const maxValue = Math.max(...values, 1);

  const width = 720;
  const height = 250;

  const paddingLeft = 38;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const points = chartData.map((item, index) => {
    const x =
      paddingLeft +
      (index / Math.max(chartData.length - 1, 1)) *
        chartWidth;

    const y =
      paddingTop +
      chartHeight -
      (item.count / maxValue) * chartHeight;

    return {
      x,
      y,
      count: item.count,
      date: item.date,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints = [
    `${paddingLeft},${paddingTop + chartHeight}`,
    ...points.map(
      (point) => `${point.x},${point.y}`
    ),
    `${
      paddingLeft + chartWidth
    },${paddingTop + chartHeight}`,
  ].join(" ");

  const labelIndexes = [
    0,
    Math.floor((chartData.length - 1) * 0.25),
    Math.floor((chartData.length - 1) * 0.5),
    Math.floor((chartData.length - 1) * 0.75),
    chartData.length - 1,
  ];

  const uniqueLabelIndexes = [
    ...new Set(labelIndexes),
  ];

  return (
    <div className="admin-line-chart">

      <div className="admin-chart-y-labels">
        <span>{maxValue}</span>
        <span>
          {Math.round(maxValue * 0.5)}
        </span>
        <span>0</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="admin-chart-svg"
      >

        {/* Horizontal grid lines */}

        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft + chartWidth}
          y2={paddingTop}
          className="chart-grid"
        />

        <line
          x1={paddingLeft}
          y1={
            paddingTop +
            chartHeight / 2
          }
          x2={paddingLeft + chartWidth}
          y2={
            paddingTop +
            chartHeight / 2
          }
          className="chart-grid"
        />

        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight}
          className="chart-grid"
        />

        {/* Filled area */}

        <polygon
          points={areaPoints}
          className="chart-area"
        />

        {/* Main line */}

        <polyline
          points={linePoints}
          fill="none"
          className="chart-line"
        />

        {/* Data points */}

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="chart-point"
          >
            <title>
              {formatShortDate(point.date)}:{" "}
              {point.count}
            </title>
          </circle>
        ))}

      </svg>

      <div className="chart-labels">

        {uniqueLabelIndexes.map((index) => (
          <span key={index}>
            {formatShortDate(
              chartData[index]?.date
            )}
          </span>
        ))}

      </div>

    </div>
  );
}


/* =========================================================
   AI FEATURE DONUT
   Uses real usage.operations data
   ========================================================= */

function AIFeatureChart({ usage }) {
  const operations = Array.isArray(
    usage?.operations
  )
    ? usage.operations
    : [];

  const featureTotals = {
    Summarization: 0,
    "Document Q&A": 0,
    Translation: 0,
    Explanation: 0,
    "Study Mode": 0,
  };

  let other = 0;

  operations.forEach((item) => {
    const endpoint = String(
      item?._id || ""
    ).toLowerCase();

    const count = Number(item?.count || 0);

    if (
      endpoint.includes("summar") ||
      endpoint.includes("summary")
    ) {
      featureTotals.Summarization += count;
    } else if (
      endpoint.includes("question") ||
      endpoint.includes("qa") ||
      endpoint.includes("ask")
    ) {
      featureTotals["Document Q&A"] += count;
    } else if (
      endpoint.includes("translat")
    ) {
      featureTotals.Translation += count;
    } else if (
      endpoint.includes("explain")
    ) {
      featureTotals.Explanation += count;
    } else if (
      endpoint.includes("study")
    ) {
      featureTotals["Study Mode"] += count;
    } else {
      other += count;
    }
  });

  const features = [
    {
      label: "Summarization",
      value: featureTotals.Summarization,
    },
    {
      label: "Document Q&A",
      value: featureTotals["Document Q&A"],
    },
    {
      label: "Translation",
      value: featureTotals.Translation,
    },
    {
      label: "Explanation",
      value: featureTotals.Explanation,
    },
    {
      label: "Study Mode",
      value: featureTotals["Study Mode"],
    },
  ];

  if (other > 0) {
    features.push({
      label: "Other",
      value: other,
    });
  }

  const total = features.reduce(
    (sum, item) => sum + item.value,
    0
  );

  if (!total) {
    return (
      <div className="admin-empty-chart">
        <span>✦</span>
        <p>No AI usage data available.</p>
      </div>
    );
  }

  const radius = 70;

  const circumference =
    2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="ai-feature-chart">

      <div className="donut-wrapper">

        <svg
          viewBox="0 0 180 180"
          className="donut-svg"
        >

          <circle
            cx="90"
            cy="90"
            r={radius}
            className="donut-background"
          />

          {features.map((feature, index) => {
            const percentage =
              feature.value / total;

            const dash =
              percentage * circumference;

            const segment = (
              <circle
                key={feature.label}
                cx="90"
                cy="90"
                r={radius}
                className={`donut-segment donut-${index}`}
                strokeDasharray={`${dash} ${
                  circumference - dash
                }`}
                strokeDashoffset={
                  -currentOffset
                }
              />
            );

            currentOffset += dash;

            return segment;
          })}

        </svg>

        <div className="donut-center">
          <strong>
            {total.toLocaleString()}
          </strong>

          <span>Total Requests</span>
        </div>

      </div>


      <div className="donut-legend">

        {features.map((feature, index) => {
          const percentage = Math.round(
            (feature.value / total) * 100
          );

          return (
            <div
              className="donut-legend-item"
              key={feature.label}
            >

              <span
                className={`legend-dot legend-${index}`}
              />

              <span className="legend-name">
                {feature.label}
              </span>

              <strong>
                {percentage}%
              </strong>

            </div>
          );
        })}

      </div>

    </div>
  );
}


/* =========================================================
   ADMIN COMPONENT
   ========================================================= */

function Admin() {
  const [section, setSection] =
    useState("dashboard");

  const [overview, setOverview] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [documents, setDocuments] =
    useState([]);

  const [usage, setUsage] = useState({
    total: 0,
    operations: [],
    daily: [],
  });

  const [reports, setReports] = useState({
    users: [],
    documents: [],
    aiUsage: [],
  });

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const isAdmin =
    localStorage.getItem("userRole") ===
    "admin";

  const userName =
    localStorage.getItem("userName") ||
    "Administrator";

  const activeTitle =
    SECTIONS.find(
      ([id]) => id === section
    )?.[2] || "Dashboard";


  /* =====================================================
     LOAD ADMIN DATA
     ===================================================== */

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summary,
        userData,
        documentData,
        usageData,
        reportData,
      ] = await Promise.all([
        adminFetch("/api/admin/overview"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/documents"),
        adminFetch("/api/admin/ai-usage"),
        adminFetch("/api/admin/reports"),
      ]);

      setOverview(summary);

      setUsers(
        userData.users || []
      );

      setDocuments(
        documentData.documents || []
      );

      setUsage({
        total: usageData.total || 0,
        operations:
          usageData.operations || [],
        daily: usageData.daily || [],
      });

      setReports({
        users: reportData.users || [],
        documents:
          reportData.documents || [],
        aiUsage:
          reportData.aiUsage || [],
      });

    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAdminData();
  }, []);


  /* =====================================================
     SEARCH
     ===================================================== */

  const visibleUsers = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) =>
      `${user.name} ${user.email}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [users, query]);


  const visibleDocuments = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return documents;
    }

    return documents.filter((doc) =>
      `${doc.name} ${
        doc.owner?.name || ""
      } ${
        doc.owner?.email || ""
      } ${doc.fileType}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [documents, query]);


  /* =====================================================
     LOGOUT
     ===================================================== */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    window.location.hash = "login";
  };


  /* =====================================================
     UPDATE USER STATUS
     ===================================================== */

  const updateUserStatus = async (user) => {
    const nextStatus =
      !user.isActive;

    if (
      !nextStatus &&
      !window.confirm(
        `Deactivate ${user.name}'s account? They will no longer be able to sign in.`
      )
    ) {
      return;
    }

    setMessage("");

    try {
      await adminFetch(
        `/api/admin/users/${user.id}/status`,
        {
          method: "PATCH",

          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: nextStatus,
              }
            : item
        )
      );

      setMessage(
        `${user.name}'s account is ${
          nextStatus
            ? "active"
            : "deactivated"
        }.`
      );

    } catch (actionError) {
      setError(actionError.message);
    }
  };


  /* =====================================================
     DELETE USER
     ===================================================== */

  const deleteUser = async (user) => {
    if (
      !window.confirm(
        `Permanently delete ${user.name} and all ${user.documentCount} document(s) owned by this account? This cannot be undone.`
      )
    ) {
      return;
    }

    setMessage("");

    try {
      await adminFetch(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        `${user.name} and their documents were deleted.`
      );

      await loadAdminData();

    } catch (actionError) {
      setError(actionError.message);
    }
  };


  /* =====================================================
     DELETE DOCUMENT
     ===================================================== */

  const deleteDocument = async (doc) => {
    if (
      !window.confirm(
        `Permanently delete “${doc.name}”? This cannot be undone.`
      )
    ) {
      return;
    }

    setMessage("");

    try {
      await adminFetch(
        `/api/admin/documents/${doc.id}`,
        {
          method: "DELETE",
        }
      );

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== doc.id
        )
      );

      setMessage(
        "Document deleted."
      );

      await loadAdminData();

    } catch (actionError) {
      setError(actionError.message);
    }
  };


  /* =====================================================
     ACCESS CHECK
     ===================================================== */

  if (!isAdmin) {
    return (
      <main className="admin-access-denied">
        <div className="admin-access-card">

          <span>🛡️</span>

          <h1>
            Admin access required
          </h1>

          <p>
            Sign in with an administrator
            account to continue.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.hash =
                "login";
            }}
          >
            Go to sign in
          </button>

        </div>
      </main>
    );
  }


  /* =====================================================
     MAIN ADMIN UI
     ===================================================== */

  return (
    <div className="admin-shell">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <a
          href="#admin"
          className="admin-brand"
        >
          <span>✦</span>

          DocIQ

          <small>
            ADMIN
          </small>
        </a>


        <p className="admin-nav-label">
          WORKSPACE
        </p>


        <nav aria-label="Admin navigation">

          {SECTIONS.map(
            ([id, icon, label]) => (
              <button
                key={id}
                type="button"
                className={
                  section === id
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setSection(id);
                  setQuery("");
                  setMessage("");
                  setError("");
                }}
              >
                <span
                  aria-hidden="true"
                >
                  {icon}
                </span>

                {label}
              </button>
            )
          )}

        </nav>


        <div className="admin-sidebar-bottom">

          <div className="admin-profile">

            <span>
              {userName
                .slice(0, 1)
                .toUpperCase()}
            </span>

            <div>

              <strong>
                {userName}
              </strong>

              <small>
                Administrator
              </small>

            </div>

          </div>


          <button
            type="button"
            className="admin-logout"
            onClick={logout}
          >
            <span>↪</span>

            Log out
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <main className="admin-main">

        <header className="admin-topbar">

          <div>

            <span>
              ADMINISTRATION
            </span>

            <h1>
              {activeTitle}
            </h1>

          </div>


          <button
            type="button"
            className="admin-refresh"
            onClick={loadAdminData}
            disabled={loading}
          >
            ↻

            <span>
              {loading
                ? "Refreshing"
                : "Refresh"}
            </span>

          </button>

        </header>


        {/* ERROR */}

        {error && (
          <div
            className="admin-alert error"
            role="alert"
          >

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              Dismiss
            </button>

          </div>
        )}


        {/* SUCCESS */}

        {message && (
          <div
            className="admin-alert success"
            role="status"
          >

            <span>
              {message}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
            >
              Dismiss
            </button>

          </div>
        )}


        {/* LOADING */}

        {loading && !overview ? (
          <div className="admin-panel admin-loading">
            Loading admin data…
          </div>
        ) : (
          <>

            {section === "dashboard" && (
              <DashboardSection
                overview={overview}
                users={users}
                documents={documents}
                usage={usage}
                reports={reports}
                onNavigate={setSection}
              />
            )}


            {section === "users" && (
              <UsersSection
                users={visibleUsers}
                query={query}
                setQuery={setQuery}
                onToggle={updateUserStatus}
                onDelete={deleteUser}
              />
            )}


            {section === "documents" && (
              <DocumentsSection
                documents={visibleDocuments}
                query={query}
                setQuery={setQuery}
                onDelete={deleteDocument}
              />
            )}


            {section === "usage" && (
              <UsageSection
                usage={usage}
              />
            )}


            {section === "reports" && (
              <ReportsSection
                reports={reports}
              />
            )}


            {section === "settings" && (
              <SettingsSection />
            )}


            {section === "security" && (
              <SecuritySection />
            )}


            {section === "help" && (
              <HelpSection />
            )}

          </>
        )}

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function DashboardSection({
  overview,
  users,
  documents,
  usage,
  reports,
  onNavigate,
}) {

  const totalUsers =
    overview?.totalUsers || 0;

  const totalDocuments =
    overview?.totalDocuments || 0;

  const totalAI =
    overview?.aiUsage ||
    usage?.total ||
    0;

  const activeUsers =
    users.filter(
      (user) => user.isActive
    ).length;

  const storage =
    formatBytes(
      overview?.storageBytes || 0
    );


  return (
    <div className="admin-dashboard">

      {/* WELCOME */}

      <div className="admin-welcome">

        <div>

          <span>
            OVERVIEW
          </span>

          <h2>
            Welcome back, Administrator
          </h2>

          <p>
            Monitor DocIQ accounts,
            documents, and AI activity.
          </p>

        </div>

        <span className="admin-welcome-mark">
          ✦
        </span>

      </div>


      {/* STATISTICS */}

      <div className="admin-stat-grid">

        <StatCard
          icon="👥"
          label="Total Users"
          value={totalUsers.toLocaleString()}
          hint="Registered accounts"
          target="users"
          onNavigate={onNavigate}
          tone="plum"
        />

        <StatCard
          icon="📄"
          label="Total Documents"
          value={totalDocuments.toLocaleString()}
          hint="Uploaded documents"
          target="documents"
          onNavigate={onNavigate}
          tone="coral"
        />

        <StatCard
          icon="✦"
          label="AI Requests"
          value={totalAI.toLocaleString()}
          hint="Successful AI operations"
          target="usage"
          onNavigate={onNavigate}
          tone="lavender"
        />

        <StatCard
          icon="◉"
          label="Active Users"
          value={activeUsers.toLocaleString()}
          hint={
            totalUsers
              ? `${Math.round(
                  (activeUsers /
                    totalUsers) *
                    100
                )}% of total users`
              : "No users yet"
          }
          target="users"
          onNavigate={onNavigate}
          tone="mint"
        />

      </div>


      {/* GRAPH AREA */}

      <div className="admin-dashboard-chart-grid">

        {/* USER ACTIVITY */}

        <section className="admin-panel dashboard-chart-panel">

          <div className="admin-panel-heading">

            <div>

              <h2>
                User Activity
              </h2>

              <p>
                New user registrations
                during the last 30 days.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate("reports")
              }
            >
              View report →
            </button>

          </div>


          <UserActivityChart
            data={reports?.users || []}
          />

        </section>


        {/* AI FEATURE USAGE */}

        <section className="admin-panel dashboard-chart-panel">

          <div className="admin-panel-heading">

            <div>

              <h2>
                AI Feature Usage
              </h2>

              <p>
                Distribution of successful
                AI requests.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate("usage")
              }
            >
              Details →
            </button>

          </div>


          <AIFeatureChart
            usage={usage}
          />

        </section>

      </div>


      {/* RECENT ACTIVITY */}

      <div className="admin-dashboard-grid">

        {/* USERS */}

        <section className="admin-panel">

          <div className="admin-panel-heading">

            <div>

              <h2>
                Recent users
              </h2>

              <p>
                Latest registrations
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate("users")
              }
            >
              View users →
            </button>

          </div>


          {users
            .slice(0, 5)
            .map((user) => (
              <div
                className="admin-list-row"
                key={user.id}
              >

                <span className="admin-avatar">
                  {(user.name || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>

                <div>

                  <strong>
                    {user.name}
                  </strong>

                  <small>
                    {user.email}
                  </small>

                </div>

                <span
                  className={`admin-status ${
                    user.isActive
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {user.isActive
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>
            ))}


          {!users.length && (
            <p className="admin-empty">
              No users registered.
            </p>
          )}

        </section>


        {/* DOCUMENTS */}

        <section className="admin-panel">

          <div className="admin-panel-heading">

            <div>

              <h2>
                Recent documents
              </h2>

              <p>
                Latest uploads
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate("documents")
              }
            >
              View documents →
            </button>

          </div>


          {documents
            .slice(0, 5)
            .map((doc) => (
              <div
                className="admin-list-row"
                key={doc.id}
              >

                <span className="admin-doc-icon">
                  ▤
                </span>

                <div>

                  <strong>
                    {doc.name}
                  </strong>

                  <small>
                    {doc.owner?.name ||
                      "Legacy document"}{" "}
                    ·{" "}
                    {formatDate(
                      doc.uploadedAt
                    )}
                  </small>

                </div>

                <span
                  className={`admin-status ${
                    doc.status === "ready"
                      ? "active"
                      : "pending"
                  }`}
                >
                  {doc.status}
                </span>

              </div>
            ))}


          {!documents.length && (
            <p className="admin-empty">
              No documents uploaded.
            </p>
          )}

        </section>

      </div>


      {/* QUICK SUMMARY */}

      <div className="admin-bottom-summary">

        <div className="admin-mini-card">

          <div className="mini-card-icon">
            ▤
          </div>

          <div>

            <span>
              Storage Used
            </span>

            <strong>
              {storage}
            </strong>

          </div>

        </div>


        <div className="admin-mini-card">

          <div className="mini-card-icon">
            ✦
          </div>

          <div>

            <span>
              AI Requests
            </span>

            <strong>
              {totalAI.toLocaleString()}
            </strong>

          </div>

        </div>


        <div className="admin-mini-card">

          <div className="mini-card-icon">
            ◈
          </div>

          <div>

            <span>
              System Status
            </span>

            <strong className="status-online">
              Online
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SEARCH
   ========================================================= */

function SearchBox({
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="admin-search">

      <span>
        ⌕
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        aria-label={placeholder}
      />

    </label>
  );
}


/* =========================================================
   USERS
   ========================================================= */

function UsersSection({
  users,
  query,
  setQuery,
  onToggle,
  onDelete,
}) {
  return (
    <section className="admin-panel admin-table-panel">

      <div className="admin-panel-heading">

        <div>

          <h2>
            User management
          </h2>

          <p>
            Review account status and usage.
          </p>

        </div>

        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search by name or email"
        />

      </div>


      <div className="admin-table-scroll">

        <table>

          <thead>

            <tr>
              <th>User</th>
              <th>Registered</th>
              <th>Documents</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {users.map((user) => (
              <tr key={user.id}>

                <td>

                  <strong>
                    {user.name}
                  </strong>

                  <small>
                    {user.email}
                  </small>

                </td>

                <td>
                  {formatDate(
                    user.createdAt
                  )}
                </td>

                <td>
                  {user.documentCount}
                </td>

                <td>

                  <span
                    className={`admin-role ${user.role}`}
                  >
                    {user.role}
                  </span>

                </td>

                <td>

                  <span
                    className={`admin-status ${
                      user.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {user.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                </td>

                <td>

                  <div className="admin-row-actions">

                    <button
                      type="button"
                      onClick={() =>
                        onToggle(user)
                      }
                      disabled={
                        user.role ===
                        "admin"
                      }
                    >
                      {user.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        onDelete(user)
                      }
                      disabled={
                        user.role ===
                        "admin"
                      }
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>
            ))}


            {!users.length && (
              <tr>

                <td
                  colSpan="6"
                  className="admin-empty"
                >
                  No matching users.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}


/* =========================================================
   DOCUMENTS
   ========================================================= */

function DocumentsSection({
  documents,
  query,
  setQuery,
  onDelete,
}) {
  return (
    <section className="admin-panel admin-table-panel">

      <div className="admin-panel-heading">

        <div>

          <h2>
            Document management
          </h2>

          <p>
            All uploaded documents and
            processing states.
          </p>

        </div>

        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search documents or owners"
        />

      </div>


      <div className="admin-table-scroll">

        <table>

          <thead>

            <tr>
              <th>Document</th>
              <th>Owner</th>
              <th>File type</th>
              <th>Uploaded</th>
              <th>File size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {documents.map((doc) => (
              <tr key={doc.id}>

                <td>
                  <strong>
                    {doc.name}
                  </strong>
                </td>

                <td>

                  {doc.owner ? (
                    <>
                      <strong>
                        {doc.owner.name}
                      </strong>

                      <small>
                        {doc.owner.email}
                      </small>
                    </>
                  ) : (
                    <span className="admin-muted">
                      Unassigned (legacy)
                    </span>
                  )}

                </td>

                <td>
                  {(doc.fileType ||
                    "FILE").toUpperCase()}
                </td>

                <td>
                  {formatDate(
                    doc.uploadedAt
                  )}
                </td>

                <td>
                  {formatBytes(
                    doc.fileSize
                  )}
                </td>

                <td>

                  <span
                    className={`admin-status ${
                      doc.status === "ready"
                        ? "active"
                        : doc.status ===
                          "failed"
                        ? "inactive"
                        : "pending"
                    }`}
                  >
                    {doc.status}
                  </span>

                </td>

                <td>

                  <button
                    type="button"
                    className="admin-table-action danger"
                    onClick={() =>
                      onDelete(doc)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}


            {!documents.length && (
              <tr>

                <td
                  colSpan="7"
                  className="admin-empty"
                >
                  No matching documents.
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}


/* =========================================================
   AI USAGE
   ========================================================= */

function UsageSection({ usage }) {

  const daily = Array.isArray(
    usage?.daily
  )
    ? usage.daily
    : [];

  const operations = Array.isArray(
    usage?.operations
  )
    ? usage.operations
    : [];

  const max = Math.max(
    1,
    ...daily.map(
      (item) =>
        Number(item.count || 0)
    )
  );


  return (
    <div className="admin-section-stack">

      <div className="admin-stat-grid admin-stat-grid-single">

        <div className="admin-stat-card">

          <span className="admin-stat-icon">
            ✦
          </span>

          <span className="admin-stat-label">
            Successful AI operations
          </span>

          <strong>
            {usage?.total || 0}
          </strong>

          <small>
            Tracked since this module
            was enabled
          </small>

        </div>

      </div>


      <section className="admin-panel">

        <div className="admin-panel-heading">

          <div>

            <h2>
              Operations by endpoint
            </h2>

            <p>
              Counts successful requests
              handled by DocIQ's AI services.
            </p>

          </div>

        </div>


        {operations.map((item) => (
          <div
            className="admin-usage-row"
            key={item._id}
          >

            <div>

              <strong>
                {String(item._id).replace(
                  /^\/api\//,
                  ""
                )}
              </strong>

              <small>
                Last used{" "}
                {formatDate(
                  item.lastUsedAt
                )}
              </small>

            </div>

            <span>
              {Number(
                item.count || 0
              ).toLocaleString()}
            </span>

          </div>
        ))}


        {!operations.length && (
          <p className="admin-empty">
            AI activity will appear after
            successful operations.
          </p>
        )}

      </section>


      <section className="admin-panel admin-chart-panel">

        <div className="admin-panel-heading">

          <div>

            <h2>
              Last 30 days
            </h2>

            <p>
              Daily successful AI activity.
            </p>

          </div>

        </div>


        <div className="admin-bars">

          {daily.map((item) => (

            <div
              className="admin-bar-item"
              key={item._id}
              title={`${formatDate(
                item._id
              )}: ${item.count}`}
            >

              <span
                style={{
                  height: `${Math.max(
                    4,
                    (Number(
                      item.count || 0
                    ) /
                      max) *
                      100
                  )}%`,
                }}
              />

              <small>
                {new Date(
                  `${item._id}T00:00:00`
                ).getDate()}
              </small>

            </div>

          ))}

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   REPORTS
   ========================================================= */

function ReportsSection({
  reports,
}) {

  const groups = [
    [
      "New users",
      reports?.users || [],
    ],
    [
      "Documents uploaded",
      reports?.documents || [],
    ],
    [
      "AI operations",
      reports?.aiUsage || [],
    ],
  ];


  return (
    <div className="admin-report-grid">

      {groups.map(
        ([title, values]) => {

          const total =
            values.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.count || 0
                ),
              0
            );

          const max = Math.max(
            1,
            ...values.map(
              (item) =>
                Number(
                  item.count || 0
                )
            )
          );


          return (
            <section
              className="admin-panel admin-report-card"
              key={title}
            >

              <div className="admin-panel-heading">

                <div>

                  <h2>
                    {title}
                  </h2>

                  <p>
                    Last 30 days ·{" "}
                    {total.toLocaleString()}{" "}
                    total
                  </p>

                </div>

              </div>


              {values.length ? (
                values.map((item) => (
                  <div
                    className="admin-report-row"
                    key={item._id}
                  >

                    <span>
                      {formatDate(
                        item._id
                      )}
                    </span>

                    <div>

                      <i
                        style={{
                          width: `${Math.max(
                            2,
                            (Number(
                              item.count ||
                                0
                            ) /
                              max) *
                              100
                          )}%`,
                        }}
                      />

                    </div>

                    <strong>
                      {Number(
                        item.count || 0
                      )}
                    </strong>

                  </div>
                ))
              ) : (
                <p className="admin-empty">
                  No activity in this period.
                </p>
              )}

            </section>
          );
        }
      )}

    </div>
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsSection() {
  return (
    <section className="admin-panel">

      <div className="admin-panel-heading">

        <div>

          <h2>
            Admin settings
          </h2>

          <p>
            Access is assigned by the
            server environment.
          </p>

        </div>

      </div>


      <div className="admin-info-grid">

        <div>

          <span>
            Admin account
          </span>

          <strong>
            {localStorage.getItem(
              "userName"
            ) || "Administrator"}
          </strong>

        </div>


        <div>

          <span>
            Admin email
          </span>

          <strong>
            {localStorage.getItem(
              "userEmail"
            ) || "Sign-in email"}
          </strong>

        </div>


        <div>

          <span>
            Role source
          </span>

          <strong>
            ADMIN_EMAIL server setting
          </strong>

        </div>


        <div>

          <span>
            Session lifetime
          </span>

          <strong>
            12 hours
          </strong>

        </div>

      </div>


      <p className="admin-note">
        To add or change an administrator,
        update ADMIN_EMAIL in the backend
        environment and restart the server.
      </p>

    </section>
  );
}


/* =========================================================
   SECURITY
   ========================================================= */

function SecuritySection() {
  return (
    <section className="admin-panel">

      <div className="admin-panel-heading">

        <div>

          <h2>
            Security controls
          </h2>

          <p>
            How administrator access is
            protected.
          </p>

        </div>

      </div>


      <div className="admin-security-list">

        <p>

          <span>
            ✓
          </span>

          <strong>
            Server-verified role
          </strong>

          <small>
            Admin endpoints check the
            signed session and role on
            every request.
          </small>

        </p>


        <p>

          <span>
            ✓
          </span>

          <strong>
            Expiring sessions
          </strong>

          <small>
            Sign-in tokens expire after
            12 hours.
          </small>

        </p>


        <p>

          <span>
            ✓
          </span>

          <strong>
            Protected admin accounts
          </strong>

          <small>
            Admin accounts cannot be
            deactivated or deleted from
            this panel.
          </small>

        </p>


        <p>

          <span>
            !
          </span>

          <strong>
            Production configuration
          </strong>

          <small>
            Set a long, private JWT_SECRET
            and ADMIN_EMAIL on the server
            before deployment.
          </small>

        </p>

      </div>

    </section>
  );
}


/* =========================================================
   HELP
   ========================================================= */

function HelpSection() {
  return (
    <section className="admin-panel">

      <div className="admin-panel-heading">

        <div>

          <h2>
            Admin help
          </h2>

          <p>
            Quick guidance for managing
            DocIQ.
          </p>

        </div>

      </div>


      <div className="admin-help-grid">

        <article>

          <span>
            01
          </span>

          <h3>
            Manage user access
          </h3>

          <p>
            Deactivate an account to block
            future sign-ins. Reactivate it
            to restore access.
          </p>

        </article>


        <article>

          <span>
            02
          </span>

          <h3>
            Review documents
          </h3>

          <p>
            Legacy documents without a
            linked account are labeled as
            unassigned.
          </p>

        </article>


        <article>

          <span>
            03
          </span>

          <h3>
            AI usage records
          </h3>

          <p>
            Usage counts include successful
            AI service requests recorded
            after this module was enabled.
          </p>

        </article>

      </div>

    </section>
  );
}


export default Admin;