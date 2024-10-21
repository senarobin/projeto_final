const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const connection = require('./config');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const app = express();


app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'seu_segredo_aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));


app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public')));

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `projeto_${req.body.projetoId}_${Date.now()}`;
      const fileExtension = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${fileExtension}`);
    }
});

const upload = multer({ storage: storage });

const authMiddleware = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
};

async function buscarTodosProjetos() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM projetos ORDER BY data_submissao DESC', (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

function calcularNotaFinal(dados) {
    const notas = ['relevancia1', 'relevancia2', 'relevancia3', 'relevancia4', 'relevancia5',
                   'estrutura1', 'estrutura2', 'estrutura3', 'estrutura4', 'estrutura5'];
    return notas.reduce((sum, nota) => sum + parseInt(dados[nota]), 0) / notas.length;
}

app.get("/", (req, res) => {
    res.render("home", { message: req.session.message });
    req.session.message = null;
});

app.get("/dashboard", authMiddleware, (req, res) => {
    res.render("dashboard", { usuario: req.session.usuario });
});

app.get("/dashboard_aluno/suporte_aluno", authMiddleware, (req, res) => {
    res.render("dashboard/dashboard_aluno/suporte_aluno", { usuario: req.session.usuario });
});

app.get("/dashboard_admin/eventos", authMiddleware, (req, res) => {
    res.render("dashboard/dashboard_admin/eventos")
})

app.post('/dashboard_admin/eventos', (req, res) => {
    const { nome, data, descricao } = req.body;
    console.log('Dados recebidos:', { nome, data, descricao });
    
    const query = 'INSERT INTO evento (nome, data, descricao) VALUES (?, ?, ?)';
    
    connection.query(query, [nome, data, descricao], (error, results) => {
      if (error) {
        console.error('Erro ao inserir evento:', error);
        res.status(500).send('Erro ao inserir evento');
      } else {
        console.log('Evento inserido com sucesso:', results);
        res.render('dashboard/dashboard_admin/eventos'); 
      }
    });
});


app.get("/dashboard_aluno/eventos_aluno", authMiddleware, async (req, res) => {
    try {
        const [results] = await connection.promise().query('SELECT * FROM evento');
        res.render("dashboard/dashboard_aluno/eventos_aluno", { 
            usuario: req.session.usuario, 
            eventos: results 
        });
    } catch (error) {
        console.error('Erro ao consultar a tabela evento:', error);
        res.status(500).send('Erro ao consultar eventos.');
    }
});


app.get("/dashboard_professor/eventos_professor", authMiddleware, async (req, res) => {
    try {
        const [results] = await connection.promise().query('SELECT * FROM evento');
        res.render("dashboard/dashboard_professor/eventos_professor", { 
            usuario: req.session.usuario, 
            eventos: results 
        });
    } catch (error) {
        console.error('Erro ao consultar a tabela evento:', error);
        res.status(500).send('Erro ao consultar eventos.');
    }
});

app.get("/dashboard_professor/suporte_professor", authMiddleware, (req, res) => {
    res.render("dashboard/dashboard_professor/suporte_professor", { usuario: req.session.usuario });
});

app.get('/minha_conta', authMiddleware, (req, res) => {
    res.render('menu_avatar/minha_conta', { usuario: req.session.usuario });
});

app.get('/personalizacao', authMiddleware, (req, res) => {
    res.render('menu_avatar/personalizacao', { usuario: req.session.usuario });
});
  
app.get('/configuracoes', authMiddleware, (req, res) => {
    res.render('menu_avatar/configuracoes', { usuario: req.session.usuario });
});

app.get('/sair', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get("/dashboard_aluno/projetos", authMiddleware, (req, res) => {
    res.render("dashboard/dashboard_aluno/projetos", { usuario: req.session.usuario });
});

app.get('/dashboard_professor/avaliacao', authMiddleware, (req, res) => {
    res.render('dashboard/dashboard_professor/avaliacao', { usuario: req.session.usuario });
});

app.get('/dashboard_admin/avaliacao_admin', authMiddleware, (req, res) => {
    res.render('dashboard/dashboard_admin/avaliacao_admin', { usuario: req.session.usuario });
});

app.post('/projetos', authMiddleware, upload.array('arquivos', 6), async (req, res) => {
    try {
        const { nome, descricao, professor_orientador, data_inicio, data_termino, area, aluno_id } = req.body; 
        const arquivos_path = req.files ? req.files.map(file => file.path).join(', ') : null;

        const query = `INSERT INTO projetos (nome, descricao, professor_orientador, data_inicio, data_termino, area, arquivos_path, aluno_id) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(query, [nome, descricao, professor_orientador, data_inicio, data_termino, area, arquivos_path, aluno_id], (error, results) => {
            if (error) {
                console.error('Erro ao inserir projeto:', error);
                return res.status(500).json({ error: 'Erro ao submeter o projeto' });
            }
            res.json({ message: 'Projeto submetido com sucesso!', id: results.insertId });
        });
    } catch (error) {
        console.error('Erro ao submeter projeto:', error);
        res.status(500).json({ error: 'Erro ao submeter o projeto' });
    }
});



