import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { google } from "googleapis";
import fs from "fs";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL && DATABASE_URL.startsWith('postgres');
let sqliteDb: any = null;
let pgPool: Pool | null = null;
let dbStatus = "SQLite (Local/Temporário)";

if (isPostgres) {
  pgPool = new Pool({
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
    client.release();
  } catch (err: any) {
    console.error("❌ ERRO CRÍTICO NO POSTGRESQL:", err.message);
    console.log("⚠️ O sistema tentará usar SQLite como fallback de emergência, mas os dados não serão salvos no Supabase.");
    isPostgres = false; // Fallback to sqlite if connection fails
  }
}

if (!isPostgres) {
  sqliteDb = new Database("obra_control.db");
  console.log("ℹ️ DATABASE: Usando SQLite (Local). Para persistência real, configure DATABASE_URL.");
}

// Unified Database Interface
const db = {
  async exec(sql: string) {
    if (isPostgres) {
      await pgPool!.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },
  async query(sql: string, params: any[] = []) {
    if (isPostgres) {
      // Convert ? to $1, $2, etc for Postgres
      let count = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++count}`);
      const result = await pgPool!.query(pgSql, params);
      return result.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },
  async queryOne(sql: string, params: any[] = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  },
  async run(sql: string, params: any[] = []) {
    if (isPostgres) {
      let count = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++count}`);
      const result = await pgPool!.query(pgSql, params);
      return { lastInsertRowid: (result as any).rows[0]?.id || null };
    } else {
      const info = sqliteDb.prepare(sql).run(...params);
      return { lastInsertRowid: info.lastInsertRowid };
    }
  },
  // Special helper for SQLite backup which doesn't exist in PG
  async backup(path: string) {
    if (!isPostgres) {
      await sqliteDb.backup(path);
    } else {
      throw new Error("Backup not supported on PostgreSQL via this method");
    }
  }
};

