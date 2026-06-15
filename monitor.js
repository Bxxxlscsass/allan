// --- ELEMENTOS DO TERMINAL DO CLIENTE ---
const inValor = document.querySelector("#inValor");
const btnDepositar = document.querySelector("#btnDepositar");
const btnSacar = document.querySelector("#btnSacar");
const outResp = document.querySelector("#outResp");
const progressoCircular = document.querySelector("#progressoCircular");
const valorPorcentagem = document.querySelector("#valorPorcentagem");
const containerCartoes = document.querySelector("#containerCartoes");
const logContainer = document.querySelector("#logContainer");

// --- ELEMENTOS DO PAINEL DE CONTROLE TÉCNICO ---
const btnAutenticar = document.querySelector("#btnAutenticar");
const btnSimularErro = document.querySelector("#btnSimularErro");
const btnResetarTudo = document.querySelector("#btnResetarTudo");
const painelInjecao = document.querySelector("#painelInjecao");
const addNome = document.querySelector("#addNome");
const addSaldo = document.querySelector("#addSaldo");
const btnCriarCartao = document.querySelector("#btnCriarCartao");

// --- VARIÁVEIS DE ESTADO INTERNO ---
let falhaMecanicaAtiva = false;
let administradorAutenticado = false;

// --- BANCO DE DADOS E ESTADOS DE PERSISTÊNCIA ---
const padraoCartoes = { "Mastercard Pro": 600, "Visa Platinum": 5000, "Elo Dev": 50 };
const padraoNotas = { 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 2: 0 };

let bancoCartoes = JSON.parse(localStorage.getItem("atm_cartoes")) || padraoCartoes;
let contadorNotasGlobal = JSON.parse(localStorage.getItem("atm_notas")) || padraoNotas;
let cartaoAtivo = localStorage.getItem("atm_cartao_ativo") || Object.keys(bancoCartoes)[0];
let volumeSaques = Number(localStorage.getItem("atm_volume")) || 0;
let historicoLogs = JSON.parse(localStorage.getItem("atm_logs")) || ["[SISTEMA] Terminal operacional carregado."];

// Referência às notas atualmente disponíveis no terminal (persistidas ou padrão)
const notasDisponiveis =; 

// --- SISTEMA DE AUTENTICAÇÃO TÉCNICA ---
btnAutenticar.addEventListener("click", () => {
    if (administradorAutenticado) {
        administradorAutenticado = false;
        btnAutenticar.textContent = " Desbloquear Admin";
        btnAutenticar.className = "btn-autenticar";
        adicionarLog("SEGURANÇA: Sessão administrativa encerrada pelo usuário.", "log-sistema");
        gerenciarBloqueioAdmin();
        return;
    }

    const inputSenha = prompt("Acesso Restrito ao Técnico. Digite a senha administrativa:");
    if (inputSenha === "admin123") {
        administradorAutenticado = true;
        btnAutenticar.textContent = "🔓 Bloquear Painel";
        btnAutenticar.className = "btn-autenticado";
        adicionarLog("SEGURANÇA: Autenticação de administrador aceita. Acesso concedido.", "log-sistema");
        gerenciarBloqueioAdmin();
    } else if (inputSenha !== null) {
        alert("Senha Incorreta! Tentativa registrada no sistema.");
        adicionarLog("ALERTA: Falha na tentativa de login administrativo (Senha Inválida).", "log-erro");
    }
});

function gerenciarBloqueioAdmin() {
    if (administradorAutenticado) {
        btnSimularErro.disabled = false;
        btnResetarTudo.disabled = false;
        addNome.disabled = false;
        addSaldo.disabled = false;
        btnCriarCartao.disabled = false;
        if (painelInjecao) painelInjecao.classList.remove("bloqueado");
    } else {
        btnSimularErro.disabled = true;
        btnResetarTudo.disabled = true;
        addNome.disabled = true;
        addSaldo.disabled = true;
        btnCriarCartao.disabled = true;
        if (painelInjecao) painelInjecao.classList.add("bloqueado");
    }
}

