// Configuração inicial e constantes globais

// URL's da nossa API (Backend)
const ENDPOINT_ALUNOS = 'https://backend-catraca.vercel.app';
const ENDPOINT_LISTAR = "https://backend-catraca.vercel.app/academia";
const ENDPOINT_CADASTRAR = "https://backend-catraca.vercel.app/academia/cadastro";

// Ligando com os elementos HTML
const tabelaAlunosBody = document.getElementById('tabela-alunos');
const inputNomeCadastro = document.getElementById('nome');
const inputCpfCadastro = document.getElementById('cpf');
const selectStatusCadastro = document.getElementById('status');

const formularioEdicao = document.getElementById('edicao-aluno');
const inputEditarId = document.getElementById('editar-id');
const inputEditarNome = document.getElementById('editar-nome');
const inputEditarCpf = document.getElementById('editar-cpf');
const selectEditarStatus = document.getElementById('editar-status');

// Variável para rastrear o ID do aluno em edição (pode ser útil no futuro)
let alunoEditandoId = null;

// ===========================================================
// FUNÇÕES PARA INTERAGIR COM API
// ===========================================================

// READ (Listar os alunos na tabela)
async function buscarListaAlunos() {
    console.log("Buscando alunos na API....");
    tabelaAlunosBody.innerHTML = '<tr><td colspan="6" class="p-2 text-center">Carregando alunos...</td></tr>';

    try {
        const respostaHttp = await fetch(ENDPOINT_LISTAR);

        if (!respostaHttp.ok) {
            throw new Error(`Erro na API: ${respostaHttp.status} ${respostaHttp.statusText}`);
        }

        const alunos = await respostaHttp.json();
        console.log("Alunos recebidos: ", alunos);
        exibirAlunosNaTabela(alunos);

    } catch (erro) {
        console.error(`Falha ao buscar alunos: ${erro}`);
        tabelaAlunosBody.innerHTML = `<tr><td colspan="6" class="p-2 text-center text-red-500">Erro ao carregar alunos: ${erro.message}</td></tr>`;
    }
}

// --- CREATE (Cadastrar um novo aluno) ---
async function cadastrarAluno() {
    const nome = inputNomeCadastro.value.trim();
    const cpf = inputCpfCadastro.value.trim();
    const status = selectStatusCadastro.value;

    console.log("Tentando cadastrar novo aluno...");

    if (!nome || !cpf || !status) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (contarDigitosCPF(cpf) !== 11) {
        alert("CPF inválido. Por favor, digite os 11 dígitos.");
        return;
    }

    const novoAluno = {
        nome: nome,
        cpf: cpf,
        status: status
    };

    try {
        const respostaHttp = await fetch(ENDPOINT_CADASTRAR, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novoAluno)
        });

        const resultadoApi = await respostaHttp.json();

        if (!respostaHttp.ok) {
            throw new Error(resultadoApi.mensagem || `Erro ao cadastrar aluno: ${respostaHttp.status}`);
        }

        console.log("Aluno cadastrado com sucesso!", resultadoApi);
        alert(resultadoApi.mensagem || "Aluno cadastrado com sucesso!");
        limparCamposCadastro();
        await buscarListaAlunos();

    } catch (erro) {
        console.error("Falha ao criar aluno:", erro);
        alert(`Erro ao criar aluno: ${erro.message}`);
    }
}

// --- Buscar dados do aluno para edição ---
async function editarAluno(cpf) {
    console.log(`Buscando dados do aluno com CPF: ${cpf} para edição...`);

    try {
        const respostaHttp = await fetch(`${ENDPOINT_ALUNOS}/academia/aluno/${cpf}`);

        if (!respostaHttp.ok) {
            const erroDetalhado = await respostaHttp.json();
            throw new Error(erroDetalhado.mensagem || `Erro ao buscar dados do aluno para edição: ${respostaHttp.status}`);
        }

        const aluno = await respostaHttp.json();
        console.log("Dados do aluno para edição recebidos:", aluno);

        // Preencher o formulário de edição com os dados do aluno
        inputEditarId.value = aluno.id;
        inputEditarNome.value = aluno.nome;
        inputEditarCpf.value = aluno.cpf;
        selectEditarStatus.value = aluno.status;

        // Exibir o formulário de edição
        formularioEdicao.classList.remove('hidden');
        document.getElementById('cadastro-aluno').classList.add('hidden');
        formularioEdicao.scrollIntoView({ behavior: 'smooth' });

    } catch (erro) {
        console.error("Falha ao buscar dados do aluno para edição:", erro);
        alert(`Erro ao buscar dados do aluno para edição: ${erro.message}`);
    }
}

