const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const connection = require('./config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public')));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/cadastro", (req, res) => {
    res.render("cadastro");
});

// Removido o uso de req.user para o dashboard
app.get("/dashboard", (req, res) => {
    res.render("dashboard", { usuario: null });
});

app.post("/login", async (req, res) => {
    const { matricula, senha } = req.body;
    console.log('Tentativa de login:', { matricula, senha: '******' });

    try {
        const results = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM usuario WHERE matricula = ?', [matricula], (error, results) => {
                if (error) {
                    console.error('Erro na query de login:', error);
                    reject(error);
                } else {
                    console.log('Resultado da query de login:', results);
                    resolve(results);
                }
            });
        });

        if (results.length === 0) {
            console.log('Usuário não encontrado');
            return res.status(400).send("Usuário não encontrado");
        }

        const usuario = results[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            console.log('Senha inválida');
            return res.status(400).send("Senha inválida");
        }

        console.log('Login bem-sucedido:', { matricula: usuario.matricula, tipoUsuario: usuario.tipoUsuario });

        // Renderizando a view correta e passando o usuario
        if (usuario.tipoUsuario === 'professor') {
            return res.render("dashboard/dashboard_professor", { usuario });
        } else {
            return res.render("dashboard/dashboard_aluno", { usuario });
        }

    } catch (error) {
        console.error('Erro durante o login:', error);
        return res.status(500).send("Erro ao processar o login");
    }
});

app.post("/cadastro", async (req, res) => {
    const { tipoUsuario, matricula, senha, categoria } = req.body;
    console.log('Tentativa de cadastro:', { tipoUsuario, matricula, senha: '******', categoria });

    try {
        const results = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM usuario WHERE matricula = ?', [matricula], (error, results) => {
                if (error) {
                    console.error('Erro ao verificar usuário existente:', error);
                    reject(error);
                } else {
                    console.log('Resultado da verificação de usuário existente:', results);
                    resolve(results);
                }
            });
        });

        if (results.length > 0) {
            console.log('Usuário já existe');
            return res.status(400).send("Usuário já existe");
        }

        const salt = await bcrypt.genSalt(12);
        const senhaHash = await bcrypt.hash(senha, salt);

        const novoUsuario = { tipoUsuario, matricula, senha: senhaHash, categoria };
        console.log('Tentando inserir novo usuário:', { ...novoUsuario, senha: '******' });

        await new Promise((resolve, reject) => {
            connection.query('INSERT INTO usuario SET ?', novoUsuario, (error, results) => {
                if (error) {
                    console.error('Erro ao inserir novo usuário:', error);
                    reject(error);
                } else {
                    console.log('Usuário inserido com sucesso. Resultado:', results);
                    resolve(results);
                }
            });
        });

        console.log('Cadastro bem-sucedido:', { matricula, tipoUsuario, categoria });

        // Renderizando a view correta e passando o usuario
        if (tipoUsuario === 'professor') {
            return res.render("dashboard/dashboard_professor", { usuario: novoUsuario });
        } else {
            return res.render("dashboard/dashboard_aluno", { usuario: novoUsuario });
        }

    } catch (error) {
        console.error('Erro durante o cadastro:', error);
        return res.status(500).send("Erro ao se cadastrar");
    }
});

const porta = 3000; 
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});
