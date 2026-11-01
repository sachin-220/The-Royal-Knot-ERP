"""
KnotCore Luxury Wedding Planning Management System
Production-Grade Authentication & Role-Based Access Control (RBAC) Engine
- Bcrypt 12-round salted password hashing
- Cryptographically signed JWT tokens (HS256) with short TTL & JTI revocation
- Secure refresh token rotation with family reuse anomaly detection
- Brute-force lockout protection (5 failed attempts = 15-minute lockout)
- Role-based permissions: Super Admin, Admin, Financial Manager
- Strict zero emojis across all code and responses
"""
import os
import sys
import uuid
import hashlib
import datetime
import secrets
from functools import wraps
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, g, make_response

# Path configuration
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(WORKSPACE_DIR, ".env")

# Secure JWT Secret Management
def get_or_create_jwt_secret():
    secret = os.environ.get("KNOTCORE_JWT_SECRET")
    if secret and len(secret) >= 32:
        return secret
    
    # Check if .env file has a saved secret
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("KNOTCORE_JWT_SECRET="):
                        val = line.strip().split("=", 1)[1].strip('"').strip("'")
                        if len(val) >= 32:
                            os.environ["KNOTCORE_JWT_SECRET"] = val
                            return val
        except Exception:
            pass
            
    # Generate a cryptographically secure 256-bit random secret
    new_secret = secrets.token_hex(32)
    os.environ["KNOTCORE_JWT_SECRET"] = new_secret
    try:
        with open(ENV_FILE, "a", encoding="utf-8") as f:
            f.write(f"\nKNOTCORE_JWT_SECRET={new_secret}\n")
    except Exception as e:
        print(f"Warning: Could not persist JWT secret to .env: {e}", file=sys.stderr)
    return new_secret

JWT_SECRET = get_or_create_jwt_secret()
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "knotcore-erp"
ACCESS_TOKEN_LIFETIME_MINUTES = 15
REFRESH_TOKEN_LIFETIME_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# Database connection helper
def get_db():
    return psycopg2.connect(
        dbname="knotcore_db",
        user="postgres",
        password="",
        host="127.0.0.1",
        port=5432
    )

# Role definitions & least-privilege permission matrix
ROLE_PERMISSIONS = {
    "super_admin": [
        "*"
    ],
    "admin": [
        "dashboard:read",
        "procurement:read",
        "procurement:write",
        "operations:read",
        "operations:write",
        "intelligence:read",
        "finance:read",
        "finance:write"
    ],
    "financial_manager": [
        "dashboard:read",
        "procurement:budget:read",
        "procurement:budget:write",
        "procurement:inquiry_quotations:read",
        "procurement:inquiry_quotations:write",
        "intelligence:bi:read",
        "finance:read",
        "finance:write"
    ]
}

# Module access list per role for frontend routing
ROLE_MODULE_ACCESS = {
    "super_admin": [
        "cockpit", "vendors", "budget", "inquiry_quotations", "vendor_coordination",
        "command_centre", "event_schedule", "wristband_tracker", "plansetter", "enquiries",
        "executive_bi", "finance_settlement", "user_management"
    ],
    "admin": [
        "cockpit", "vendors", "budget", "inquiry_quotations", "vendor_coordination",
        "command_centre", "event_schedule", "wristband_tracker", "plansetter", "enquiries",
        "executive_bi", "finance_settlement"
    ],
    "financial_manager": [
        "cockpit", "budget", "inquiry_quotations",
        "executive_bi", "finance_settlement"
    ]
}

