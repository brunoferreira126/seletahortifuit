// Exibir notificações
function exibirNotificacao(mensagem, tipo = 'success') {
    const notificacao = document.getElementById('notificacao');
    if (!notificacao) return;
    notificacao.textContent = mensagem;
    notificacao.style.display = 'block';
    notificacao.className = `notificacao ${tipo}`;
    setTimeout(() => notificacao.style.display = 'none', 3000);
}

// Validar formulário de cadastro
function validarFormularioCadastro(data) {
    const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

    if (!data.nome || data.nome.length < 3) {
        alert('O nome deve ter pelo menos 3 caracteres.');
        return false;
    }
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
        alert('Insira um email válido.');
        return false;
    }
    if (!data.telefone || !telefoneRegex.test(data.telefone)) {
        alert('Insira um telefone válido no formato (99) 99999-9999.');
        return false;
    }
    if (!data.enderecoRua || data.enderecoRua.length < 3) {
        alert('A rua deve ter pelo menos 3 caracteres.');
        return false;
    }
    if (!data.enderecoNumero || data.enderecoNumero <= 0) {
        alert('O número do endereço deve ser maior que 0.');
        return false;
    }
    return true;
}

// Finalizar Cadastro
function finalizarCadastro() {
    const cadastroForm = document.getElementById('cadastro-form');
    const formData = new FormData(cadastroForm);
    const clienteData = Object.fromEntries(formData.entries());

    // Validar os dados do formulário
    if (!validarFormularioCadastro(clienteData)) {
        exibirNotificacao('Preencha todos os campos corretamente.', 'error');
        return;
    }

    // Salvar dados do cliente no localStorage
    localStorage.setItem('clienteData', JSON.stringify(clienteData));

    // Exibir mensagem de sucesso e redirecionar
    exibirNotificacao('Cadastro realizado com sucesso! Redirecionando para as compras...', 'success');
    setTimeout(() => {
        window.location.href = 'compras.html'; // Alterado para garantir o redirecionamento correto
    }, 2000);
}

// Gerenciamento do carrinho
let carrinho = [];

// Adicionar produto ao carrinho
function adicionarAoCarrinho(nome, preco) {
    const produtoExistente = carrinho.find(item => item.nome === nome);

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
        produtoExistente.total = produtoExistente.quantidade * produtoExistente.preco;
    } else {
        carrinho.push({ nome, preco, quantidade: 1, total: preco });
    }

    atualizarCarrinho();
    salvarCarrinho();
    exibirNotificacao(`Produto "${nome}" adicionado ao carrinho.`);
}

// Remover produto do carrinho
function removerDoCarrinho(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome);
    atualizarCarrinho();
    salvarCarrinho();
    exibirNotificacao(`Produto "${nome}" removido do carrinho.`);
}

// Atualizar visualização do carrinho
function atualizarCarrinho() {
    const tabelaCarrinho = document.getElementById('tabela-carrinho');
    if (!tabelaCarrinho) return;

    tabelaCarrinho.innerHTML = '';
    let totalPedido = 0;

    carrinho.forEach(item => {
        totalPedido += item.total;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>R$${item.preco.toFixed(2)}</td>
            <td>R$${item.total.toFixed(2)}</td>
            <td><button onclick="removerDoCarrinho('${item.nome}')">Remover</button></td>
        `;
        tabelaCarrinho.appendChild(row);
    });

    document.getElementById('total').textContent = `Total: R$${totalPedido.toFixed(2)}`;
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Finalizar Pedido
function finalizarPedido() {
    if (carrinho.length === 0) {
        exibirNotificacao('O carrinho está vazio. Adicione produtos antes de finalizar o pedido.', 'error');
        return;
    }

    const totalPedido = carrinho.reduce((total, item) => total + item.total, 0);

    // Restringir pedidos com valor inferior a R$60,00
    if (totalPedido < 60) {
        exibirNotificacao('O valor mínimo do pedido é de R$60,00. Adicione mais itens para finalizar.', 'error');
        return;
    }

    // Captura os dados do cliente
    const clienteData = JSON.parse(localStorage.getItem('clienteData')) || {};

    // Montar pedido
    const pedido = {
        id: Date.now(),
        cliente: clienteData,
        itens: carrinho.map(item => ({
            nome_produto: item.nome,
            preco: item.preco,
            quantidade: item.quantidade,
            total: item.total,
        })),
        totalPedido: totalPedido.toFixed(2),
    };

    gerarPlanilha(pedido);
    exibirNotificacao('Pedido finalizado com sucesso! A planilha foi baixada.', 'success');
}

// Gerar Planilha
function gerarPlanilha(pedido) {
    try {
        const cliente = pedido.cliente || {};
        const itens = pedido.itens;

        // Preparar Dados do Cliente
        const clienteInfo = cliente.nome
            ? [
                { Campo: 'Nome', Valor: cliente.nome || '' },
                { Campo: 'Email', Valor: cliente.email || '' },
                { Campo: 'Telefone', Valor: cliente.telefone || '' },
                { Campo: 'Cidade', Valor: cliente.cidade || '' },
                { Campo: 'Endereço', Valor: `${cliente.enderecoRua || ''}, ${cliente.enderecoNumero || ''}, ${cliente.complemento || ''}` },
                { Campo: 'Referência', Valor: cliente.referencia || '' },
              ]
            : [{ Campo: 'Informações do Cliente', Valor: 'Não fornecido' }];

        // Preparar Itens do Pedido
        const itensInfo = itens.map(item => ({
            Produto: item.nome_produto,
            Quantidade: item.quantidade,
            Preço: item.preco.toFixed(2),
            Total: item.total.toFixed(2),
        }));

        // Preparar Resumo do Pedido
        const resumo = [
            { Campo: 'Total do Pedido', Valor: `R$${pedido.totalPedido}` },
        ];

        // Criar Workbook e organizar as planilhas
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clienteInfo, { header: ['Campo', 'Valor'] }), 'Dados do Cliente');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itensInfo, { header: ['Produto', 'Quantidade', 'Preço', 'Total'] }), 'Itens do Pedido');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumo, { header: ['Campo', 'Valor'] }), 'Resumo do Pedido');

        // Baixar Planilha
        XLSX.writeFile(workbook, `Pedido_${pedido.id}.xlsx`);
    } catch (error) {
        console.error(error);
        exibirNotificacao("Erro ao gerar planilha.", "error");
    }
}

// Carregar carrinho ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedCarrinho = localStorage.getItem('carrinho');
    if (savedCarrinho) {
        carrinho = JSON.parse(savedCarrinho);
        atualizarCarrinho();
    }
});