// --- RENDERIZADORES DE INTERFACE ---
function renderizarCartoes() {
    containerCartoes.innerHTML = "";
    Object.keys(bancoCartoes).forEach(nome => {
        const div = document.createElement("div");
        div.className = `cartao-falso ${nome === cartaoAtivo ? 'selecionado' : ''}`;
        div.innerHTML = `<div>${nome}</div><div class="cartao-saldo">R$ ${bancoCartoes[nome]}</div>`;
        div.addEventListener("click", () => {
            cartaoAtivo = nome;
            localStorage.setItem("atm_cartao_ativo", nome);
            adicionarLog(`CARTÃO: Conta ativa alterada para [${nome}].`, "log-sistema");
            atualizarTela();
        });
        containerCartoes.appendChild(div);
    });
}

function renderizarLogs() {
    logContainer.innerHTML = "";
    historicoLogs.forEach(log => {
        const div = document.createElement("div");
        if (log.includes("DEPÓSITO")) {
            div.className = "log-linha log-deposito";
        } else if (log.includes("SAQUE")) {
            div.className = "log-linha log-saque";
        } else if (log.includes("ALERTA") || log.includes("CRÍTICO") || log.includes("FALHA")) {
            div.className = "log-linha log-erro";
        } else {
            div.className = "log-linha log-sistema";
        }
        div.textContent = log;
        logContainer.appendChild(div);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
}

function atualizarTela() {
    if (!bancoCartoes[cartaoAtivo] && bancoCartoes[cartaoAtivo] !== 0) {
        cartaoAtivo = Object.keys(bancoCartoes)[0] || "";
    }
    document.querySelector("#monSaldo").textContent = cartaoAtivo ? `R$ ${bancoCartoes[cartaoAtivo]}` : "R$ 0";
    document.querySelector("#monVolume").textContent = `R$ ${volumeSaques}`;
    for (const nota of notasDisponiveis) {
        const elNota = document.querySelector(`#n${nota}`);
        if (elNota) elNota.textContent = contadorNotasGlobal[nota];
    }
    renderizarCartoes();
    localStorage.setItem("atm_cartoes", JSON.stringify(bancoCartoes));
    localStorage.setItem("atm_notas", JSON.stringify(contadorNotasGlobal));
    localStorage.setItem("atm_volume", volumeSaques);
}

function adicionarLog(texto, tipo) {
    const agora = new Date();
    const timestamp = `[${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}:${String(agora.getSeconds()).padStart(2,'0')}]`;
    historicoLogs.push(`${timestamp} ${texto}`);
    if (historicoLogs.length > 50) {
        historicoLogs.shift();
    }
    localStorage.setItem("atm_logs", JSON.stringify(historicoLogs));
    renderizarLogs();
}

// --- OPERAÇÕES DO DISPENSADOR (CLIENTE) ---
btnDepositar.addEventListener("click", () => {
    const valor = Number(inValor.value);
    if (!valor || valor <= 0) return alert("Insira um valor maior que zero.");
    if (!cartaoAtivo) return alert("Crie ou selecione um cartão.");
    
    outResp.innerHTML = "";
    bancoCartoes[cartaoAtivo] += valor;
    adicionarLog(`DEPÓSITO: +R$ ${valor} na conta [${cartaoAtivo}].`, "log-deposito");
    atualizarTela();
    
    outResp.innerHTML = `<p style="border-left-color: #10b981; color: #10b981; background-color: #f0fdf4;">Crédito processado com sucesso!</p>`;
    inValor.value = "";
});

btnSacar.addEventListener("click", () => {
    const valorSaque = Number(inValor.value);
    if (!valorSaque || valorSaque <= 0) return alert("Insira um valor maior que zero.");
    if (!cartaoAtivo) return alert("Selecione um cartão.");
    
    if (falhaMecanicaAtiva) {
        adicionarLog(`CRÍTICO: Saque de R$ ${valorSaque} abortado. Sensor do módulo dispensador travado.`, "log-erro");
        alert("ERRO DE HARDWARE: Impressora mecânica travada. Chame o suporte técnico.");
        falhaMecanicaAtiva = false;
        return;
    }
    
    if (valorSaque > bancoCartoes[cartaoAtivo]) {
        adicionarLog(`FALHA: Saldo insuficiente para resgate de R$ ${valorSaque} no [${cartaoAtivo}].`, "log-saque");
        return alert("Saldo insuficiente.");
    }
    
    if (valorSaque % 2 !== 0 && valorSaque < 10) return alert("Valor inválido para as cédulas.");
    
    let resto = valorSaque;
    const resultadoSaque = [];
    
    for (const nota of notasDisponiveis) {
        if (resto % 2 !== 0 && resto > 5 && nota === 10) continue;
        const qtdNotas = Math.floor(resto / nota);
        if (qtdNotas > 0) {
            resultadoSaque.push({ nota: nota, qtd: qtdNotas });
            resto = resto % nota;
        }
    }
    
    if (resto > 0) return alert("Notas indisponíveis para este valor exato.");
    
    outResp.innerHTML = "";
    const percentages = Math.round((valorSaque / bancoCartoes[cartaoAtivo]) * 100);
    const porcentagemAlvo = Math.min(percentages, 100) || 1;
    let progressoAtual = 0;
    
    const intervalo = setInterval(() => {
        progressoAtual++;
        valorPorcentagem.textContent = `${progressoAtual}%`;
        progressoCircular.style.background = `conic-gradient(#0ea5e9 ${progressoAtual * 3.6}deg, #e2e8f0 ${progressoAtual * 3.6}deg)`;
        
        if (progressoAtual >= porcentagemAlvo) {
            clearInterval(intervalo);
            bancoCartoes[cartaoAtivo] -= valorSaque;
            volumeSaques += valorSaque;
            
            resultadoSaque.forEach(item => {
                contadorNotasGlobal[item.nota] += item.qtd;
                const p = document.createElement("p");
                p.innerHTML = `<span>Notas de R$ ${item.nota}:</span> <strong>${item.qtd}</strong>`;
                outResp.appendChild(p);
            });
            
            adicionarLog(`SAQUE: Retirada de -R$ ${valorSaque} concluída no [${cartaoAtivo}].`, "log-saque");
            atualizarTela();
            inValor.value = "";
        }
    }, 10);
});

// --- FUNÇÕES EXCLUSIVAS DO INJETOR ADMIN ---
btnCriarCartao.addEventListener("click", () => {
    if (!administradorAutenticado) return;
    const nome = addNome.value.trim();
    const saldo = Number(addSaldo.value);
    
    if (!nome || saldo < 0) return alert("Preencha o nome da bandeira e um saldo válido.");
    if (bancoCartoes[nome]) return alert("Este perfil de teste já existe.");
    
    bancoCartoes[nome] = saldo;
    adicionarLog(`CONFIG: Novo cartão de testes [${nome}] adicionado com R$ ${saldo}.`, "log-sistema");
    atualizarTela();
    addNome.value = "";
    addSaldo.value = "";
});

btnSimularErro.addEventListener("click", () => {
    if (!administradorAutenticado) return;
    falhaMecanicaAtiva = true;
    adicionarLog("CRÍTICO: Simulação de erro ativada. Impressora mecânica travada.", "log-sistema");
    alert("Simulação agendade! O proximo comando de resgate acionara o travamento");
});

btnResetarTudo.addEventListener("click", () => {
    if (!administradorAutenticado) return;
    if (confirm("Deseja apagar os testes e resetar aos valores de fábrica?")) {
        localStorage.clear();
        bancoCartoes = padraoCartoes;
        contadorNotasGlobal = padraoNotas;
        cartaoAtivo = Object.keys(bancoCartoes)[0];
        volumeSaques = 0;
        historicoLogs = ["[SISTEMA] Reinicialização completa efetuada pelo Dev."];
        outResp.innerHTML = "";
        administradorAutenticado = false;
        btnAutenticar.textContent = " Desbloquear Admin";
        btnAutenticar.className = "btn-autenticar";
        gerenciarBloqueioAdmin();
        atualizarTela();
        renderizarLogs();
    }
});

// --- INICIALIZAÇÃO DE HARDWARE ---
atualizarTela();
renderizarLogs();