# ----------------- SCHEMA INITIALIZATION & SEEDING -----------------
def init_auth_tables():
    """Initializes tables for users, refresh tokens, blacklisted JTIs, and security audit logs."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(150),
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'financial_manager')),
                is_active BOOLEAN DEFAULT TRUE,
                failed_login_attempts INT DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                last_login_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(64) NOT NULL UNIQUE,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                revoked BOOLEAN DEFAULT FALSE,
                replaced_by_token_hash VARCHAR(64),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS revoked_tokens (
                jti VARCHAR(64) PRIMARY KEY,
                revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS auth_audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                event_type VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        conn.commit()

        # Seed initial accounts if not present
        seed_users = [
            {
                "email": "superadmin@knotcore.internal",
                "username": "superadmin",
                "full_name": "KnotCore Super Administrator",
                "password": "KnotCore#SuperAdmin2026!",
                "role": "super_admin"
            },
            {
                "email": "admin@knotcore.internal",
                "username": "opsadmin",
                "full_name": "Operations Lead Admin",
                "password": "KnotCore#OpsAdmin2026!",
                "role": "admin"
            },
            {
                "email": "finance@knotcore.internal",
                "username": "finmanager",
                "full_name": "Financial Settlements Manager",
                "password": "KnotCore#FinManager2026!",
                "role": "financial_manager"
            }
        ]

        for su in seed_users:
            cur.execute("SELECT id FROM users WHERE email = %s OR username = %s;", (su["email"], su["username"]))
            existing = cur.fetchone()
            if not existing:
                pwd_hash = bcrypt.hashpw(su["password"].encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
                cur.execute("""
                    INSERT INTO users (email, username, full_name, password_hash, role, is_active)
                    VALUES (%s, %s, %s, %s, %s, TRUE);
                """, (su["email"], su["username"], su["full_name"], pwd_hash, su["role"]))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error initializing auth tables: {e}", file=sys.stderr)
        raise
    finally:
        cur.close()
        conn.close()

# ----------------- CRYPTOGRAPHIC HELPERS -----------------
def hash_password(password: str) -> str:
    """Hashes a password using salted bcrypt with 12 rounds."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False

def generate_access_token(user: dict) -> tuple[str, str, int]:
    """
    Generates a cryptographically signed JWT access token.
    Returns: (token_str, jti, exp_timestamp)
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    exp = now + datetime.timedelta(minutes=ACCESS_TOKEN_LIFETIME_MINUTES)
    jti = str(uuid.uuid4())
    
    payload = {
        "sub": str(user["id"]),
        "user_id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "full_name": user.get("full_name") or user["username"],
        "role": user["role"],
        "permissions": ROLE_PERMISSIONS.get(user["role"], []),
        "allowed_modules": ROLE_MODULE_ACCESS.get(user["role"], []),
        "iss": JWT_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": jti
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, jti, int(exp.timestamp())

def verify_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT access token.
    Verifies signature, expiration, issuer, and checks jti against revoked_tokens.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], issuer=JWT_ISSUER)
    except jwt.ExpiredSignatureError:
        raise ValueError("Authentication token has expired.")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid authentication token: {str(e)}")
        
    jti = payload.get("jti")
    if jti:
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute("SELECT jti FROM revoked_tokens WHERE jti = %s;", (jti,))
            if cur.fetchone():
                raise ValueError("Authentication token has been revoked.")
        finally:
            cur.close()
            conn.close()
            
    return payload

def create_refresh_token(user_id: int) -> str:
    """Generates a random 64-byte secure refresh token and stores its SHA-256 hash."""
    raw_token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS)
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s);
        """, (user_id, token_hash, expires_at))
        conn.commit()
    finally:
        cur.close()
        conn.close()
    return raw_token