// Initialize Database Schema
async function initDb() {
  const autoIncrement = isPostgres ? "SERIAL" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const pk = isPostgres ? "PRIMARY KEY" : "";
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
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
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pavimentos (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      setor_id INTEGER REFERENCES setores(id),
      nome_pavimento TEXT NOT NULL,
      descricao TEXT
    );

    CREATE TABLE IF NOT EXISTS ambientes (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      setor_id INTEGER REFERENCES setores(id),
      pavimento_id INTEGER REFERENCES pavimentos(id),
      nome_ambiente TEXT NOT NULL,
      tipo_ambiente TEXT NOT NULL, -- SALA, AREA TECNICA, AREA COMUM, MACRO
      area_total REAL,
      descricao TEXT
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
      descricao TEXT
    );

    -- Nucleo 3: Atividades
    CREATE TABLE IF NOT EXISTS grupos_atividade (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      nome_grupo TEXT NOT NULL,
      descricao TEXT
    );

    CREATE TABLE IF NOT EXISTS atividades (
      id ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
      grupo_atividade_id INTEGER REFERENCES grupos_atividade(id),
      nome_atividade TEXT NOT NULL,
      unidade_medida TEXT,
      prazo_execucao INTEGER, -- em dias
      produtividade_profissional REAL, -- qtd por dia por profissional
      valor_parametro REAL, -- valor pago por unidade (para folha)
      tipo_pagamento TEXT, -- PRODUÇÃO, GRATIFICAÇÃO, TAREFA
      descricao TEXT,
      quantidade_padrao REAL DEFAULT 1
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
  `);

  // Migrations
  try { await db.exec("ALTER TABLE employees ADD COLUMN code TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN document TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN phone TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN is_registered INTEGER DEFAULT 1;"); } catch(e) {}
  try { await db.exec("ALTER TABLE employees ADD COLUMN photo TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE servicos_ambiente ADD COLUMN descricao TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN descricao TEXT;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN quantidade_padrao REAL DEFAULT 1;"); } catch(e) {}
  try { await db.exec("ALTER TABLE atividades ADD COLUMN status TEXT DEFAULT 'Ativo';"); } catch(e) {}

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
    const users = await db.query("SELECT id, username, role, name, created_at FROM users");
    res.json(users);
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
    const roles = await db.query("SELECT * FROM job_roles ORDER BY name");
    res.json(roles);
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
    await db.run("DELETE FROM job_roles WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    const employees = await db.query("SELECT * FROM employees ORDER BY name");
    res.json(employees);
  });

  app.post("/api/employees", requireAdmin, async (req, res) => {
    const { code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo } = req.body;
    const info = await db.run("INSERT INTO employees (code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, photo]);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/employees/:id", requireAdmin, async (req, res) => {
    const { code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, status, resignation_date, photo } = req.body;
    await db.run("UPDATE employees SET code = ?, name = ?, role = ?, document = ?, phone = ?, is_registered = ?, base_salary = ?, admission_date = ?, bank_name = ?, bank_agency = ?, bank_operation = ?, bank_account = ?, bank_observations = ?, vacation_preview = ?, status = ?, resignation_date = ?, photo = ? WHERE id = ?",
      [code, name, role, document, phone, is_registered, base_salary, admission_date, bank_name, bank_agency, bank_operation, bank_account, bank_observations, vacation_preview, status, resignation_date, photo, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/employees/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM employees WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Frequency
  app.get("/api/frequency", async (req, res) => {
    const { start, end, employee_id, role } = req.query;
    let query = "SELECT f.*, e.name as employee_name FROM frequency f JOIN employees e ON f.employee_id = e.id WHERE 1=1";
    const params: any[] = [];
    if (start) { query += " AND date >= ?"; params.push(start); }
    if (end) { query += " AND date <= ?"; params.push(end); }
    if (employee_id) { query += " AND employee_id = ?"; params.push(employee_id); }
    if (role) { query += " AND e.role = ?"; params.push(role); }
    query += " ORDER BY date DESC, e.name ASC";
    const data = await db.query(query, params);
    res.json(data);
  });

  app.post("/api/frequency", requireAdmin, async (req, res) => {
    const { employee_id, date, status, atestato_days, observations } = req.body;
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
    let query = "SELECT p.*, e.name as employee_name FROM payroll p JOIN employees e ON p.employee_id = e.id WHERE 1=1";
    const params: any[] = [];
    if (month) { query += " AND month = ?"; params.push(month); }
    if (employee_id) { query += " AND employee_id = ?"; params.push(employee_id); }
    const data = await db.query(query, params);
    res.json(data);
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
        sectors: sectorProgress.map((s: any) => ({
          name: s.name,
          percent: s.total > 0 ? Math.round((s.exec / s.total) * 100) : 0
        })),
        environments: envProgress.map((e: any) => ({
          name: `${e.name} (${e.floor})`,
          percent: e.total > 0 ? Math.round((e.exec / e.total) * 100) : 0
        }))
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
          const newEnv = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao) VALUES (?, ?, ?, ?, ?, ?)",
            [toSectorId, newFloor.lastInsertRowid, env.nome_ambiente, env.tipo_ambiente, env.area_total, env.descricao]);
          
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
        const newEnv = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao) VALUES (?, ?, ?, ?, ?, ?)",
          [toSectorId, toFloorId, env.nome_ambiente + " (Cópia)", env.tipo_ambiente, env.area_total, env.descricao]);
        
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
    const data = await db.query("SELECT * FROM setores ORDER BY nome_setor");
    res.json(data);
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
    await db.run("DELETE FROM setores WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/pavimentos", async (req, res) => {
    const { setor_id } = req.query;
    let sql = "SELECT * FROM pavimentos";
    const params = [];
    if (setor_id) { sql += " WHERE setor_id = ?"; params.push(setor_id); }
    const data = await db.query(sql, params);
    res.json(data);
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
    await db.run("DELETE FROM pavimentos WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/ambientes", async (req, res) => {
    const { pavimento_id, setor_id } = req.query;
    let sql = "SELECT a.*, s.nome_setor, p.nome_pavimento FROM ambientes a JOIN setores s ON a.setor_id = s.id JOIN pavimentos p ON a.pavimento_id = p.id WHERE 1=1";
    const params = [];
    if (pavimento_id) { sql += " AND a.pavimento_id = ?"; params.push(pavimento_id); }
    if (setor_id) { sql += " AND a.setor_id = ?"; params.push(setor_id); }
    const data = await db.query(sql, params);
    res.json(data);
  });
  app.post("/api/ambientes", requireAdmin, async (req, res) => {
    const { setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao } = req.body;
    const info = await db.run("INSERT INTO ambientes (setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao) VALUES (?, ?, ?, ?, ?, ?)", 
      [setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/ambientes/:id", requireAdmin, async (req, res) => {
    const { setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao } = req.body;
    await db.run("UPDATE ambientes SET setor_id = ?, pavimento_id = ?, nome_ambiente = ?, tipo_ambiente = ?, area_total = ?, descricao = ? WHERE id = ?", 
      [setor_id, pavimento_id, nome_ambiente, tipo_ambiente, area_total, descricao, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/ambientes/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM ambientes WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/servicos-ambiente", async (req, res) => {
    const { ambiente_id } = req.query;
    const data = await db.query("SELECT * FROM servicos_ambiente WHERE ambiente_id = ?", [ambiente_id]);
    res.json(data);
  });

  app.get("/api/servicos-ambiente/:id/materiais", async (req, res) => {
    const service = await db.queryOne("SELECT * FROM servicos_ambiente WHERE id = ?", [req.params.id]);
    if (!service) return res.status(404).json({ error: "Serviço não encontrado" });

    const activity = await db.queryOne("SELECT * FROM atividades WHERE nome_atividade = ?", [service.nome_servico]);
    if (!activity) return res.json([]);

    const composition = await db.query("SELECT * FROM composicao_atividade WHERE atividade_id = ?", [activity.id]);
    
    const materials = composition.map((item: any) => ({
      ...item,
      quantidade_total: item.quantidade * service.quantidade_total_prevista
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

  // --- NUCLEO 3: ATIVIDADES ---
  app.get("/api/grupos-atividade", async (req, res) => {
    const data = await db.query("SELECT * FROM grupos_atividade ORDER BY nome_grupo");
    res.json(data);
  });
  app.post("/api/grupos-atividade", requireAdmin, async (req, res) => {
    const { nome_grupo, descricao } = req.body;
    const info = await db.run("INSERT INTO grupos_atividade (nome_grupo, descricao) VALUES (?, ?)", [nome_grupo, descricao]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/grupos-atividade/:id", requireAdmin, async (req, res) => {
    const { nome_grupo, descricao } = req.body;
    await db.run("UPDATE grupos_atividade SET nome_grupo = ?, descricao = ? WHERE id = ?", [nome_grupo, descricao, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/grupos-atividade/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM grupos_atividade WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/atividades", async (req, res) => {
    const { grupo_id, status, prazo_max } = req.query;
    let sql = "SELECT a.*, g.nome_grupo FROM atividades a JOIN grupos_atividade g ON a.grupo_atividade_id = g.id WHERE 1=1";
    const params = [];
    if (grupo_id) { sql += " AND a.grupo_atividade_id = ?"; params.push(grupo_id); }
    if (status) { sql += " AND a.status = ?"; params.push(status); }
    if (prazo_max) { sql += " AND a.prazo_execucao <= ?"; params.push(prazo_max); }
    sql += " ORDER BY a.nome_atividade";
    const data = await db.query(sql, params);
    res.json(data);
  });
  app.post("/api/atividades", requireAdmin, async (req, res) => {
    const { grupo_atividade_id, nome_atividade, unidade_medida, prazo_execucao, produtividade_profissional, valor_parametro, tipo_pagamento, descricao, quantidade_padrao, status } = req.body;
    const info = await db.run("INSERT INTO atividades (grupo_atividade_id, nome_atividade, unidade_medida, prazo_execucao, produtividade_profissional, valor_parametro, tipo_pagamento, descricao, quantidade_padrao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [grupo_atividade_id, nome_atividade, unidade_medida, prazo_execucao, produtividade_profissional, valor_parametro, tipo_pagamento, descricao, quantidade_padrao || 1, status || 'Ativo']);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/atividades/:id", requireAdmin, async (req, res) => {
    const { grupo_atividade_id, nome_atividade, unidade_medida, prazo_execucao, produtividade_profissional, valor_parametro, tipo_pagamento, descricao, quantidade_padrao, status } = req.body;
    await db.run("UPDATE atividades SET grupo_atividade_id = ?, nome_atividade = ?, unidade_medida = ?, prazo_execucao = ?, produtividade_profissional = ?, valor_parametro = ?, tipo_pagamento = ?, descricao = ?, quantidade_padrao = ?, status = ? WHERE id = ?", 
      [grupo_atividade_id, nome_atividade, unidade_medida, prazo_execucao, produtividade_profissional, valor_parametro, tipo_pagamento, descricao, quantidade_padrao, status, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/atividades/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM atividades WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.get("/api/composicao-atividade", async (req, res) => {
    const { atividade_id } = req.query;
    const data = await db.query("SELECT * FROM composicao_atividade WHERE atividade_id = ?", [atividade_id]);
    res.json(data);
  });
  app.post("/api/composicao-atividade", requireAdmin, async (req, res) => {
    const { atividade_id, tipo_item, descricao, quantidade, unidade_medida } = req.body;
    const info = await db.run("INSERT INTO composicao_atividade (atividade_id, tipo_item, descricao, quantidade, unidade_medida) VALUES (?, ?, ?, ?, ?)", 
      [atividade_id, tipo_item, descricao, quantidade, unidade_medida]);
    res.json({ id: info.lastInsertRowid });
  });
  app.put("/api/composicao-atividade/:id", requireAdmin, async (req, res) => {
    const { tipo_item, descricao, quantidade, unidade_medida } = req.body;
    await db.run("UPDATE composicao_atividade SET tipo_item = ?, descricao = ?, quantidade = ?, unidade_medida = ? WHERE id = ?", 
      [tipo_item, descricao, quantidade, unidade_medida, req.params.id]);
    res.json({ success: true });
  });
  app.delete("/api/composicao-atividade/:id", requireAdmin, async (req, res) => {
    await db.run("DELETE FROM composicao_atividade WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // --- NUCLEO 4: EXECUCAO DIARIA ---
  app.get("/api/execucao-diaria", async (req, res) => {
    const { data, funcionario_id } = req.query;
    let sql = `
      SELECT ex.*, e.name as funcionario_nome, a.nome_atividade, amb.nome_ambiente 
      FROM execucao_diaria ex
      JOIN employees e ON ex.funcionario_id = e.id
      JOIN atividades a ON ex.atividade_id = a.id
      JOIN ambientes amb ON ex.ambiente_id = amb.id
      WHERE 1=1
    `;
    const params = [];
    if (data) { sql += " AND ex.data_execucao = ?"; params.push(data); }
    if (funcionario_id) { sql += " AND ex.funcionario_id = ?"; params.push(funcionario_id); }
    sql += " ORDER BY ex.created_at DESC";
    const result = await db.query(sql, params);
    res.json(result);
  });

  app.post("/api/execucao-diaria", requireAdmin, async (req, res) => {
    const { data_execucao, funcionario_id, atividade_id, ambiente_id, quantidade_executada, observacoes } = req.body;
    
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
    const items = await db.query("SELECT * FROM estoque ORDER BY descricao");
    res.json(items);
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
