import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import pg from "pg";
import type { Pool } from "pg";
const { Pool: PoolClass } = pg;
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import googleapis from "googleapis";
const { google } = googleapis;
import fs from "fs";
import { Readable } from "stream";
import { parse, isValid, format, addDays } from "date-fns";
import apiRoutes from './backend/routes/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Configuration
let DATABASE_URL = process.env.DATABASE_URL;

// Render/Supabase compatibility fix: ensure postgresql:// prefix
if (DATABASE_URL && DATABASE_URL.startsWith('postgres://')) {
  DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://');
}

const isPostgresAttempt = !!DATABASE_URL && DATABASE_URL.startsWith('postgresql');
let sqliteDb: any = null;
let pgPool: Pool | null = null;
let dbStatus = "SQLite (Local/Temporário)";
let effectivePostgres = false;

if (isPostgresAttempt) {
  pgPool = new PoolClass({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  });
  
  try {
    const client = await pgPool.connect();
    console.log("✅ DATABASE: PostgreSQL (Supabase) conectado com sucesso!");
    dbStatus = "PostgreSQL (Supabase/Persistente)";
    effectivePostgres = true;
    client.release();
  } catch (err: any) {
    console.error("❌ ERRO CRÍTICO NO POSTGRESQL:", err.message);
    
    if (err.message.includes('ENETUNREACH') || err.message.includes('::')) {
      console.log("⚠️ DETECTADO ERRO DE REDE (IPv6).");
      console.log("💡 DICA: O Render não suporta IPv6 nativamente. No Supabase, use a URL do 'Connection Pooler' (Porta 6543) em vez da conexão direta (5432).");
    } else {
      console.log("⚠️ DATABASE_URL encontrada, mas a conexão falhou. Verifique a senha no Render.");
    }
    
    dbStatus = "Erro de Rede/Senha (Verificar DATABASE_URL)";
    effectivePostgres = false;
  }
}

const isPostgres = effectivePostgres; // Alias for backward compatibility in the rest of the file

if (!effectivePostgres) {
  sqliteDb = new Database("obra_control.db");
  if (!isPostgresAttempt) {
    console.log("ℹ️ DATABASE: Usando SQLite (Local). Configure DATABASE_URL no Render para persistência.");
  }
}

// Helpers
const validateDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return true;
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === dateStr;
};