def rotate_refresh_token(raw_token: str) -> tuple[str, dict]:
    """
    Rotates a refresh token.
    If a revoked refresh token is presented, detects anomaly and revokes all user sessions.
    Returns: (new_raw_token, user_dict)
    """
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.datetime.now(datetime.timezone.utc)
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT r.*, u.id as u_id, u.email, u.username, u.full_name, u.role, u.is_active
            FROM user_refresh_tokens r
            JOIN users u ON r.user_id = u.id
            WHERE r.token_hash = %s;
        """, (token_hash,))
        record = cur.fetchone()
        
        if not record:
            raise ValueError("Invalid refresh token.")
            
        if record["revoked"]:
            # Token reuse anomaly: immediately revoke all active refresh tokens for this user
            cur.execute("UPDATE user_refresh_tokens SET revoked = TRUE WHERE user_id = %s;", (record["user_id"],))
            conn.commit()
            log_security_event(record["user_id"], "refresh_token_reuse_detected", {"anomaly": "Attempted reuse of revoked token"})
            raise ValueError("Security violation: revoked refresh token reused. All active sessions invalidated.")
            
        if record["expires_at"] < now:
            raise ValueError("Refresh token has expired.")
            
        if not record["is_active"]:
            raise ValueError("User account is disabled.")
            
        # Issue new refresh token
        new_raw_token = secrets.token_urlsafe(64)
        new_hash = hashlib.sha256(new_raw_token.encode("utf-8")).hexdigest()
        new_expires = now + datetime.timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS)
        
        cur.execute("""
            UPDATE user_refresh_tokens
            SET revoked = TRUE, replaced_by_token_hash = %s
            WHERE token_hash = %s;
            
            INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s);
        """, (new_hash, token_hash, record["user_id"], new_hash, new_expires))
        conn.commit()
        
        user_dict = {
            "id": record["u_id"],
            "email": record["email"],
            "username": record["username"],
            "full_name": record["full_name"],
            "role": record["role"]
        }
        return new_raw_token, user_dict
    finally:
        cur.close()
        conn.close()

def revoke_token(jti: str, exp_timestamp: int):
    """Adds a JWT jti to the revoked_tokens blacklist."""
    if not jti:
        return
    exp_dt = datetime.datetime.fromtimestamp(exp_timestamp, tz=datetime.timezone.utc)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO revoked_tokens (jti, expires_at)
            VALUES (%s, %s)
            ON CONFLICT (jti) DO NOTHING;
        """, (jti, exp_dt))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def log_security_event(user_id: int | None, event_type: str, details: dict | None = None):
    """Records an audit log entry with client IP and user agent."""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr) if request else "127.0.0.1"
    ua = request.headers.get("User-Agent", "Unknown") if request else "System"
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent, details)
            VALUES (%s, %s, %s, %s, %s);
        """, (user_id, event_type, ip, ua, psycopg2.extras.Json(details or {})))
        conn.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}", file=sys.stderr)
    finally:
        cur.close()
        conn.close()

# ----------------- ROUTE DECORATORS -----------------
def require_auth(f):
    """Enforces valid JWT authentication via Authorization Bearer header or HttpOnly cookie."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # 1. Check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        # 2. Check Cookie fallback
        if not token:
            token = request.cookies.get("knotcore_access_token")
            
        if not token:
            return jsonify({"error": "Authentication required. Bearer token or session cookie missing."}), 401
            
        try:
            payload = verify_access_token(token)
            g.current_user = payload
            g.token_jti = payload.get("jti")
            g.token_exp = payload.get("exp")
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated

