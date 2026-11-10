
/*
=================================================
BACKEND - LISTA DE TAREFAS
Tecnologias:
- Node.js
- Express
- CORS
- Supabase
- Vercel
=================================================
*/

// ================================================
// 1. IMPORTANDO AS BIBLIOTECAS
// ================================================

// Carrega as variáveis do arquivo .env
// Na Vercel, utiliza as variáveis cadastradas no painel
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// ================================================
// 2. CONFIGURANDO O EXPRESS
// ================================================

const app = express();

// Permite comunicação com outros endereços
app.use(cors());

// Permite receber dados no formato JSON
app.use(express.json());

// ================================================
// 3. CONFIGURANDO O SUPABASE
// ================================================

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

// Verifica se as credenciais foram configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
        'Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente.'
    );
}

// Criando conexão com o banco de dados
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

// ================================================
// 4. ROTA PRINCIPAL
// ================================================

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

// ================================================
// 5. FUNÇÃO PARA VALIDAR ID
// ================================================

function validarId(id) {

    return /^\d+$/.test(id) && Number(id) > 0;

}

// ================================================
// 6. GET - LISTAR TODAS AS TAREFAS
// ================================================

app.get('/tarefas', async (req, res) => {

    try {

        // Busca todas as tarefas no Supabase
        const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .order('id', { ascending: true });

        // Verifica se ocorreu algum erro
        if (error) {

            return res.status(500).json({
                mensagem: 'Erro ao buscar tarefas',
                erro: error.message
            });

        }

        // Retorna a lista de tarefas
        res.status(200).json(data);

    } catch (erro) {

        res.status(500).json({
            mensagem: 'Erro interno do servidor',
            erro: erro.message
        });

    }

});

// ================================================
// 7. GET - BUSCAR TAREFA PELO ID
// ================================================

app.get('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        // Validando o ID
        if (!validarId(id)) {

            return res.status(400).json({
                mensagem: 'ID inválido'
            });

        }

        // Buscando tarefa pelo ID
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

        // Verificando se a tarefa existe
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

// ================================================
// 8. POST - CADASTRAR NOVA TAREFA
// ================================================

app.post('/tarefas', async (req, res) => {

    try {

        // Recebendo os dados enviados pelo frontend
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

        // Validando a descrição
        if (
            descricao !== undefined &&
            typeof descricao !== 'string'
        ) {

            return res.status(400).json({
                mensagem: 'A descrição deve ser um texto'
            });

        }

        // Inserindo a tarefa no Supabase
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

// ================================================
// 9. PUT - ATUALIZAR TAREFA
// ================================================

app.put('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        // Validando o ID
        if (!validarId(id)) {

            return res.status(400).json({
                mensagem: 'ID inválido'
            });

        }

        // Recebendo os dados enviados
        const { titulo, descricao, concluida } = req.body;

        // Objeto que armazenará os dados atualizados
        const atualizacao = {};

        // Atualizando o título
        if (titulo !== undefined) {

            if (
                typeof titulo !== 'string' ||
                !titulo.trim()
            ) {

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

        // Atualizando o status
        if (concluida !== undefined) {

            if (typeof concluida !== 'boolean') {

                return res.status(400).json({
                    mensagem: 'O campo concluida deve ser true ou false'
                });

            }

            atualizacao.concluida = concluida;

        }

        // Verificando se algum dado foi enviado
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

// ================================================
// 10. DELETE - EXCLUIR TAREFA
// ================================================

app.delete('/tarefas/:id', async (req, res) => {

    try {

        const id = req.params.id;

        // Validando o ID
        if (!validarId(id)) {

            return res.status(400).json({
                mensagem: 'ID inválido'
            });

        }

        // Excluindo a tarefa no Supabase
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

// ================================================
// 11. TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ================================================

app.use((req, res) => {

    res.status(404).json({
        mensagem: 'Rota não encontrada'
    });

});

// ================================================
// 12. TRATAMENTO DE ERROS
// ================================================

app.use((erro, req, res, next) => {

    console.error(erro);

    res.status(500).json({
        mensagem: 'Erro interno do servidor'
    });

});

// ================================================
// 13. EXECUÇÃO LOCAL E VERCEL
// ================================================

// Verifica se o arquivo está sendo executado diretamente
if (require.main === module) {

    // Define a porta do servidor
    const PORTA = process.env.PORT || 3000;

    // Inicia o servidor local
    app.listen(PORTA, () => {

        console.log('=================================');
        console.log('API LISTA DE TAREFAS');
        console.log(`Servidor: http://localhost:${PORTA}`);
        console.log('=================================');

    });

}

// Exporta o aplicativo Express para a Vercel
module.exports = app;