const getPagination = (req: express.Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// Unified Database Interface
const db = {
  async exec(sql: string) {
    if (effectivePostgres) {
      await pgPool!.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },
  async query(sql: string, params: any[] = []) {
    const sanitizedParams = params.map(p => (p === "null" || (typeof p === "number" && isNaN(p))) ? null : p);
    if (effectivePostgres) {
      // Convert ? to $1, $2, etc for Postgres
      let count = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++count}`);
      const result = await pgPool!.query(pgSql, sanitizedParams);
      return result.rows;
    } else {
      return sqliteDb.prepare(sql).all(...sanitizedParams);
    }
  },
  async queryOne(sql: string, params: any[] = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  },
  async run(sql: string, params: any[] = []) {
    const sanitizedParams = params.map(p => (p === "null" || (typeof p === "number" && isNaN(p))) ? null : p);
    if (effectivePostgres) {
      let count = 0;
      let pgSql = sql.replace(/\?/g, () => `$${++count}`);
      if (pgSql.trim().toUpperCase().startsWith("INSERT") && !pgSql.toUpperCase().includes("RETURNING")) {
        pgSql += " RETURNING id";
      }
      const result = await pgPool!.query(pgSql, sanitizedParams);
      return { lastInsertRowid: result.rows[0]?.id || null };
    } else {
      const info = sqliteDb.prepare(sql).run(...sanitizedParams);
      return { lastInsertRowid: info.lastInsertRowid };
    }
  },
  // Special helper for SQLite backup which doesn't exist in PG
  async backup(path: string) {
    if (!effectivePostgres) {
      await sqliteDb.backup(path);
    } else {
      throw new Error("Backup not supported on PostgreSQL via this method");
    }
  }
};

// Initialize Database Schema
async function initDb() {
  const autoIncrement = effectivePostgres ? "SERIAL" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const pk = effectivePostgres ? "PRIMARY KEY" : "";
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${effectivePostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      code TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      document TEXT,
      phone TEXT,
      is_registered INTEGER DEFAULT 1,
      base_salary REAL NOT NULL,
      admission_date TEXT NOT NULL,
      bank_name TEXT,
      bank_agency TEXT,
      bank_operation TEXT,
      bank_account TEXT,
      bank_observations TEXT,
      vacation_preview TEXT,
      resignation_date TEXT,
      photo TEXT,
      status TEXT DEFAULT 'Ativo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_roles (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      name TEXT UNIQUE NOT NULL,
      salary REAL NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'monthly',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS frequency (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      employee_id INTEGER,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      atestato_days INTEGER DEFAULT 0,
      observations TEXT,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      employee_id INTEGER,
      month TEXT NOT NULL,
      fortnight INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      file_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS signatures (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      document_id INTEGER,
      employee_id INTEGER,
      signature_data TEXT,
      ip_address TEXT,
      signed_at TIMESTAMP,
      status TEXT DEFAULT 'Pendente'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Nucleo 2: Parametros Construtivos
    CREATE TABLE IF NOT EXISTS setores (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      nome_setor TEXT NOT NULL,
      descricao TEXT,
      ordem INTEGER DEFAULT 0,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tipos_ambiente (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      nome TEXT NOT NULL,
      descricao TEXT,
      icone TEXT,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pavimentos (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      setor_id INTEGER REFERENCES setores(id),
      nome_pavimento TEXT NOT NULL,
      descricao TEXT,
      ordem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ambientes (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      setor_id INTEGER REFERENCES setores(id),
      pavimento_id INTEGER REFERENCES pavimentos(id),
      nome_ambiente TEXT NOT NULL,
      tipo_ambiente TEXT NOT NULL, -- SALA, AREA TECNICA, AREA COMUM, MACRO
      area_total REAL,
      piso TEXT,
      parede TEXT,
      teto TEXT,
      esquadrias TEXT,
      metais TEXT,
      loucas TEXT,
      descricao TEXT,
      ordem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS parametros_servico_itens (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      parametro_id INTEGER REFERENCES parametros_servico(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      unidade_medida TEXT,
      quantidade_produtividade REAL,
      unidade_tempo TEXT, -- HORA, DIA
      valor_parametro REAL
    );

    CREATE TABLE IF NOT EXISTS servicos_ambiente (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      ambiente_id INTEGER REFERENCES ambientes(id),
      nome_servico TEXT NOT NULL,
      grupo_servico TEXT,
      unidade_medida TEXT,
      quantidade_total_prevista REAL NOT NULL,
      quantidade_executada REAL DEFAULT 0,
      quantidade_restante REAL,
      valor_parametro REAL,
      produtividade REAL,
      descricao TEXT
    );

    -- Nucleo 3: Atividades
    CREATE TABLE IF NOT EXISTS grupos_atividade (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      codigo TEXT,
      nome_grupo TEXT NOT NULL,
      unidade_medida TEXT,
      sequencia INTEGER DEFAULT 0,
      descricao TEXT,
      tempo_total REAL DEFAULT 0 -- Em dias
    );

    CREATE TABLE IF NOT EXISTS atividades (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      grupo_atividade_id INTEGER REFERENCES grupos_atividade(id),
      nome_atividade TEXT NOT NULL,
      unidade_medida TEXT,
      sequencia INTEGER DEFAULT 0,
      descricao TEXT,
      ambiente_id INTEGER REFERENCES ambientes(id),
      pavimento_id INTEGER REFERENCES pavimentos(id),
      setor_id INTEGER REFERENCES setores(id),
      prazo_execucao INTEGER,
      produtividade_profissional REAL,
      valor_parametro REAL,
      tipo_pagamento TEXT,
      quantidade_padrao REAL DEFAULT 1,
      status TEXT DEFAULT 'Ativo',
      tem_dependencia INTEGER DEFAULT 0,
      predecessora_id INTEGER REFERENCES atividades(id),
      tempo_estimado REAL DEFAULT 0,
      unidade_tempo_estimado TEXT DEFAULT 'DIA' -- DIA, HORA
    );

    CREATE TABLE IF NOT EXISTS servicos_definicao (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      atividade_id INTEGER REFERENCES atividades(id),
      nome_servico TEXT NOT NULL,
      unidade_medida TEXT,
      quantidade_produtividade REAL,
      tempo_produtividade REAL,
      unidade_tempo TEXT, -- DIA, HORA
      produtividade_media REAL,
      descricao TEXT
    );

    CREATE TABLE IF NOT EXISTS composicao_atividade (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      atividade_id INTEGER REFERENCES atividades(id),
      tipo_item TEXT, -- INSUMO, FERRAMENTA
      descricao TEXT,
      quantidade REAL,
      unidade_medida TEXT
    );

    CREATE TABLE IF NOT EXISTS atividade_dependencia (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      atividade_id INTEGER REFERENCES atividades(id),
      atividade_pre_requisito_id INTEGER REFERENCES atividades(id)
    );

    CREATE TABLE IF NOT EXISTS parametros_servico (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      unidade_medida TEXT,
      produtividade REAL,
      produtividade_media REAL,
      unidade_tempo TEXT DEFAULT 'DIA', -- DIA, HORA
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grupos_servico (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      codigo TEXT,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grupos_servico_atividades (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      grupo_id INTEGER REFERENCES grupos_servico(id) ON DELETE CASCADE,
      atividade_id INTEGER REFERENCES parametros_servico(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS etapas_servico (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      codigo TEXT,
      nome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS etapas_servico_grupos (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      etapa_id INTEGER REFERENCES etapas_servico(id) ON DELETE CASCADE,
      grupo_id INTEGER REFERENCES grupos_servico(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historico_parametros (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      tipo_item TEXT, -- 'GRUPO', 'ETAPA', 'ATIVIDADE'
      item_id INTEGER,
      codigo TEXT,
      nome TEXT,
      descricao_alteracao TEXT,
      usuario_email TEXT,
      data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Nucleo 4: Execucao Diaria
    CREATE TABLE IF NOT EXISTS execucao_diaria (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      data_execucao TEXT NOT NULL,
      funcionario_id INTEGER REFERENCES employees(id),
      atividade_id INTEGER REFERENCES atividades(id),
      ambiente_id INTEGER REFERENCES ambientes(id),
      quantidade_executada REAL NOT NULL,
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS estoque (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      descricao TEXT UNIQUE NOT NULL,
      quantidade_atual REAL DEFAULT 0,
      quantidade_minima REAL DEFAULT 0,
      unidade_medida TEXT,
      tipo_item TEXT, -- INSUMO, FERRAMENTA
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      task TEXT NOT NULL,
      category TEXT DEFAULT 'Geral',
      status TEXT DEFAULT 'Pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_certificates (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      employee_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      days_away INTEGER NOT NULL,
      return_date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    );
  `);

  // Migration for existing tables
  try {
    await db.exec("ALTER TABLE setores ADD COLUMN ordem INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE pavimentos ADD COLUMN ordem INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE ambientes ADD COLUMN ordem INTEGER DEFAULT 0");
  } catch (e) {}

  // Migrations
  try { await db.exec("ALTER TABLE grupos_atividade ADD COLUMN codigo TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE grupos_atividade ADD COLUMN unidade_medida TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE grupos_atividade ADD COLUMN sequencia INTEGER DEFAULT 0;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN sequencia INTEGER DEFAULT 0;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN status TEXT DEFAULT 'Ativo';"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN quantidade_padrao REAL DEFAULT 1;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN descricao TEXT;"); } catch(e) {}

  try { await db.exec("ALTER TABLE employees ADD COLUMN code TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN document TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN phone TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN is_registered INTEGER DEFAULT 1;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN photo TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE servicos_ambiente ADD COLUMN descricao TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN descricao TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN quantidade_padrao REAL DEFAULT 1;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN status TEXT DEFAULT 'Ativo';"); } catch(e) {}
  try { await db.exec("ALTER TABLE ambientes ADD COLUMN piso TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE ambientes ADD COLUMN parede TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE ambientes ADD COLUMN teto TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE ambientes ADD COLUMN esquadrias TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE ambientes ADD COLUMN metais TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE tipos_ambiente ADD COLUMN icone TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE parametros_servico ADD COLUMN produtividade_media REAL;"); } catch(e) {}
  try { await db.exec("ALTER TABLE grupos_servico ADD COLUMN codigo TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE etapas_servico ADD COLUMN codigo TEXT;"); } catch(e) {}

  // Default Admin
  const admin = await db.queryOne("SELECT * FROM users WHERE username = 'Engenheiro1'");
  if (!admin) {
    const hashedPassword = bcrypt.hashSync("TorreaoV25", 10);
    await db.run("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)", [
      "Engenheiro1", hashedPassword, "admin", "Engenheiro Responsável"
    ]);
  }
}

// Google OAuth2 Config
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/google/callback`
);

let googleTokens: any = null;

async function loadGoogleTokens() {
  const row = await db.queryOne("SELECT value FROM settings WHERE key = 'google_tokens'");
  if (row) {
    googleTokens = JSON.parse(row.value);
    oauth2Client.setCredentials(googleTokens);
  }
}

async function saveGoogleTokens(tokens: any) {
  googleTokens = tokens;
  const value = JSON.stringify(tokens);
  if (isPostgres) {
    await db.run("INSERT INTO settings (key, value) VALUES ('google_tokens', ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [value]);
  } else {
    await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('google_tokens', ?)", [value]);
  }
}

async function startServer() {
  await initDb();
  await loadGoogleTokens();
  
  const app = express();
  app.use(express.json());

// Modular API Routes v2 (Prisma)
app.use('/api/v2', apiRoutes);

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userRole = req.headers['x-user-role'];
    if (userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
  };

  // Google Auth
  app.get("/api/auth/google/url", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      await saveGoogleTokens(tokens);
      oauth2Client.setCredentials(tokens);
      res.send(`<html><body><script>if(window.opener){window.opener.postMessage({type:'OAUTH_AUTH_SUCCESS',provider:'google'},'*');window.close();}else{window.location.href='/';}</script></body></html>`);
    } catch (error) {
      console.error("Erro no callback do Google:", error);
      res.status(500).send("Erro na autenticação");
    }
  });

  app.get("/api/sync/google-drive/status", (req, res) => {
    res.json({ connected: !!googleTokens });
  });

  app.post("/api/factory-reset", requireAdmin, async (req, res) => {
    try {
      const tables = [
        'checklists', 'estoque', 'execucao_diaria', 'atividade_dependencia', 
        'composicao_atividade', 'atividades', 'grupos_atividade', 'servicos_ambiente', 
        'ambientes', 'pavimentos', 'setores', 'settings', 'signatures', 
        'documents', 'payroll', 'frequency', 'job_roles', 'employees', 'users'
      ];

      for (const table of tables) {
        await db.exec(`DROP TABLE IF EXISTS ${table}`);
      }

      await initDb();
      res.json({ success: true, message: "Sistema resetado com sucesso para as configurações de fábrica." });
    } catch (error: any) {
      console.error("Erro no factory reset:", error);
      res.status(500).json({ error: "Erro ao resetar o sistema: " + error.message });
    }
  });

  app.post("/api/sync/google-drive/backup", async (req, res) => {
    if (isPostgres) return res.status(400).json({ error: "Backup via Google Drive só disponível em modo SQLite local." });
    if (!googleTokens) return res.status(401).json({ error: "Google Drive não conectado" });

    try {
      oauth2Client.setCredentials(googleTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const tempBackupPath = path.join(__dirname, "obra_control_temp.db");
      await db.backup(tempBackupPath);
      
      const media = { mimeType: 'application/x-sqlite3', body: fs.createReadStream(tempBackupPath) };
      await drive.files.create({ requestBody: { name: 'obra_control_backup.db' }, media: media });
      fs.unlinkSync(tempBackupPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.queryOne("SELECT * FROM users WHERE username = ?", [username]);
    if (user && bcrypt.compareSync(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Incorreto" });
    }
  });

  // Users
  app.get("/api/users", requireAdmin, async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const users = await db.query("SELECT id, username, role, name, created_at FROM users LIMIT ? OFFSET ?", [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM users");
    res.json({ data: users, total: parseInt(total.count), page, limit });
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    const { username, password, role, name } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await db.run("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)", [username, hashedPassword, role, name]);
      res.json({ success: true });
    } catch (e) { res.status(400).json({ error: "Erro" }); }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM users WHERE id = ? AND username != 'admin'", [req.params.id]);
    res.json({ success: true });
  });

  // Job Roles
  app.get("/api/job-roles", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const roles = await db.query("SELECT * FROM job_roles ORDER BY name LIMIT ? OFFSET ?", [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM job_roles");
    res.json({ data: roles, total: parseInt(total.count), page, limit });
  });

  app.post("/api/job-roles", requireAdmin, async (req, res) => {
    const { name, salary, payment_type } = req.body;
    try {
      const info = await db.run("INSERT INTO job_roles (name, salary, payment_type) VALUES (?, ?, ?)", [name, salary, payment_type]);
      res.json({ id: info.lastInsertRowid });
    } catch (e) { res.status(400).json({ error: "Erro" }); }
  });

  app.put("/api/job-roles/:id", requireAdmin, async (req, res) => {
    const { name, salary, payment_type } = req.body;
    await db.run("UPDATE job_roles SET name = ?, salary = ?, payment_type = ? WHERE id = ?", [name, salary, payment_type, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/job-roles/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("DELETE FROM job_roles WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: "Não é possível excluir este cargo pois existem funcionários vinculados a ele." });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { search, status } = req.query;
    
    let query = "SELECT * FROM employees WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as count FROM employees WHERE 1=1";
    const params: any[] = [];

    if (search && search !== '') {
      query += " AND (name LIKE ? OR role LIKE ? OR code LIKE ? OR document LIKE ?)";
      countQuery += " AND (name LIKE ? OR role LIKE ? OR code LIKE ? OR document LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status && status !== 'all' && status !== 'Todos') {
      if (status === 'Desligado') {
        query += " AND status = 'TERMINATED'";
        countQuery += " AND status = 'TERMINATED'";
      } else {
        query += " AND status = ?";
        countQuery += " AND status = ?";
        params.push(status);
      }
    }

    query += " ORDER BY name LIMIT ? OFFSET ?";
    const queryParams = [...params, limit, offset];

    const employees = await db.query(query, queryParams);
    const total = await db.queryOne(countQuery, params);
    res.json({ data: employees, total: parseInt(total.count), page, limit });
  });

  app.get("/api/employees/next-code", async (req, res) => {
    const employees = await db.query("SELECT code FROM employees");
    const codes = employees
      .map((e: any) => parseInt(e.code || '0'))
      .filter((c: number) => !isNaN(c));
    const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
    const nextCode = (maxCode + 1).toString().padStart(4, '0');
    res.json({ nextCode });
  });

  app.post("/api/employees/import", requireAdmin, async (req, res) => {
    const { employees } = req.body;
    let count = 0;
    for (const row of employees) {
      const mappedData = {
        code: row['Código'] || row['code'],
        name: row['Nome'] || row['name'],
        role: row['Função'] || row['role'],
        document: row['Documento'] || row['document'],
        phone: row['Telefone'] || row['phone'],
        is_registered: (row['Registrado'] === 'Sim' || row['is_registered'] === 1) ? 1 : 0,
        base_salary: parseFloat(row['Salário Base'] || row['base_salary'] || 0),
        bank_name: row['Banco'] || row['bank_name'],
        bank_agency: row['Agência'] || row['bank_agency'],
        bank_operation: row['Operação'] || row['bank_operation'],
        bank_account: row['Conta'] || row['bank_account'],
        bank_observations: row['Observações Bancárias'] || row['bank_observations'],
        admission_date: row['Data Admissão'] || row['admission_date'],
        status: 'Ativo'
      };

      if (!mappedData.name) continue;

      await db.run("INSERT INTO employees (code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [mappedData.code, mappedData.name, mappedData.role, mappedData.document, mappedData.phone, mappedData.is_registered, mappedData.base_salary, mappedData.admission_date, mappedData.bank_name, mappedData.bank_agency, mappedData.bank_operation, mappedData.bank_account, mappedData.bank_observations, mappedData.status]);
      count++;
    }
    res.json({ count });
  });

  app.post("/api/employees/:id/terminate", requireAdmin, async (req, res) => {
    const { date } = req.body;
    await db.run("UPDATE employees SET status = 'TERMINATED', resignation_date = ? WHERE id = ?", [date, req.params.id]);
    res.json({ success: true });
  });

  app.post("/api/attendance/medical-certificate", requireAdmin, async (req, res) => {
    const { employeeId, startDate, days, description } = req.body;
    
    // Calculate return date
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const returnDateObj = addDays(start, parseInt(days));
    const returnDate = format(returnDateObj, 'yyyy-MM-dd');

    await db.run("INSERT INTO medical_certificates (employee_id, type, start_date, days_away, return_date) VALUES (?, ?, ?, ?, ?)",
      [employeeId, 'Atestado Médico', startDate, days, returnDate]);
    
    // Also record in frequency
    for (let i = 0; i < parseInt(days); i++) {
      const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
      if (isPostgres) {
        await db.run("INSERT INTO frequency (employee_id, date, status, atestato_days, observations) VALUES (?, ?, ?, ?, ?) ON CONFLICT (employee_id, date) DO UPDATE SET status = EXCLUDED.status, atestato_days = EXCLUDED.atestato_days, observations = EXCLUDED.observations", 
          [employeeId, currentDate, 'Atestado', days, description]);
      } else {
        await db.run("INSERT INTO frequency (employee_id, date, status, atestato_days, observations) VALUES (?, ?, ?, ?, ?) ON CONFLICT(employee_id, date) DO UPDATE SET status=excluded.status, atestato_days=excluded.atestato_days, observations=excluded.observations",
          [employeeId, currentDate, 'Atestado', days, description]);
      }
    }

    res.json({ success: true });
  });

  app.post("/api/employees", requireAdmin, async (req, res) => {
    const { code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo } = req.body;
    
    if (!validateDate(admission_date) || !validateDate(vacation_preview)) {
      return res.status(400).json({ error: "Formato de data inválido. Use yyyy-MM-dd." });
    }

    const info = await db.run("INSERT INTO employees (code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo]);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/employees/:id", requireAdmin, async (req, res) => {
    const { code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, status, resignation_date, photo } = req.body;
    
    if (!validateDate(admission_date) || !validateDate(vacation_preview) || !validateDate(resignation_date)) {
      return res.status(400).json({ error: "Formato de data inválido. Use yyyy-MM-dd." });
    }

    await db.run("UPDATE employees SET code = ?, name = ?, role = ?, document = ?, phone = ?, is_registered = ?, base_salary = ?, admission_date = ?, bank_name = ?, bank_agency = ?, bank_operation = ?, bank_account = ?, bank_observations = ?, vacation_preview = ?, status = ?, resignation_date = ?, photo = ? WHERE id = ?",
      [code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, status, resignation_date, photo, req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/employees/:id/linked-records", async (req, res) => {
    const { id } = req.params;
    const frequencyCount = await db.queryOne("SELECT COUNT(*) as count FROM frequency WHERE employee_id = ?", [id]);
    const payrollCount = await db.queryOne("SELECT COUNT(*) as count FROM payroll WHERE employee_id = ?", [id]);
    const medicalCount = await db.queryOne("SELECT COUNT(*) as count FROM medical_certificates WHERE employee_id = ?", [id]);
    const signatureCount = await db.queryOne("SELECT COUNT(*) as count FROM signatures WHERE employee_id = ?", [id]);
    
    res.json({
      frequency: parseInt(frequencyCount.count),
      payroll: parseInt(payrollCount.count),
      medical: parseInt(medicalCount.count),
      signatures: parseInt(signatureCount.count),
      total: parseInt(frequencyCount.count) + parseInt(payrollCount.count) + parseInt(medicalCount.count) + parseInt(signatureCount.count)
    });
  });

  app.delete("/api/employees/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("DELETE FROM employees WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: "Não é possível excluir este funcionário pois existem registros vinculados (frequência, folha, etc)." });
    }
  });

  // Frequency
  app.get("/api/frequency", async (req, res) => {
    const { start, end, employee_id, role } = req.query;
    const { page, limit, offset } = getPagination(req);
    let query = "SELECT f.*, e.name as employee_name FROM frequency f JOIN employees e ON f.employee_id = e.id WHERE 1=1";
    const params: any[] = [];
    if (start) { query += " AND f.date >= ?"; params.push(start); }
    if (end) { query += " AND f.date <= ?"; params.push(end); }
    if (employee_id) { query += " AND f.employee_id = ?"; params.push(employee_id); }
    if (role) { query += " AND e.role = ?"; params.push(role); }
    
    const total = await db.queryOne(`SELECT COUNT(*) as count FROM (${query}) as t`, params);
    query += " ORDER BY f.date DESC, e.name ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const data = await db.query(query, params);
    res.json({ data, total: parseInt(total.count), page, limit });
  });

  app.post("/api/frequency", requireAdmin, async (req, res) => {
    const { employee_id, date, status, atestato_days, observations } = req.body;
    if (!validateDate(date)) return res.status(400).json({ error: "Formato de data inválido. Use yyyy-MM-dd." });
    
    if (isPostgres) {
      await db.run("INSERT INTO frequency (employee_id, date, status, atestato_days, observations) VALUES (?, ?, ?, ?, ?) ON CONFLICT (employee_id, date) DO UPDATE SET status = EXCLUDED.status, atestato_days = EXCLUDED.atestato_days, observations = EXCLUDED.observations", [employee_id, date, status, atestato_days || 0, observations]);
    } else {
      await db.run("INSERT OR REPLACE INTO frequency (employee_id, date, status, atestato_days, observations) VALUES (?, ?, ?, ?, ?) ", [employee_id, date, status, atestato_days || 0, observations]);
    }
    res.json({ success: true });
  });
  app.delete("/api/frequency/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM frequency WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Payroll
  app.get("/api/payroll", async (req, res) => {
    const { month, employee_id } = req.query;
    const { page, limit, offset } = getPagination(req);
    let query = "SELECT p.*, e.name as employee_name FROM payroll p JOIN employees e ON p.employee_id = e.id WHERE 1=1";
    const params: any[] = [];
    if (month) { query += " AND p.month = ?"; params.push(month); }
    if (employee_id) { query += " AND p.employee_id = ?"; params.push(employee_id); }
    
    const total = await db.queryOne(`SELECT COUNT(*) as count FROM (${query}) as t`, params);
    query += " ORDER BY p.month DESC, e.name ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const data = await db.query(query, params);
    res.json({ data, total: parseInt(total.count), page, limit });
  });

  app.post("/api/payroll", requireAdmin, async (req, res) => {
    const { employee_id, month, fortnight, type, amount, description } = req.body;
    await db.run("INSERT INTO payroll (employee_id, month, fortnight, type, amount, description) VALUES (?, ?, ?, ?, ?, ?)", [employee_id, month, fortnight, type, amount, description]);
    res.json({ success: true });
  });
  app.put("/api/payroll/:id", requireAdmin, async (req, res) => {
    const { employee_id, month, fortnight, type, amount, description } = req.body;
    await db.run("UPDATE payroll SET employee_id = ?, month = ?, fortnight = ?, type = ?, amount = ?, description = ? WHERE id = ?", [employee_id, month, fortnight, type, amount, description, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/payroll/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM payroll WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const totalEmployees = await db.queryOne("SELECT COUNT(*) as count FROM employees WHERE status = 'Ativo'");
      const registeredCount = await db.queryOne("SELECT COUNT(*) as count FROM employees WHERE status = 'Ativo' AND is_registered = 1");
      const notRegisteredCount = await db.queryOne("SELECT COUNT(*) as count FROM employees WHERE status = 'Ativo' AND is_registered = 0");
      
      const monthSql = isPostgres ? "TO_CHAR(CURRENT_DATE, 'YYYY-MM')" : "strftime('%Y-%m', 'now')";
      const monthlyCost = await db.queryOne(`SELECT SUM(amount) as total FROM payroll WHERE month = ${monthSql}`);
      
      const dateLimitSql = isPostgres ? "CURRENT_DATE - INTERVAL '30 days'" : "date('now', '-30 days')";
      const attendanceRate = await db.queryOne(`
        SELECT (CAST(SUM(CASE WHEN status = 'Presente' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0)) * 100 as rate
        FROM frequency WHERE date >= ${isPostgres ? "CAST(? AS TEXT)" : "?"}`, [isPostgres ? '2000-01-01' : '2000-01-01']);
      
      // Progress stats
      const progress = await db.queryOne(`
        SELECT 
          SUM(quantidade_executada) as total_exec,
          SUM(quantidade_total_prevista) as total_prev
        FROM servicos_ambiente
      `);
      const globalProgress = progress.total_prev > 0 ? (progress.total_exec / progress.total_prev) * 100 : 0;

      res.json({
        activeEmployees: parseInt(totalEmployees.count),
        registeredEmployees: parseInt(registeredCount.count),
        notRegisteredEmployees: parseInt(notRegisteredCount.count),
        currentMonthCost: parseFloat(monthlyCost.total || 0),
        attendanceRate: Math.round(attendanceRate.rate || 0),
        globalProgress: Math.round(globalProgress),
        dbStatus: dbStatus
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/dashboard-extended", async (req, res) => {
    try {
      // 1. Cost Evolution (Last 6 months)
      const costEvolution = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().substring(0, 7);
        const monthName = date.toLocaleString('pt-BR', { month: 'short' });
        
        const cost = await db.queryOne("SELECT SUM(amount) as total FROM payroll WHERE month = ?", [monthStr]);
        costEvolution.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          value: parseFloat(cost.total || 0)
        });
      }

      // 2. Payment Distribution (Current Month)
      const currentMonth = new Date().toISOString().substring(0, 7);
      const distribution = await db.query(`
        SELECT type as name, SUM(amount) as value 
        FROM payroll 
        WHERE month = ? 
        GROUP BY type
      `, [currentMonth]);
      
      const totalDist = distribution.reduce((acc: number, curr: any) => acc + parseFloat(curr.value), 0);
      const distributionData = distribution.map((d: any) => ({
        name: d.name,
        value: totalDist > 0 ? Math.round((parseFloat(d.value) / totalDist) * 100) : 0
      }));

      // 3. Recent Notifications / Activities
      const recentExecutions = await db.query(`
        SELECT ex.*, e.name as employee, a.nome_atividade, amb.nome_ambiente 
        FROM execucao_diaria ex
        JOIN employees e ON ex.funcionario_id = e.id
        JOIN atividades a ON ex.atividade_id = a.id
        JOIN ambientes amb ON ex.ambiente_id = amb.id
        ORDER BY ex.created_at DESC
        LIMIT 5
      `);

      const notifications = recentExecutions.map((ex: any) => ({
        id: ex.id,
        type: 'execution',
        title: 'Nova Execução Registrada',
        message: `${ex.employee} executou ${ex.quantidade_executada} de ${ex.nome_atividade} em ${ex.nome_ambiente}`,
        time: new Date(ex.created_at).toLocaleString('pt-BR'),
        status: 'info'
      }));

      // Add low progress alerts
      const lowProgressServices = await db.query(`
        SELECT sa.*, amb.nome_ambiente 
        FROM servicos_ambiente sa
        JOIN ambientes amb ON sa.ambiente_id = amb.id
        WHERE sa.quantidade_executada < (sa.quantidade_total_prevista * 0.1)
        AND sa.quantidade_total_prevista > 0
        LIMIT 3
      `);

      lowProgressServices.forEach((s: any) => {
        notifications.push({
          id: `alert-${s.id}`,
          type: 'alert',
          title: 'Alerta de Baixo Progresso',
          message: `Serviço "${s.nome_servico}" em ${s.nome_ambiente} está com menos de 10% de conclusão.`,
          time: 'Agora',
          status: 'warning'
        });
      });

      res.json({
        costEvolution,
        distributionData: distributionData.length > 0 ? distributionData : [
          { name: 'Salário', value: 100 }
        ],
        notifications: notifications.sort((a: any, b: any) => b.id.toString().localeCompare(a.id.toString()))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar dados estendidos" });
    }
  });

  app.get("/api/progress-details", async (req, res) => {
    try {
      // Progress by Sector
      const sectorProgress = await db.query(`
        SELECT 
          s.nome_setor as name,
          SUM(sa.quantidade_executada) as exec,
          SUM(sa.quantidade_total_prevista) as total
        FROM setores s
        JOIN ambientes a ON a.setor_id = s.id
        JOIN servicos_ambiente sa ON sa.ambiente_id = a.id
        GROUP BY s.id, s.nome_setor
      `);

      // Progress by Environment (Top 10 or most recent)
      const envProgress = await db.query(`
        SELECT 
          a.nome_ambiente as name,
          p.nome_pavimento as floor,
          SUM(sa.quantidade_executada) as exec,
          SUM(sa.quantidade_total_prevista) as total
        FROM ambientes a
        JOIN pavimentos p ON a.pavimento_id = p.id
        JOIN servicos_ambiente sa ON sa.ambiente_id = a.id
        GROUP BY a.id, a.nome_ambiente, p.nome_pavimento
        ORDER BY (SUM(sa.quantidade_executada) / SUM(sa.quantidade_total_prevista)) DESC
        LIMIT 10
      `);

      res.json({
        sectors: sectorProgress.map((s: any, index: number) => {
          const percent = s.total > 0 ? Math.round((s.exec / s.total) * 100) : 0;
          // Simulated expected progress: base 50% +/- some variation based on index
          const expected = 40 + (index * 7) % 40;
          let status = 'Dentro do esperado';
          if (percent < expected - 10) status = 'Atrasado';
          else if (percent > expected + 10) status = 'Adiantado';
          
          return {
            name: s.name,
            percent,
            expected,
            status
          };
        }),
        environments: envProgress.map((e: any, index: number) => {
          const percent = e.total > 0 ? Math.round((e.exec / e.total) * 100) : 0;
          const expected = 30 + (index * 11) % 50;
          let status = 'Dentro do esperado';
          if (percent < expected - 15) status = 'Atrasado';
          else if (percent > expected + 15) status = 'Adiantado';

          return {
            name: `${e.name} (${e.floor})`,
            percent,
            expected,
            status
          };
        })
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar detalhes de progresso" });
    }
  });

  // --- NUCLEO 2: PARAMETROS CONSTRUTIVOS ---
  app.post("/api/copy/floors", requireAdmin, async (req, res) => {
    const { fromSectorId, toSectorId } = req.body;
    try {
      const floors = await db.query("SELECT * FROM pavimentos WHERE setor_id = ?", [fromSectorId]);
      for (const floor of floors) {
        const newFloor = await db.run("INSERT INTO pavimentos (setor_id, nome_pavimento, descricao) VALUES (?, ?, ?)", 
          [toSectorId, floor.nome_pavimento + " (Cópia)", floor.descricao]);
        
        const environments = await db.query("SELECT * FROM ambientes WHERE pavimento_id = ?", [floor.id]);
        for (const env of environments) {
          const newEnv = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [toSectorId, newFloor.lastInsertRowid, env.nome_ambiente, env.tipo_ambiente, env.area_total, env.piso, env.parede, env.teto, env.esquadrias, env.metais, env.loucas, env.descricao]);
          
          const services = await db.query("SELECT * FROM servicos_ambiente WHERE ambiente_id = ?", [env.id]);
          for (const srv of services) {
            await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_executada, quantidade_restante) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [newEnv.lastInsertRowid, srv.nome_servico, srv.grupo_servico, srv.unidade_medida, srv.quantidade_total_prevista, 0, srv.quantidade_total_prevista]);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao copiar pavimentos" });
    }
  });

  app.post("/api/copy/environments", requireAdmin, async (req, res) => {
    const { fromFloorId, toFloorId, toSectorId } = req.body;
    try {
      const environments = await db.query("SELECT * FROM ambientes WHERE pavimento_id = ?", [fromFloorId]);
      for (const env of environments) {
        const newEnv = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [toSectorId, toFloorId, env.nome_ambiente + " (Cópia)", env.tipo_ambiente, env.area_total, env.piso, env.parede, env.teto, env.esquadrias, env.metais, env.loucas, env.descricao]);
        
        const services = await db.query("SELECT * FROM servicos_ambiente WHERE ambiente_id = ?", [env.id]);
        for (const srv of services) {
          await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_executada, quantidade_restante) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [newEnv.lastInsertRowid, srv.nome_servico, srv.grupo_servico, srv.unidade_medida, srv.quantidade_total_prevista, 0, srv.quantidade_total_prevista]);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao copiar ambientes" });
    }
  });

  app.post("/api/copy/services", requireAdmin, async (req, res) => {
    const { fromEnvId, toEnvId } = req.body;
    try {
      const services = await db.query("SELECT * FROM servicos_ambiente WHERE ambiente_id = ?", [fromEnvId]);
      for (const srv of services) {
        await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_executada, quantidade_restante) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [toEnvId, srv.nome_servico, srv.grupo_servico, srv.unidade_medida, srv.quantidade_total_prevista, 0, srv.quantidade_total_prevista]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao copiar serviços" });
    }
  });

  app.post("/api/copy/single-service", requireAdmin, async (req, res) => {
    const { fromServiceId, toEnvId } = req.body;
    try {
      const srv = await db.queryOne("SELECT * FROM servicos_ambiente WHERE id = ?", [fromServiceId]);
      if (srv) {
        await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_executada, quantidade_restante) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [toEnvId, srv.nome_servico, srv.grupo_servico, srv.unidade_medida, srv.quantidade_total_prevista, 0, srv.quantidade_total_prevista]);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Serviço não encontrado" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao copiar serviço" });
    }
  });

  app.get("/api/setores", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const sortField = req.query.sortField as string || 'ordem';
    const sortOrder = req.query.sortOrder as string || 'ASC';
    
    const validFields = ['nome_setor', 'ordem', 'data_criacao'];
    const field = validFields.includes(sortField) ? sortField : 'ordem';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const data = await db.query(`SELECT * FROM setores ORDER BY ${field} ${order}, nome_setor ASC LIMIT ? OFFSET ?`, [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM setores");
    res.json({ data, total: parseInt(total.count), page, limit });
  });
  app.get("/api/setores/:id", async (req, res) => {
    const data = await db.queryOne("SELECT * FROM setores WHERE id = ?", [req.params.id]);
    if (data) res.json(data);
    else res.status(404).json({ error: "Setor não encontrado" });
  });
  app.post("/api/setores", requireAdmin, async (req, res) => {
    const { nome_setor, descricao } = req.body;
    const info = await db.run("INSERT INTO setores (nome_setor, descricao) VALUES (?, ?)", [nome_setor, descricao]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/setores/:id", requireAdmin, async (req, res) => {
    const { nome_setor, descricao } = req.body;
    await db.run("UPDATE setores SET nome_setor = ?, descricao = ? WHERE id = ?", [nome_setor, descricao, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/setores/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("DELETE FROM setores WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: "Não é possível excluir este setor pois existem pavimentos vinculados a ele." });
    }
  });

  app.get("/api/tipos-ambiente", async (req, res) => {
    const data = await db.query("SELECT * FROM tipos_ambiente ORDER BY nome");
    res.json(data);
  });

  app.post("/api/tipos-ambiente", requireAdmin, async (req, res) => {
    const { nome, descricao, icone } = req.body;
    const info = await db.run("INSERT INTO tipos_ambiente (nome, descricao, icone) VALUES (?, ?, ?)", [nome, descricao, icone]);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/tipos-ambiente/:id", requireAdmin, async (req, res) => {
    const { nome, descricao, icone } = req.body;
    await db.run("UPDATE tipos_ambiente SET nome = ?, descricao = ?, icone = ? WHERE id = ?", [nome, descricao, icone, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/tipos-ambiente/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM tipos_ambiente WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/pavimentos", async (req, res) => {
    const { setor_id, sortField, sortOrder } = req.query;
    const { page, limit, offset } = getPagination(req);
    
    const field = (sortField === 'nome_pavimento' || sortField === 'ordem') ? sortField : 'ordem';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let sql = "SELECT * FROM pavimentos";
    const params: any[] = [];
    if (setor_id) { sql += " WHERE setor_id = ?"; params.push(setor_id); }
    
    const total = await db.queryOne(`SELECT COUNT(*) as count FROM (${sql}) as t`, params);
    sql += ` ORDER BY ${field} ${order}, nome_pavimento ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const data = await db.query(sql, params);
    res.json({ data, total: parseInt(total.count), page, limit });
  });
  app.get("/api/pavimentos/:id", async (req, res) => {
    const data = await db.queryOne("SELECT * FROM pavimentos WHERE id = ?", [req.params.id]);
    if (data) res.json(data);
    else res.status(404).json({ error: "Pavimento não encontrado" });
  });
  app.post("/api/pavimentos", requireAdmin, async (req, res) => {
    const { setor_id, nome_pavimento, descricao } = req.body;
    const info = await db.run("INSERT INTO pavimentos (setor_id, nome_pavimento, descricao) VALUES (?, ?, ?)", [setor_id, nome_pavimento, descricao]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/pavimentos/:id", requireAdmin, async (req, res) => {
    const { setor_id, nome_pavimento, descricao } = req.body;
    await db.run("UPDATE pavimentos SET setor_id = ?, nome_pavimento = ?, descricao = ? WHERE id = ?", [setor_id, nome_pavimento, descricao, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/pavimentos/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("DELETE FROM pavimentos WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: "Não é possível excluir este pavimento pois existem ambientes vinculados a ele." });
    }
  });

  app.get("/api/ambientes", async (req, res) => {
    const { pavimento_id, setor_id, sortField, sortOrder } = req.query;
    const { page, limit, offset } = getPagination(req);
    
    const field = (sortField === 'nome_ambiente' || sortField === 'ordem') ? `a.${sortField}` : 'a.ordem';
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let sql = "SELECT a.*, s.nome_setor, p.nome_pavimento FROM ambientes a JOIN setores s ON a.setor_id = s.id JOIN pavimentos p ON a.pavimento_id = p.id WHERE 1=1";
    const params: any[] = [];
    if (pavimento_id) { sql += " AND a.pavimento_id = ?"; params.push(pavimento_id); }
    if (setor_id) { sql += " AND a.setor_id = ?"; params.push(setor_id); }
    
    const total = await db.queryOne(`SELECT COUNT(*) as count FROM (${sql}) as t`, params);
    sql += ` ORDER BY ${field} ${order}, a.nome_ambiente ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const data = await db.query(sql, params);
    res.json({ data, total: parseInt(total.count), page, limit });
  });
  app.get("/api/ambientes/:id", async (req, res) => {
    const data = await db.queryOne("SELECT a.*, s.nome_setor, p.nome_pavimento FROM ambientes a JOIN setores s ON a.setor_id = s.id JOIN pavimentos p ON a.pavimento_id = p.id WHERE a.id = ?", [req.params.id]);
    if (data) res.json(data);
    else res.status(404).json({ error: "Ambiente não encontrado" });
  });
  app.post("/api/ambientes", requireAdmin, async (req, res) => {
    const { setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao, servicos_ids } = req.body;
    const info = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao]);
    
    const ambienteId = info.lastInsertRowid;

    if (servicos_ids && Array.isArray(servicos_ids)) {
      for (const srvId of servicos_ids) {
        const srvDef = await db.queryOne("SELECT * FROM parametros_servico_itens WHERE id = ?", [srvId]);
        if (srvDef) {
          await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, unidade_medida, quantidade_total_prevista, quantidade_restante, valor_parametro, produtividade) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [ambienteId, srvDef.nome, srvDef.unidade_medida, area_total || 0, area_total || 0, srvDef.valor_parametro, srvDef.quantidade_produtividade]);
        }
      }
    }

    res.json({ id: ambienteId });
  });
  app.put("/api/ambientes/:id", requireAdmin, async (req, res) => {
    const { setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao, servicos_ids } = req.body;
    await db.run("UPDATE ambientes SET setor_id = ?, pavimento_id = ?, nome_ambiente = ?, tipo_ambiente = ?, area_total = ?, piso = ?, parede = ?, teto = ?, esquadrias = ?, metais = ?, loucas = ?, descricao = ? WHERE id = ?", 
      [setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, piso, parede, teto, esquadrias, metais, loucas, descricao, req.params.id]);
    
    if (servicos_ids && Array.isArray(servicos_ids)) {
      // Get current services
      const currentServices = await db.query("SELECT id, nome_servico, quantidade_executada FROM servicos_ambiente WHERE ambiente_id = ?", [req.params.id]);
      
      // Get new service definitions
      const newServiceDefs = [];
      for (const srvId of servicos_ids) {
        const srvDef = await db.queryOne("SELECT * FROM parametros_servico_itens WHERE id = ?", [srvId]);
        if (srvDef) newServiceDefs.push(srvDef);
      }

      const newServiceNames = newServiceDefs.map(s => s.nome);

      // Remove services not in the new list (only if not executed)
      for (const current of currentServices) {
        if (!newServiceNames.includes(current.nome_servico)) {
          if (current.quantidade_executada === 0) {
            await db.run("DELETE FROM servicos_ambiente WHERE id = ?", [current.id]);
          }
        }
      }

      // Add new services
      for (const srvDef of newServiceDefs) {
        const exists = currentServices.find(s => s.nome_servico === srvDef.nome);
        if (!exists) {
          await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, unidade_medida, quantidade_total_prevista, quantidade_restante, valor_parametro, produtividade) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [req.params.id, srvDef.nome, srvDef.unidade_medida, area_total || 0, area_total || 0, srvDef.valor_parametro, srvDef.quantidade_produtividade]);
        }
      }
    }

    res.json({ success: true });
  });
  app.delete("/api/ambientes/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("DELETE FROM ambientes WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: "Não é possível excluir este ambiente pois existem serviços vinculados a ele." });
    }
  });

  app.post("/api/reorder/:type", requireAdmin, async (req, res) => {
    const { type } = req.params;
    const { orders } = req.body; // Array of { id, ordem }
    
    const tableMap: Record<string, string> = {
      sector: 'setores',
      floor: 'pavimentos',
      env: 'ambientes'
    };
    
    const table = tableMap[type];
    if (!table) return res.status(400).json({ error: "Tipo inválido" });
    
    try {
      for (const item of orders) {
        await db.run(`UPDATE ${table} SET ordem = ? WHERE id = ?`, [item.ordem, item.id]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao reordenar" });
    }
  });

  app.post("/api/construction/import", requireAdmin, async (req, res) => {
    const { data } = req.body;
    let count = 0;
    
    try {
      for (const row of data) {
        const sectorName = row['Setor'] || row['setor'];
        const floorName = row['Pavimento'] || row['pavimento'];
        const envName = row['Ambiente'] || row['ambiente'];
        const envType = row['Tipo'] || row['tipo'] || 'SALA';
        const areaPiso = parseFloat(row['Área Piso'] || row['area_piso'] || 0);
        const areaTeto = row['Área Teto'] || row['area_teto'] || '';
        const areaParede = row['Área Parede'] || row['Área Alvenaria'] || row['area_parede'] || '';
        const descricao = row['Descrição'] || row['descricao'] || '';

        if (!sectorName || !floorName || !envName) continue;

        // 1. Find or create Sector
        let sector = await db.queryOne("SELECT id FROM setores WHERE nome_setor = ?", [sectorName]);
        let sectorId;
        if (!sector) {
          const info = await db.run("INSERT INTO setores (nome_setor) VALUES (?)", [sectorName]);
          sectorId = info.lastInsertRowid;
        } else {
          sectorId = sector.id;
        }

        // 2. Find or create Floor
        let floor = await db.queryOne("SELECT id FROM pavimentos WHERE setor_id = ? AND nome_pavimento = ?", [sectorId, floorName]);
        let floorId;
        if (!floor) {
          const info = await db.run("INSERT INTO pavimentos (setor_id, nome_pavimento) VALUES (?, ?)", [sectorId, floorName]);
          floorId = info.lastInsertRowid;
        } else {
          floorId = floor.id;
        }

        // 3. Create Environment
        await db.run(
          "INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, teto, parede, descricao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [sectorId, floorId, envName, envType, areaPiso, areaTeto, areaParede, descricao]
        );
        count++;
      }
      res.json({ count });
    } catch (error: any) {
      console.error("Erro na importação de parâmetros:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/servicos-ambiente", async (req, res) => {
    const { ambiente_id } = req.query;
    const { page, limit, offset } = getPagination(req);
    const data = await db.query("SELECT * FROM servicos_ambiente WHERE ambiente_id = ? LIMIT ? OFFSET ?", [ambiente_id, limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM servicos_ambiente WHERE ambiente_id = ?", [ambiente_id]);
    res.json({ data, total: parseInt(total.count), page, limit });
  });

  app.get("/api/servicos-ambiente/:id/materiais", async (req, res) => {
    const service = await db.queryOne("SELECT * FROM servicos_ambiente WHERE id = ?", [req.params.id]);
    if (!service) return res.status(404).json({ error: "Serviço não encontrado" });

    const activity = await db.queryOne("SELECT * FROM atividades WHERE nome_atividade = ?", [service.nome_servico]);
    if (!activity) return res.json([]);

    const composition = await db.query("SELECT * FROM composicao_atividade WHERE atividade_id = ?", [activity.id]);
    
    const materials = await Promise.all(composition.map(async (item: any) => {
      const stock = await db.queryOne("SELECT quantidade_atual, quantidade_minima FROM estoque WHERE descricao = ?", [item.descricao]);
      return {
        ...item,
        quantidade_total: item.quantidade * service.quantidade_total_prevista,
        estoque_atual: stock ? stock.quantidade_atual : 0,
        estoque_minimo: stock ? stock.quantidade_minima : 0
      };
    }));

    res.json(materials);
  });
  app.post("/api/servicos-ambiente", requireAdmin, async (req, res) => {
    const { ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, descricao } = req.body;
    const info = await db.run("INSERT INTO servicos_ambiente (ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_restante, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      [ambiente_id, nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, quantidade_total_prevista, descricao]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/servicos-ambiente/:id", requireAdmin, async (req, res) => {
    const { nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, descricao } = req.body;
    // We need to recalculate restante
    const srv = await db.queryOne("SELECT * FROM servicos_ambiente WHERE id = ?", [req.params.id]);
    if (srv) {
      const newRest = quantidade_total_prevista - srv.quantidade_executada;
      await db.run("UPDATE servicos_ambiente SET nome_servico = ?, grupo_servico = ?, unidade_medida = ?, quantidade_total_prevista = ?, quantidade_restante = ?, descricao = ? WHERE id = ?", 
        [nome_servico, grupo_servico, unidade_medida, quantidade_total_prevista, newRest, descricao, req.params.id]);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Serviço não encontrado" });
    }
  });
  app.delete("/api/servicos-ambiente/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM servicos_ambiente WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // --- NUCLEO 3: PARÂMETROS DE SERVIÇO ---
  app.get("/api/parametros-servico", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const sql = `
      SELECT * FROM parametros_servico 
      ORDER BY codigo ASC 
      LIMIT ? OFFSET ?
    `;
    const data = await db.query(sql, [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM parametros_servico");
    res.json({ data, total: parseInt(total.count), page, limit });
  });

  app.get("/api/parametros-servico/next-code", async (req, res) => {
    const last = await db.queryOne("SELECT MAX(codigo) as lastCode FROM parametros_servico");
    const nextCode = (last?.lastCode || 0) + 1;
    res.json({ nextCode });
  });

  app.post("/api/parametros-servico", requireAdmin, async (req, res) => {
    const { codigo, nome, unidade_medida, produtividade, produtividade_media, unidade_tempo, grupo_id, etapa_id } = req.body;
    try {
      const info = await db.run(
        "INSERT INTO parametros_servico (codigo, nome, unidade_medida, produtividade, produtividade_media, unidade_tempo) VALUES (?, ?, ?, ?, ?, ?)",
        [codigo, nome, unidade_medida, produtividade, produtividade_media, unidade_tempo || 'DIA']
      );
      const atividadeId = info.lastInsertRowid;

      if (grupo_id) {
        await db.run("INSERT INTO grupos_servico_atividades (grupo_id, atividade_id) VALUES (?, ?)", [grupo_id, atividadeId]);
        
        if (etapa_id) {
          const exists = await db.queryOne("SELECT id FROM etapas_servico_grupos WHERE etapa_id = ? AND grupo_id = ?", [etapa_id, grupo_id]);
          if (!exists) {
            await db.run("INSERT INTO etapas_servico_grupos (etapa_id, grupo_id) VALUES (?, ?)", [etapa_id, grupo_id]);
          }
        }
      }

      res.json({ id: atividadeId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/parametros-servico/:id", requireAdmin, async (req, res) => {
    const { codigo, nome, unidade_medida, produtividade, produtividade_media, unidade_tempo } = req.body;
    try {
      await db.run(
        "UPDATE parametros_servico SET codigo = ?, nome = ?, unidade_medida = ?, produtividade = ?, produtividade_media = ?, unidade_tempo = ? WHERE id = ?",
        [codigo, nome, unidade_medida, produtividade, produtividade_media, unidade_tempo, req.params.id]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/parametros-servico/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM parametros_servico WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Parametros Servico Itens
  app.get("/api/all-parametros-servico-itens", async (req, res) => {
    const data = await db.query("SELECT * FROM parametros_servico_itens ORDER BY nome ASC");
    res.json(data);
  });

  app.get("/api/parametros-servico/:id/itens", async (req, res) => {
    const data = await db.query("SELECT * FROM parametros_servico_itens WHERE parametro_id = ?", [req.params.id]);
    res.json(data);
  });

  app.post("/api/parametros-servico/:id/itens", requireAdmin, async (req, res) => {
    const { nome, unidade_medida, quantidade_produtividade, unidade_tempo, valor_parametro } = req.body;
    await db.run("INSERT INTO parametros_servico_itens (parametro_id, nome, unidade_medida, quantidade_produtividade, unidade_tempo, valor_parametro) VALUES (?, ?, ?, ?, ?, ?)", 
      [req.params.id, nome, unidade_medida, quantidade_produtividade, unidade_tempo, valor_parametro]);
    res.json({ success: true });
  });

  app.put("/api/parametros-servico-itens/:id", requireAdmin, async (req, res) => {
    const { nome, unidade_medida, quantidade_produtividade, unidade_tempo, valor_parametro } = req.body;
    await db.run("UPDATE parametros_servico_itens SET nome = ?, unidade_medida = ?, quantidade_produtividade = ?, unidade_tempo = ?, valor_parametro = ? WHERE id = ?", 
      [nome, unidade_medida, quantidade_produtividade, unidade_tempo, valor_parametro, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/parametros-servico-itens/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM parametros_servico_itens WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // --- GRUPOS DE SERVIÇO ---
  app.get("/api/grupos-servico", async (req, res) => {
    const groupConcat = effectivePostgres ? "string_agg(p.nome, ',')" : "GROUP_CONCAT(p.nome)";
    const groupConcatIds = effectivePostgres ? "string_agg(CAST(p.id AS TEXT), ',')" : "GROUP_CONCAT(p.id)";
    const data = await db.query(`
      SELECT g.*, 
             ${groupConcat} as atividades_nomes, 
             ${groupConcatIds} as atividades_ids,
             (SELECT etapa_id FROM etapas_servico_grupos WHERE grupo_id = g.id LIMIT 1) as etapa_id
      FROM grupos_servico g
      LEFT JOIN grupos_servico_atividades ga ON g.id = ga.grupo_id
      LEFT JOIN parametros_servico p ON ga.atividade_id = p.id
      GROUP BY g.id, g.codigo, g.nome, g.created_at
      ORDER BY g.codigo ASC, g.nome ASC
    `);
    res.json(data);
  });

  app.post("/api/grupos-servico", requireAdmin, async (req, res) => {
    const { codigo, nome, atividades_ids, etapa_id } = req.body;
    const userEmail = req.headers['x-user-email'] || 'Sistema';
    try {
      const info = await db.run("INSERT INTO grupos_servico (codigo, nome) VALUES (?, ?)", [codigo, nome]);
      const grupoId = info.lastInsertRowid;
      if (atividades_ids && Array.isArray(atividades_ids)) {
        for (const atId of atividades_ids) {
          await db.run("INSERT INTO grupos_servico_atividades (grupo_id, atividade_id) VALUES (?, ?)", [grupoId, atId]);
        }
      }

      if (etapa_id) {
        await db.run("INSERT INTO etapas_servico_grupos (etapa_id, grupo_id) VALUES (?, ?)", [etapa_id, grupoId]);
      }

      await db.run(
        "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
        ['GRUPO', grupoId, codigo, nome, 'Criação de novo grupo', userEmail]
      );

      res.json({ id: grupoId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/grupos-servico/:id", requireAdmin, async (req, res) => {
    const { codigo, nome, atividades_ids, etapa_id } = req.body;
    const userEmail = req.headers['x-user-email'] || 'Sistema';
    try {
      await db.run("UPDATE grupos_servico SET codigo = ?, nome = ? WHERE id = ?", [codigo, nome, req.params.id]);
      await db.run("DELETE FROM grupos_servico_atividades WHERE grupo_id = ?", [req.params.id]);
      if (atividades_ids && Array.isArray(atividades_ids)) {
        for (const atId of atividades_ids) {
          await db.run("INSERT INTO grupos_servico_atividades (grupo_id, atividade_id) VALUES (?, ?)", [req.params.id, atId]);
        }
      }

      if (etapa_id) {
        await db.run("DELETE FROM etapas_servico_grupos WHERE grupo_id = ?", [req.params.id]);
        await db.run("INSERT INTO etapas_servico_grupos (etapa_id, grupo_id) VALUES (?, ?)", [etapa_id, req.params.id]);
      }

      await db.run(
        "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
        ['GRUPO', req.params.id, codigo, nome, 'Edição de grupo', userEmail]
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/grupos-servico/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userEmail = req.headers['x-user-email'] || 'Sistema';
      const item = await db.queryOne("SELECT * FROM grupos_servico WHERE id = ?", [id]);

      await db.run("DELETE FROM grupos_servico_atividades WHERE grupo_id = ?", [id]);
      await db.run("DELETE FROM grupos_servico WHERE id = ?", [id]);

      if (item) {
        await db.run(
          "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
          ['GRUPO', id, item.codigo, item.nome, 'Exclusão de grupo', userEmail]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ETAPAS DE SERVIÇO ---
  app.get("/api/etapas-servico", async (req, res) => {
    const groupConcat = effectivePostgres ? "string_agg(g.nome, ',')" : "GROUP_CONCAT(g.nome)";
    const groupConcatIds = effectivePostgres ? "string_agg(CAST(g.id AS TEXT), ',')" : "GROUP_CONCAT(g.id)";
    const data = await db.query(`
      SELECT e.*, ${groupConcat} as grupos_nomes, ${groupConcatIds} as grupos_ids
      FROM etapas_servico e
      LEFT JOIN etapas_servico_grupos eg ON e.id = eg.etapa_id
      LEFT JOIN grupos_servico g ON eg.grupo_id = g.id
      GROUP BY e.id, e.codigo, e.nome, e.created_at
      ORDER BY e.codigo ASC, e.nome ASC
    `);
    res.json(data);
  });

  app.post("/api/etapas-servico", requireAdmin, async (req, res) => {
    const { codigo, nome, grupos_ids } = req.body;
    const userEmail = req.headers['x-user-email'] || 'Sistema';
    try {
      const info = await db.run("INSERT INTO etapas_servico (codigo, nome) VALUES (?, ?)", [codigo, nome]);
      const etapaId = info.lastInsertRowid;
      if (grupos_ids && Array.isArray(grupos_ids)) {
        for (const gId of grupos_ids) {
          await db.run("INSERT INTO etapas_servico_grupos (etapa_id, grupo_id) VALUES (?, ?)", [etapaId, gId]);
        }
      }

      await db.run(
        "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
        ['ETAPA', etapaId, codigo, nome, 'Criação de nova etapa', userEmail]
      );

      res.json({ id: etapaId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/etapas-servico/:id", requireAdmin, async (req, res) => {
    const { codigo, nome, grupos_ids } = req.body;
    const userEmail = req.headers['x-user-email'] || 'Sistema';
    try {
      await db.run("UPDATE etapas_servico SET codigo = ?, nome = ? WHERE id = ?", [codigo, nome, req.params.id]);
      await db.run("DELETE FROM etapas_servico_grupos WHERE etapa_id = ?", [req.params.id]);
      if (grupos_ids && Array.isArray(grupos_ids)) {
        for (const gId of grupos_ids) {
          await db.run("INSERT INTO etapas_servico_grupos (etapa_id, grupo_id) VALUES (?, ?)", [req.params.id, gId]);
        }
      }

      await db.run(
        "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
        ['ETAPA', req.params.id, codigo, nome, 'Edição de etapa', userEmail]
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/etapas-servico/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userEmail = req.headers['x-user-email'] || 'Sistema';
      const item = await db.queryOne("SELECT * FROM etapas_servico WHERE id = ?", [id]);

      await db.run("DELETE FROM etapas_servico_grupos WHERE etapa_id = ?", [id]);
      await db.run("DELETE FROM etapas_servico WHERE id = ?", [id]);

      if (item) {
        await db.run(
          "INSERT INTO historico_parametros (tipo_item, item_id, codigo, nome, descricao_alteracao, usuario_email) VALUES (?, ?, ?, ?, ?, ?)",
          ['ETAPA', id, item.codigo, item.nome, 'Exclusão de etapa', userEmail]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- HISTÓRICO DE PARÂMETROS ---
  app.get("/api/historico-parametros", async (req, res) => {
    try {
      const history = await db.query("SELECT * FROM historico_parametros ORDER BY data_alteracao DESC LIMIT 100");
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- NUCLEO 4: EXECUCAO DIARIA ---
  app.get("/api/execucao-diaria", async (req, res) => {
    const { data, funcionario_id } = req.query;
    const { page, limit, offset } = getPagination(req);
    let sql = `
      SELECT ex.*, e.name as funcionario_nome, a.nome_atividade, amb.nome_ambiente 
      FROM execucao_diaria ex
      JOIN employees e ON ex.funcionario_id = e.id
      JOIN atividades a ON ex.atividade_id = a.id
      JOIN ambientes amb ON ex.ambiente_id = amb.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (data) { sql += " AND ex.data_execucao = ?"; params.push(data); }
    if (funcionario_id) { sql += " AND ex.funcionario_id = ?"; params.push(funcionario_id); }
    
    const total = await db.queryOne(`SELECT COUNT(*) as count FROM (${sql}) as t`, params);
    sql += " ORDER BY ex.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const result = await db.query(sql, params);
    res.json({ data: result, total: parseInt(total.count), page, limit });
  });

  app.post("/api/execucao-diaria", requireAdmin, async (req, res) => {
    const { data_execucao, funcionario_id, atividade_id, ambiente_id, quantidade_executada, observacoes } = req.body;
    if (!validateDate(data_execucao)) return res.status(400).json({ error: "Formato de data inválido. Use yyyy-MM-dd." });
    
    try {
      // 1. Insert execution record
      const info = await db.run(
        "INSERT INTO execucao_diaria (data_execucao, funcionario_id, atividade_id, ambiente_id, quantidade_executada, observacoes) VALUES (?, ?, ?, ?, ?, ?)",
        [data_execucao, funcionario_id, atividade_id, ambiente_id, quantidade_executada, observacoes]
      );

      // 2. Update Construction Parameters (servicos_ambiente)
      // We look for a service in the environment that matches the activity name
      const activity = await db.queryOne("SELECT * FROM atividades WHERE id = ?", [atividade_id]);
      if (activity) {
        const service = await db.queryOne(
          "SELECT * FROM servicos_ambiente WHERE ambiente_id = ? AND nome_servico = ?",
          [ambiente_id, activity.nome_atividade]
        );
        
        if (service) {
          const newExec = service.quantidade_executada + parseFloat(quantidade_executada);
          const newRest = service.quantidade_total_prevista - newExec;
          await db.run(
            "UPDATE servicos_ambiente SET quantidade_executada = ?, quantidade_restante = ? WHERE id = ?",
            [newExec, newRest, service.id]
          );
        }
      }

      // 3. Integration with Payroll
      if (activity && ['PRODUÇÃO', 'GRATIFICAÇÃO', 'TAREFA'].includes(activity.tipo_pagamento)) {
        const amount = parseFloat(quantidade_executada) * (activity.valor_parametro || 0);
        if (amount > 0) {
          const month = data_execucao.substring(0, 7);
          const day = parseInt(data_execucao.substring(8, 10));
          const fortnight = day <= 15 ? 1 : 2;
          
          await db.run(
            "INSERT INTO payroll (employee_id, month, fortnight, type, amount, description) VALUES (?, ?, ?, ?, ?, ?)",
            [funcionario_id, month, fortnight, activity.tipo_pagamento, amount, `Produção: ${activity.nome_atividade} (${quantidade_executada} ${activity.unidade_medida})`]
          );
        }
      }

      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      console.error("Erro ao registrar execução:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/execucao-diaria/:id", requireAdmin, async (req, res) => {
    try {
      const ex = await db.queryOne("SELECT * FROM execucao_diaria WHERE id = ?", [req.params.id]);
      if (!ex) return res.status(404).json({ error: "Execução não encontrada" });

      // Revert progress
      const activity = await db.queryOne("SELECT * FROM atividades WHERE id = ?", [ex.atividade_id]);
      if (activity) {
        const service = await db.queryOne(
          "SELECT * FROM servicos_ambiente WHERE ambiente_id = ? AND nome_servico = ?",
          [ex.ambiente_id, activity.nome_atividade]
        );
        if (service) {
          const newExec = Math.max(0, service.quantidade_executada - ex.quantidade_executada);
          const newRest = service.quantidade_total_prevista - newExec;
          await db.run(
            "UPDATE servicos_ambiente SET quantidade_executada = ?, quantidade_restante = ? WHERE id = ?",
            [newExec, newRest, service.id]
          );
        }
      }

      await db.run("DELETE FROM execucao_diaria WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ESTOQUE ---
  app.get("/api/estoque", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const items = await db.query("SELECT * FROM estoque ORDER BY descricao LIMIT ? OFFSET ?", [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM estoque");
    res.json({ data: items, total: parseInt(total.count), page, limit });
  });

  app.get("/api/estoque/alertas", async (req, res) => {
    const alerts = await db.query("SELECT * FROM estoque WHERE quantidade_atual < quantidade_minima");
    res.json(alerts);
  });

  app.post("/api/estoque", requireAdmin, async (req, res) => {
    const { descricao, quantidade_atual, quantidade_minima, unidade_medida, tipo_item } = req.body;
    try {
      const info = await db.run("INSERT INTO estoque (descricao, quantidade_atual, quantidade_minima, unidade_medida, tipo_item) VALUES (?, ?, ?, ?, ?)",
        [descricao, quantidade_atual, quantidade_minima, unidade_medida, tipo_item]);
      res.json({ id: info.lastInsertRowid });
    } catch (e) { res.status(400).json({ error: "Item já existe ou erro no cadastro" }); }
  });

  app.put("/api/estoque/:id", requireAdmin, async (req, res) => {
    const { descricao, quantidade_atual, quantidade_minima, unidade_medida, tipo_item } = req.body;
    await db.run("UPDATE estoque SET descricao = ?, quantidade_atual = ?, quantidade_minima = ?, unidade_medida = ?, tipo_item = ? WHERE id = ?",
      [descricao, quantidade_atual, quantidade_minima, unidade_medida, tipo_item, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/estoque/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM estoque WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // --- CHECKLIST ---
  app.get("/api/checklists", async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const items = await db.query("SELECT * FROM checklists ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
    const total = await db.queryOne("SELECT COUNT(*) as count FROM checklists");
    res.json({ data: items, total: parseInt(total.count), page, limit });
  });

  app.post("/api/checklists", async (req, res) => {
    const { task, category } = req.body;
    const info = await db.run("INSERT INTO checklists (task, category) VALUES (?, ?)", [task, category]);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/checklists/:id", async (req, res) => {
    const { status } = req.body;
    await db.run("UPDATE checklists SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/checklists/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM checklists WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(3000, "0.0.0.0", () => console.log(`Server running on port 3000`));
}

startServer();