app.post('/avaliacao', async (req, res) => {
    const dados = req.body;
    const camposObrigatorios = ['projeto', 'modalidade', 'proponente', 'curso', 'avaliador', 
                                'relevancia1', 'relevancia2', 'relevancia3', 
                                'relevancia4', 'relevancia5', 
                                'estrutura1', 'estrutura2', 'estrutura3', 
                                'estrutura4', 'estrutura5'];

    if (camposObrigatorios.some(campo => !dados[campo])) {
        req.flash('error', 'Todos os campos são obrigatórios.');
        return res.redirect('dashboard/dashboard_admin/avaliacao_admin');
    }

    const notaFinal = calcularNotaFinal(dados);
    
    const status = notaFinal <= 5 ? 'Reprovada' : 'Parcialmente Aprovada';
    req.flash('info', `Avaliação ${status.toLowerCase()}. Nota final: ${notaFinal.toFixed(2)}`);

    try {
        await new Promise((resolve, reject) => {
            connection.query('INSERT INTO avaliacao (nome_projeto, nome_aluno, nome_avaliador, modalidade, curso, media, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                [dados.projeto, dados.proponente, dados.avaliador, dados.modalidade, dados.curso, notaFinal.toFixed(2), status], 
                (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
        });

        req.flash('success', 'Avaliação registrada com sucesso.');
        res.redirect('dashboard/dashboard_admin/avaliacao_admin');
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        req.flash('error', 'Erro ao salvar avaliação. Tente novamente.');
        res.redirect('dashboard/dashboard_admin/avaliacao_admin');
    }
});

app.get('/dashboard_admin/notificacoes_admin', authMiddleware, async (req, res) => {
    try {
        const notificacoes = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM avaliacao WHERE status = ? ORDER BY data_avaliacao DESC LIMIT 10', ['Parcialmente Aprovada'], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
        
        const projetos = await buscarTodosProjetos();
        res.render('dashboard/dashboard_admin/notificacoes_admin', { 
            usuario: req.session.usuario, 
            notificacoes,
            projetos,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        req.flash('error', 'Erro ao carregar notificações.');
        res.redirect('/dashboard/admin');
    }
});

const util = require('util');
const query = util.promisify(connection.query).bind(connection);

app.post('/admissao', authMiddleware, async (req, res) => {
    try {
        const {
            criterio1,
            criterio2,
            criterio3,
            criterio4,
            matricula 
        } = req.body;

        const aluno_matricula = req.session.aluno_matricula; 

        const parseBool = (value) => value === 'true' || value === true;
        const [c1, c2, c3, c4] = [criterio1, criterio2, criterio3, criterio4].map(parseBool);

        if ([c1, c2, c3, c4].some(field => field === undefined)) {
            return res.status(400).json({ message: 'Dados de entrada incompletos ou inválidos.' });
        }

        let rejeitado = false;
        let aprovado = false;
        let elegivelBolsa = false;

        if (c1 && c2 && c3 && c4) {
            elegivelBolsa = true;
            aprovado = true;
        } else if (c1 && c2) {
            aprovado = true;
        } else if (!c1 && !c2 && !c3 && !c4) {
            rejeitado = true;
        }

        const status = rejeitado ? 'Rejeitado' :
                       (aprovado ? (elegivelBolsa ? 'Aprovado com Bolsa' : 'Aprovado') : 'Pendente');

        const result = await query(
            `INSERT INTO admissoes (
            rejeitado, elegivel_bolsa, aprovado,
            criterio1, criterio2, criterio3, criterio4,
            aluno_matricula, status, data_submissao, matricula
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,  
                [
                    rejeitado, elegivelBolsa, aprovado,
                    c1, c2, c3, c4,
                    aluno_matricula,  
                    status,           
                    matricula         
                ]
            );
        
        res.status(201).json({ message: 'Admissão registrada com sucesso', id: result.insertId });
        return res.redirect('dashboard/dashboard_admin/avaliacao_admin')

    } catch (error) {
        console.error('Erro ao processar a admissão:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
});


app.get('/dashboard_aluno/notificacoes_aluno', authMiddleware, async (req, res) => { 
    try {
        const aluno_matricula = req.session.aluno_matricula; 

        if (!aluno_matricula) {
            return res.status(403).json({ message: 'Matrícula não encontrada na sessão.' });
        }

        const admissoes = await query(`
            SELECT * FROM admissoes
            WHERE aluno_matricula = ?
        `, [aluno_matricula]);

        res.render('dashboard/dashboard_aluno/notificacoes_aluno', {
            aluno_matricula, 
            admissoes 
        });
    } catch (error) {
        console.error('Erro ao buscar admissões:', error);
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
});


app.get('/dashboard_professor/notificacoes_professor', authMiddleware, async (req, res) => {
    try {
        const projetos = await buscarTodosProjetos();
        res.render('dashboard/dashboard_professor/notificacoes_professor', { usuario: req.session.usuario, projetos });
    } catch (error) {
        console.error('Erro ao buscar os projetos:', error);
        return res.status(500).send('Erro ao buscar os projetos');
    }
});

app.get('/uploads/arquivo/:id', async (req, res) => {
    try {
        const projetoId = req.params.id;
        const projeto = await buscarProjetoPorId(projetoId);

        if (!projeto || !projeto.arquivos_path) {
            return res.status(404).send('Arquivo não encontrado');
        }

        const arquivos = projeto.arquivos_path.split(', ').map(arquivo => arquivo.trim());
        
        const arquivoCaminho = path.join(uploadDir, arquivos[0].replace(/^uploads[\\\/]/, '')); 
        console.log('Caminho do arquivo:', arquivoCaminho); 

        if (fs.existsSync(arquivoCaminho)) {
            return res.sendFile(arquivoCaminho);
        } else {
            return res.status(404).send('Arquivo não encontrado');
        }
    } catch (err) {
        console.error('Erro ao buscar arquivo:', err);
        res.status(500).send('Erro interno do servidor');
    }
});

async function buscarProjetoPorId(id) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT *
            FROM projetos
            WHERE id = ?`;
        console.log('Executando query para ID:', id);

        connection.query(query, [id], (err, results) => {
            if (err) {
                console.error('Erro na query de buscar projeto:', err);
                return reject(err);
            }
            if (results.length === 0) {
                console.log('Nenhum projeto encontrado para ID:', id);
                return resolve(null);
            }
            console.log('Projeto encontrado:', results[0]);
            resolve(results[0]);
        });
    });
}



app.post("/login", async (req, res) => {
    const { identificacao, senha } = req.body;
    console.log('Tentativa de login:', { identificacao, senha: '******' });

    try {
        if (!identificacao || !senha) {
            return res.status(400).json({ message: "Identificação e senha são obrigatórios" });
        }

        const usuarios = await query('SELECT * FROM usuario WHERE matricula = ?', [identificacao]);

        if (usuarios.length === 0) {
            return res.status(400).json({ message: "Usuário não encontrado" });
        }

        const usuario = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(400).json({ message: "Senha inválida" });
        }
        
        req.session.aluno_matricula = usuario.matricula; 

        req.session.usuario = { id: usuario.id, nome: usuario.nome, tipo: usuario.tipoUsuario }; 
        req.session.aluno_id = usuario.id; 

        let admissoes;

        switch (usuario.tipoUsuario) {
            case 'professor':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                `);
                return res.render('dashboard/dashboard_professor/dashboard_professor', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            case 'aluno':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                    WHERE a.aluno_id = ?
                `, [req.session.aluno_id]);
                return res.render('dashboard/dashboard_aluno/dashboard_aluno', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            case 'admin':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                `);
                return res.render('dashboard/dashboard_admin/dashboard_admin', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            default:
                return res.status(400).json({ message: "Tipo de usuário inválido" });
        }
    } catch (error) {
        console.error('Erro durante o login:', error);
        res.status(500).json({ 
            message: "Erro interno do servidor", 
            error: error.message 
        });
    }
});

app.post("/cadastro", async (req, res) => {
    const { tipoUsuario, identificacao, senha, categoria } = req.body;

    if (!tipoUsuario || !identificacao || !senha) {
        return res.status(400).send("Todos os campos são obrigatórios");
    }

    try {
        const results = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM usuario WHERE matricula = ?', [identificacao], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.length > 0) {
            return res.status(400).send("Usuário já cadastrado");
        }

        const hashedSenha = await bcrypt.hash(senha, 10);

        const usuarioData = {
            tipoUsuario,
            matricula: identificacao,
            senha: hashedSenha,
            categoria
        };

        console.log('Dados do usuário a serem inseridos:', usuarioData); 

        const insertResult = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO usuario SET ?', usuarioData, (error, results) => {
                if (error) {
                    console.error('Erro ao cadastrar usuário:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });

        req.session.aluno_matricula = identificacao;
        req.session.usuario = { 
            id: insertResult.insertId, 
            nome: identificacao, 
            tipo: tipoUsuario 
        };
        req.session.aluno_id = insertResult.insertId;

        let admissoes;

        switch (tipoUsuario) {
            case 'professor':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                `);
                return res.render('dashboard/dashboard_professor/dashboard_professor', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            case 'aluno':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                `);
                return res.render('dashboard/dashboard_aluno/dashboard_aluno', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            case 'admin':
                admissoes = await query(` 
                    SELECT a.*, p.data_inicio, p.data_termino 
                    FROM admissoes a
                    JOIN projetos p ON a.projeto_id = p.id
                `);
                return res.render('dashboard/dashboard_admin/dashboard_admin', { 
                    usuario: req.session.usuario, 
                    admissoes: admissoes 
                });
            default:
                return res.status(400).json({ message: "Tipo de usuário inválido" });
        }
    } catch (error) {
        console.error('Erro durante o cadastro:', error);
        return res.status(500).send("Erro ao processar o cadastro");
    }
});

app.post('/upload', authMiddleware, upload.single('arquivo'), async (req, res) => {
    const { projetoId } = req.body;

    if (!projetoId || !req.file) {
        return res.status(400).send("Projeto ID e arquivo são obrigatórios");
    }

    try {
        const arquivoPath = req.file.path.replace(/^uploads[\\\/]/, '');
        await new Promise((resolve, reject) => {
            connection.query('UPDATE projetos SET arquivos_path = CONCAT(IFNULL(arquivos_path, ""), ? ", ") WHERE id = ?', [arquivoPath, projetoId], (error, results) => {
                if (error) {
                    console.error('Erro ao atualizar o projeto:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });

        return res.status(200).send("Arquivo enviado com sucesso!");
    } catch (error) {
        console.error('Erro durante o upload:', error);
        return res.status(500).send("Erro ao processar o upload");
    }
});

app.get('/dashboard_aluno/arquivos/:projetoId', authMiddleware, async (req, res) => {
    const { projetoId } = req.params;

    try {
        const projeto = await buscarProjetoPorId(projetoId);
        if (!projeto) {
            return res.status(404).send("Projeto não encontrado");
        }

        const arquivos = projeto.arquivos_path ? projeto.arquivos_path.split(', ') : [];
        res.render('dashboard/dashboard_aluno/arquivos', { usuario: req.session.usuario, arquivos });
    } catch (error) {
        console.error('Erro ao buscar arquivos:', error);
        return res.status(500).send("Erro ao buscar arquivos");
    }
});

app.get('/api/projetos', (req, res) => {
    connection.query('SELECT * FROM projetos', (error, results) => {
        if (error) {
            console.error('Erro ao buscar projetos:', error);
            return res.status(500).send('Erro ao buscar projetos');
        }
        res.json(results); 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