// --- Salvar a edição do aluno ---
async function salvarEdicaoAluno() {
    const id = inputEditarId.value;
    const nome = inputEditarNome.value.trim();
    const cpf = inputEditarCpf.value.trim(); // Pegue o CPF do campo readonly
    const status = selectEditarStatus.value;

    console.log(`Tentando salvar edição do aluno com ID: ${id} e CPF: ${cpf}...`);

    if (!nome || !cpf || !status) {
        alert("Por favor, preencha todos os campos para salvar a edição.");
        return;
    }

    const alunoAtualizado = {
        nome: nome,
        status: status
    };

    try {
        const ENDPOINT_SALVAR_EDICAO = `${ENDPOINT_ALUNOS}/academia/editar/${cpf}`; // Use o CPF na URL

        const respostaHttp = await fetch(ENDPOINT_SALVAR_EDICAO, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alunoAtualizado) // Envie apenas os campos que podem ser atualizados
        });

        const resultadoApi = await respostaHttp.json();

        if (!respostaHttp.ok) {
            throw new Error(resultadoApi.mensagem || `Erro ao salvar edição do aluno: ${respostaHttp.status}`);
        }

        console.log("Edição do aluno salva com sucesso!", resultadoApi);
        alert(resultadoApi.mensagem || "Edição do aluno salva com sucesso!");
        cancelarEdicao(); // Esconder o formulário de edição
        await buscarListaAlunos(); // Atualizar a tabela

    } catch (erro) {
        console.error("Falha ao salvar edição do aluno:", erro);
        alert(`Erro ao salvar edição do aluno: ${erro.message}`);
    }
}

// --- DELETE (Excluir um aluno) ---
async function excluirAluno(cpf) { // Agora recebe CPF como argumento
    console.log(`Tentando excluir aluno com CPF: ${cpf}`);

    if (!confirm(`Tem certeza que deseja excluir o aluno com CPF ${cpf}? Esta ação não pode ser desfeita.`)) {
        console.log("Exclusão cancelada pelo usuário.");
        return;
    }

    try {
        const respostaHttp = await fetch(`${ENDPOINT_ALUNOS}/academia/${cpf}`, { // Use o CPF na URL
            method: 'DELETE'
        });

        const resultadoApi = await respostaHttp.json();

        if (!respostaHttp.ok) {
            throw new Error(resultadoApi.mensagem || `Erro ao excluir aluno: ${respostaHttp.status}`);
        }

        console.log("Aluno excluído com sucesso!", resultadoApi);
        alert(resultadoApi.mensagem || "Aluno excluído com sucesso!");
        await buscarListaAlunos();

    } catch (erro) {
        console.error("Falha ao excluir aluno:", erro);
        alert(`Erro ao excluir aluno: ${erro.message}`);
    }
}

// ============================================================
// FUNÇÕES PARA MANIPULAR O HTML (Atualizar a Página)
// ============================================================

// --- Mostrar os alunos na tabela ---
function exibirAlunosNaTabela(alunos) {
    console.log("Atualizando a tabela de alunos na tela...");
    tabelaAlunosBody.innerHTML = '';

    if (!alunos || alunos.length === 0) {
        tabelaAlunosBody.innerHTML = '<tr><td colspan="6" class="p-2 text-center">Nenhum aluno cadastrado ainda.</td></tr>';
        return;
    }

    alunos.forEach(aluno => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border border-yellow-400">${aluno.id}</td>
            <td class="p-2 border border-yellow-400">${aluno.nome}</td>
            <td class="p-2 border border-yellow-400">${aluno.cpf || 'Não informado'}</td>
            <td class="p-2 border border-yellow-400">${aluno.status}</td>
            <td class="p-2 border border-yellow-400">
                <button onclick="editarAluno('${aluno.cpf}')" class="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-2 rounded text-sm ml-1">Editar</button>
                <button onclick="excluirAluno('${aluno.cpf}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm ml-1">Excluir</button>
            </td>
        `;
        tabelaAlunosBody.appendChild(row);
    });
}

function limparCamposCadastro() {
    inputNomeCadastro.value = "";
    inputCpfCadastro.value = "";
    selectStatusCadastro.value = "Ativo";
}

function cancelarEdicao() {
    formularioEdicao.classList.add('hidden');
    document.getElementById('cadastro-aluno').classList.remove('hidden');
    limparCamposEdicao();
}

function limparCamposEdicao() {
    inputEditarId.value = "";
    inputEditarNome.value = "";
    inputEditarCpf.value = "";
    selectEditarStatus.value = "Ativo";
}

// ==============================================================
// FUNÇÕES UTILITÁRIAS
// ==============================================================

function contarDigitosCPF(cpf) {
    return cpf.replace(/\D/g, '').length;
}

// ==============================================================
// EVENT LISTENERS E INICIALIZAÇÃO
// ==============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM completamente carregado. Iniciando busca de alunos...");
    buscarListaAlunos();
});