def require_role(*allowed_roles):
    """Enforces that the authenticated user possesses one of the allowed roles (or super_admin)."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            user_role = g.current_user.get("role")
            if user_role == "super_admin":
                return f(*args, **kwargs)
            if user_role not in allowed_roles:
                log_security_event(
                    g.current_user.get("user_id"),
                    "unauthorized_role_access_blocked",
                    {"attempted_role": user_role, "required_roles": allowed_roles, "path": request.path}
                )
                return jsonify({
                    "error": f"Access denied: insufficient role privileges for '{user_role}'. Required: {list(allowed_roles)}."
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ----------------- FLASK BLUEPRINT & ENDPOINTS -----------------
auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticates user credentials, validates lockout, and issues signed JWT + rotated refresh token.
    Payload: { "identifier": "username or email", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""
    
    if not identifier or not password:
        return jsonify({"error": "Identifier (username/email) and password are required."}), 400
        
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT * FROM users
            WHERE (email = %s OR username = %s);
        """, (identifier, identifier))
        user = cur.fetchone()
        
        now = datetime.datetime.now(datetime.timezone.utc)
        
        # User not found: perform dummy bcrypt check to mitigate timing enumeration attacks
        if not user:
            bcrypt.checkpw(b"dummy_timing_probe", b"$2b$12$e80MvX9wZgC3y0D8C6gA1.0s0.bM4g4z7L5e6x8h9j0k1l2m3n4o5")
            log_security_event(None, "login_failed_unknown_user", {"identifier": identifier})
            return jsonify({"error": "Invalid credentials provided."}), 401
            
        # Check active status
        if not user["is_active"]:
            log_security_event(user["id"], "login_rejected_disabled_account")
            return jsonify({"error": "User account has been deactivated. Contact Super Administrator."}), 403
            
        # Check brute force lockout
        if user["locked_until"] and user["locked_until"] > now:
            remaining_mins = max(1, int((user["locked_until"] - now).total_seconds() / 60))
            log_security_event(user["id"], "login_rejected_account_locked", {"remaining_minutes": remaining_mins})
            return jsonify({
                "error": f"Account temporarily locked due to repeated failed login attempts. Try again in {remaining_mins} minute(s)."
            }), 429
            
        # Verify password hash
        if not verify_password(password, user["password_hash"]):
            failed_count = (user["failed_login_attempts"] or 0) + 1
            locked_until = None
            if failed_count >= MAX_FAILED_ATTEMPTS:
                locked_until = now + datetime.timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                log_security_event(user["id"], "account_locked", {"failed_attempts": failed_count})
            else:
                log_security_event(user["id"], "login_failed_bad_password", {"failed_attempts": failed_count})
                
            cur.execute("""
                UPDATE users
                SET failed_login_attempts = %s, locked_until = %s, updated_at = %s
                WHERE id = %s;
            """, (failed_count, locked_until, now, user["id"]))
            conn.commit()
            
            if locked_until:
                return jsonify({
                    "error": f"Maximum failed attempts reached. Account locked for {LOCKOUT_DURATION_MINUTES} minutes."
                }), 429
            return jsonify({
                "error": f"Invalid credentials. {MAX_FAILED_ATTEMPTS - failed_count} attempt(s) remaining."
            }), 401
            
        # Successful login: reset failed attempts & record last_login_at
        cur.execute("""
            UPDATE users
            SET failed_login_attempts = 0, locked_until = NULL, last_login_at = %s, updated_at = %s
            WHERE id = %s;
        """, (now, now, user["id"]))
        conn.commit()
        
        # Issue tokens
        access_token, jti, exp_ts = generate_access_token(user)
        refresh_token = create_refresh_token(user["id"])
        
        log_security_event(user["id"], "login_success", {"role": user["role"]})
        
        resp_data = {
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_LIFETIME_MINUTES * 60,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "full_name": user["full_name"],
                "role": user["role"],
                "permissions": ROLE_PERMISSIONS.get(user["role"], []),
                "allowed_modules": ROLE_MODULE_ACCESS.get(user["role"], []),
                "last_login_at": user["last_login_at"].isoformat() if user["last_login_at"] else now.isoformat()
            }
        }
        
        response = make_response(jsonify(resp_data))
        # Set HttpOnly, SameSite=Lax cookie for token handling
        is_secure = request.is_secure or (request.headers.get("X-Forwarded-Proto") == "https")
        response.set_cookie(
            "knotcore_access_token",
            access_token,
            max_age=ACCESS_TOKEN_LIFETIME_MINUTES * 60,
            httponly=True,
            secure=is_secure,
            samesite="Lax",
            path="/"
        )
        response.set_cookie(
            "knotcore_refresh_token",
            refresh_token,
            max_age=REFRESH_TOKEN_LIFETIME_DAYS * 86400,
            httponly=True,
            secure=is_secure,
            samesite="Lax",
            path="/"
        )
        return response
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Rotates refresh token and issues a new access token."""
    data = request.get_json(silent=True) or {}
    raw_token = data.get("refresh_token") or request.cookies.get("knotcore_refresh_token")
    
    if not raw_token:
        return jsonify({"error": "Refresh token is required."}), 400
        
    try:
        new_refresh_token, user = rotate_refresh_token(raw_token)
        access_token, jti, exp_ts = generate_access_token(user)
        log_security_event(user["id"], "token_refreshed")
        
        resp_data = {
            "success": True,
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "expires_in": ACCESS_TOKEN_LIFETIME_MINUTES * 60,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "full_name": user["full_name"],
                "role": user["role"],
                "permissions": ROLE_PERMISSIONS.get(user["role"], []),
                "allowed_modules": ROLE_MODULE_ACCESS.get(user["role"], [])
            }
        }
        response = make_response(jsonify(resp_data))
        is_secure = request.is_secure or (request.headers.get("X-Forwarded-Proto") == "https")
        response.set_cookie(
            "knotcore_access_token",
            access_token,
            max_age=ACCESS_TOKEN_LIFETIME_MINUTES * 60,
            httponly=True,
            secure=is_secure,
            samesite="Lax",
            path="/"
        )
        response.set_cookie(
            "knotcore_refresh_token",
            new_refresh_token,
            max_age=REFRESH_TOKEN_LIFETIME_DAYS * 86400,
            httponly=True,
            secure=is_secure,
            samesite="Lax",
            path="/"
        )
        return response
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Revokes access token JTI and current refresh token."""
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    if not token:
        token = request.cookies.get("knotcore_access_token")
        
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
            jti = payload.get("jti")
            exp = payload.get("exp") or int(datetime.datetime.now(datetime.timezone.utc).timestamp()) + 900
            if jti:
                revoke_token(jti, exp)
                log_security_event(payload.get("user_id"), "logout", {"jti": jti})
        except Exception:
            pass
            
    # Invalidate refresh token if sent
    data = request.get_json(silent=True) or {}
    raw_refresh = data.get("refresh_token") or request.cookies.get("knotcore_refresh_token")
    if raw_refresh:
        h = hashlib.sha256(raw_refresh.encode("utf-8")).hexdigest()
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute("UPDATE user_refresh_tokens SET revoked = TRUE WHERE token_hash = %s;", (h,))
            conn.commit()
        finally:
            cur.close()
            conn.close()
            
    response = make_response(jsonify({"success": True, "message": "Successfully logged out."}))
    response.set_cookie("knotcore_access_token", "", max_age=0, path="/")
    response.set_cookie("knotcore_refresh_token", "", max_age=0, path="/")
    return response

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user_profile():
    """Returns the profile and authorized modules for the currently authenticated session."""
    user_id = g.current_user["user_id"]
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, email, username, full_name, role, is_active, last_login_at, created_at
            FROM users WHERE id = %s;
        """, (user_id,))
        user = cur.fetchone()
        if not user or not user["is_active"]:
            return jsonify({"error": "User profile not found or inactive."}), 404
            
        user["permissions"] = ROLE_PERMISSIONS.get(user["role"], [])
        user["allowed_modules"] = ROLE_MODULE_ACCESS.get(user["role"], [])
        return jsonify({"user": user})
    finally:
        cur.close()
        conn.close()

# ----------------- USER MANAGEMENT (SUPER ADMIN ONLY) -----------------
@auth_bp.route("/users", methods=["GET"])
@require_role("super_admin")
def list_users():
    """Lists all users (Super Admin only). Password hashes are never exposed."""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, email, username, full_name, role, is_active, failed_login_attempts,
                   locked_until, last_login_at, created_at, updated_at
            FROM users
            ORDER BY id ASC;
        """)
        users = cur.fetchall()
        for u in users:
            u["permissions"] = ROLE_PERMISSIONS.get(u["role"], [])
            u["allowed_modules"] = ROLE_MODULE_ACCESS.get(u["role"], [])
        return jsonify({"users": users})
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/users", methods=["POST"])
@require_role("super_admin")
def create_user():
    """Creates a new user account with role assignment (Super Admin only)."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip().lower()
    full_name = (data.get("full_name") or "").strip()
    password = data.get("password") or ""
    role = (data.get("role") or "admin").strip().lower()
    
    if not email or not username or not password:
        return jsonify({"error": "Email, username, and password are required."}), 400
        
    if role not in ROLE_PERMISSIONS:
        return jsonify({"error": f"Invalid role '{role}'. Allowed: {list(ROLE_PERMISSIONS.keys())}."}), 400
        
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400
        
    pwd_hash = hash_password(password)
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s;", (email, username))
        if cur.fetchone():
            return jsonify({"error": "A user with this email or username already exists."}), 409
            
        cur.execute("""
            INSERT INTO users (email, username, full_name, password_hash, role, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
            RETURNING id, email, username, full_name, role, is_active, created_at;
        """, (email, username, full_name, pwd_hash, role))
        new_user = cur.fetchone()
        conn.commit()
        
        log_security_event(g.current_user["user_id"], "user_created", {"created_user_id": new_user["id"], "role": role})
        return jsonify({"success": True, "user": new_user}), 201
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/users/<int:target_user_id>/role", methods=["PUT"])
@require_role("super_admin")
def update_user_role(target_user_id: int):
    """Updates the role of a user (Super Admin only)."""
    data = request.get_json(silent=True) or {}
    new_role = (data.get("role") or "").strip().lower()
    
    if new_role not in ROLE_PERMISSIONS:
        return jsonify({"error": f"Invalid role. Allowed: {list(ROLE_PERMISSIONS.keys())}."}), 400
        
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id, role, email FROM users WHERE id = %s;", (target_user_id,))
        target = cur.fetchone()
        if not target:
            return jsonify({"error": "User not found."}), 404
            
        # Prevent demoting the last super_admin account
        if target["role"] == "super_admin" and new_role != "super_admin":
            cur.execute("SELECT count(*) as count FROM users WHERE role = 'super_admin' AND is_active = TRUE; ")
            count = cur.fetchone()["count"]
            if count <= 1:
                return jsonify({"error": "Cannot demote the only remaining active Super Administrator account."}), 400
                
        cur.execute("""
            UPDATE users
            SET role = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, username, role;
        """, (new_role, target_user_id))
        updated = cur.fetchone()
        conn.commit()
        
        log_security_event(g.current_user["user_id"], "role_changed", {
            "target_user_id": target_user_id,
            "old_role": target["role"],
            "new_role": new_role
        })
        return jsonify({"success": True, "user": updated})
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/users/<int:target_user_id>/status", methods=["PUT"])
@require_role("super_admin")
def toggle_user_status(target_user_id: int):
    """Activates or deactivates a user account (Super Admin only)."""
    data = request.get_json(silent=True) or {}
    is_active = bool(data.get("is_active", True))
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id, role, email FROM users WHERE id = %s;", (target_user_id,))
        target = cur.fetchone()
        if not target:
            return jsonify({"error": "User not found."}), 404
            
        if target["id"] == g.current_user["user_id"] and not is_active:
            return jsonify({"error": "You cannot deactivate your own active session."}), 400
            
        cur.execute("""
            UPDATE users
            SET is_active = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, email, username, is_active;
        """, (is_active, target_user_id))
        updated = cur.fetchone()
        
        # If deactivating, revoke all active refresh tokens for this user
        if not is_active:
            cur.execute("UPDATE user_refresh_tokens SET revoked = TRUE WHERE user_id = %s;", (target_user_id,))
            
        conn.commit()
        log_security_event(g.current_user["user_id"], "user_status_toggled", {
            "target_user_id": target_user_id,
            "is_active": is_active
        })
        return jsonify({"success": True, "user": updated})
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/users/<int:target_user_id>/reset-password", methods=["POST"])
@require_role("super_admin")
def reset_user_password(target_user_id: int):
    """Resets the password for a user account (Super Admin only)."""
    data = request.get_json(silent=True) or {}
    new_password = data.get("new_password") or ""
    
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long."}), 400
        
    pwd_hash = hash_password(new_password)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, email FROM users WHERE id = %s;", (target_user_id,))
        if not cur.fetchone():
            return jsonify({"error": "User not found."}), 404
            
        cur.execute("""
            UPDATE users
            SET password_hash = %s, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
            WHERE id = %s;
            
            -- Revoke all previous refresh tokens on password reset
            UPDATE user_refresh_tokens SET revoked = TRUE WHERE user_id = %s;
        """, (pwd_hash, target_user_id, target_user_id))
        conn.commit()
        
        log_security_event(g.current_user["user_id"], "password_reset", {"target_user_id": target_user_id})
        return jsonify({"success": True, "message": f"Password reset successfully for user ID {target_user_id}."})
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/audit-logs", methods=["GET"])
@require_role("super_admin")
def get_audit_logs():
    """Returns recent security audit logs (Super Admin only)."""
    limit = min(int(request.args.get("limit", 50)), 200)
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT l.id, l.user_id, u.username, u.email, l.event_type, l.ip_address,
                   l.user_agent, l.details, l.created_at
            FROM auth_audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.id DESC
            LIMIT %s;
        """, (limit,))
        logs = cur.fetchall()
        return jsonify({"audit_logs": logs})
    finally:
        cur.close()
        conn.close()
