const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.all(`
        SELECT 
          s.nome_setor as name,
          SUM(sa.quantidade_executada) as exec,
          SUM(sa.quantidade_total_prevista) as total
        FROM setores s
        JOIN pavimentos p ON p.setor_id = s.id
        JOIN unidades u ON u.pavimento_id = p.id
        JOIN ambientes a ON a.unidade_id = u.id
        JOIN servicos_ambiente sa ON sa.ambiente_id = a.id
        GROUP BY s.id, s.nome_setor
`, (err, rows) => {
  if (err) console.error("Error 1:", err);
  else console.log("Rows 1:", rows);
});
db.all(`
        SELECT 
          a.nome_ambiente as name,
          p.nome_pavimento as floor,
          SUM(sa.quantidade_executada) as exec,
          SUM(sa.quantidade_total_prevista) as total
        FROM ambientes a
        JOIN unidades u ON a.unidade_id = u.id
        JOIN pavimentos p ON u.pavimento_id = p.id
        JOIN servicos_ambiente sa ON sa.ambiente_id = a.id
        GROUP BY a.id, a.nome_ambiente, p.nome_pavimento
        ORDER BY (SUM(sa.quantidade_executada) / SUM(sa.quantidade_total_prevista)) DESC
        LIMIT 10
`, (err, rows) => {
  if (err) console.error("Error 2:", err);
  else console.log("Rows 2:", rows);
});
