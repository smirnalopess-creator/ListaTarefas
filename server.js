
/*
===========================================
BACKEND - LISTA DE TAREFAS
Tecnologias:
- Node.js
- Express
- CORS
- Supabase
===========================================
*/

// 1. IMPORTANDO AS BIBLIOTECAS

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// 2. CONFIGURANDO O EXPRESS

const app = express();

// Permite receber requisições de outros endereços
app.use(cors());

// Permite receber dados em formato JSON
app.use(express.json());

// 3. CONFIGURANDO O SUPABASE

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

// Verifica se as variáveis foram configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Configure as variáveis de ambiente do Supabase.');
}

// Criando a conexão com o Supabase
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// ===========================================
// ROTA PRINCIPAL
// ===========================================

app.get('/', (req, res) => {
    res.status(200).json({
        mensagem: 'API da Lista de Tarefas funcionando!',
        rotas: {
            listar: 'GET /tarefas',
            buscar: 'GET /tarefas/:id',
            cadastrar: 'POST /tarefas',
            atualizar: 'PUT /tarefas/:id',
            excluir: 'DELETE /tarefas/:id'
        }
    });
});

// ===========================================
// VALIDAR ID
// ===========================================

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

// ===========================================
// GET - LISTAR TODAS AS TAREFAS
// ===========================================

app.get('/tarefas', async (req, res) => {

    try {

        const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            return res.status(500).json({
                mensagem: 'Erro ao buscar tarefas',
                erro: error.message
            });
        }

        res.status(200).json(data);

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ===========================================
// GET - BUSCAR TAREFA PELO ID
// ===========================================

app.get('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (!validarId(id)) {
            return res.status(400).json({
                mensagem: 'ID inválido'
            });
        }

        const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                mensagem: 'Erro ao buscar tarefa',
                erro: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada'
            });
        }

        res.status(200).json(data);

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ===========================================
// POST - CADASTRAR NOVA TAREFA
// ===========================================

app.post('/tarefas', async (req, res) => {

    try {

        // Recebendo os dados do frontend
        const { titulo, descricao } = req.body;

        // Verificando se o título foi informado
        if (typeof titulo !== 'string' || !titulo.trim()) {
            return res.status(400).json({
                mensagem: 'O título da tarefa é obrigatório'
            });
        }

        // Verificando o tamanho do título
        if (titulo.trim().length > 150) {
            return res.status(400).json({
                mensagem: 'O título deve ter no máximo 150 caracteres'
            });
        }

        // Cadastrando no banco de dados
        const { data, error } = await supabase
            .from('tarefas')
            .insert({
                titulo: titulo.trim(),
                descricao: descricao || '',
                concluida: false
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                mensagem: 'Erro ao cadastrar tarefa',
                erro: error.message
            });
        }

        res.status(201).json({
            mensagem: 'Tarefa cadastrada com sucesso!',
            tarefa: data
        });

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ===========================================
// PUT - ATUALIZAR TAREFA
// ===========================================

app.put('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (!validarId(id)) {
            return res.status(400).json({
                mensagem: 'ID inválido'
            });
        }

        const { titulo, descricao, concluida } = req.body;

        // Objeto que receberá os campos para atualização
        const atualizacao = {};

        // Atualizando o título, caso tenha sido enviado
        if (titulo !== undefined) {

            if (typeof titulo !== 'string' || !titulo.trim()) {
                return res.status(400).json({
                    mensagem: 'O título não pode ficar vazio'
                });
            }

            if (titulo.trim().length > 150) {
                return res.status(400).json({
                    mensagem: 'O título deve ter no máximo 150 caracteres'
                });
            }

            atualizacao.titulo = titulo.trim();

        }

        // Atualizando a descrição
        if (descricao !== undefined) {

            if (typeof descricao !== 'string') {
                return res.status(400).json({
                    mensagem: 'A descrição deve ser um texto'
                });
            }

            atualizacao.descricao = descricao;

        }

        // Atualizando o status da tarefa
        if (concluida !== undefined) {

            if (typeof concluida !== 'boolean') {
                return res.status(400).json({
                    mensagem: 'O campo concluida deve ser true ou false'
                });
            }

            atualizacao.concluida = concluida;

        }

        // Verifica se algum campo foi enviado
        if (Object.keys(atualizacao).length === 0) {
            return res.status(400).json({
                mensagem: 'Informe algum dado para atualizar'
            });
        }

        // Atualizando no Supabase
        const { data, error } = await supabase
            .from('tarefas')
            .update(atualizacao)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                mensagem: 'Erro ao atualizar tarefa',
                erro: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada'
            });
        }

        res.status(200).json({
            mensagem: 'Tarefa atualizada com sucesso!',
            tarefa: data
        });

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ===========================================
// DELETE - EXCLUIR TAREFA
// ===========================================

app.delete('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        if (!validarId(id)) {
            return res.status(400).json({
                mensagem: 'ID inválido'
            });
        }

        const { data, error } = await supabase
            .from('tarefas')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                mensagem: 'Erro ao excluir tarefa',
                erro: error.message
            });
        }

        if (!data) {
            return res.status(404).json({
                mensagem: 'Tarefa não encontrada'
            });
        }

        res.status(200).json({
            mensagem: 'Tarefa excluída com sucesso!',
            tarefa: data
        });

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ===========================================
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ===========================================

app.use((req, res) => {

    res.status(404).json({
        mensagem: 'Rota não encontrada'
    });

});

// ===========================================
// TRATAMENTO DE ERROS
// ===========================================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        mensagem: 'Ocorreu um erro interno no servidor'
    });

});

// ===========================================
// EXECUÇÃO LOCAL E EXPORTAÇÃO PARA VERCEL
// ===========================================

// Quando executar com node server.js, inicia na porta 3000
if (require.main === module) {

    const PORTA = process.env.PORT || 3000;

    app.listen(PORTA, () => {
        console.log(`Servidor rodando na porta ${PORTA}`);
    });

}

// Exporta o Express para a Vercel
module.exports = app;
