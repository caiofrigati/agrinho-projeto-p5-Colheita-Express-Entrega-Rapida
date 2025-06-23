// Variáveis globais do jogo
let caminhao;
let produtosCampo = [];
let pedidosCidade = [];
let pontuacao = 0;
let entregas = 0;
const ENTREGAS_NECESSARIAS = 10;
let tempoRestante = 60;
let estadoJogo = "inicio"; // "inicio", "jogando", "vitoria", "derrota"
let ultimoTempo = 0;
let produtosDisponiveis = [
    { nome: "Maçã", cor: "#FF0000", valor: 10, velocidadeQueda: 2 },
    { nome: "Banana", cor: "#FFFF00", valor: 8, velocidadeQueda: 1.5 },
    { nome: "Laranja", cor: "#FFA500", valor: 12, velocidadeQueda: 2.2 },
    { nome: "Uva", cor: "#6A0DAD", valor: 15, velocidadeQueda: 1.8 },
    { nome: "Morango", cor: "#FF1493", valor: 20, velocidadeQueda: 2.5 }
];

function setup() {
    let canvas = createCanvas(800, 500);
    canvas.parent('game-container');
    
    caminhao = {
        x: width / 2,
        y: height - 80,
        largura: 80,
        altura: 60,
        velocidade: 5,
        carregando: null
    };
    
    criarLegendaProdutos();
    
    document.getElementById('start-btn').addEventListener('click', function() {
        estadoJogo = "jogando";
        document.getElementById('start-screen').classList.add('hidden');
        ultimoTempo = millis();
    });
    
    document.getElementById('restart-btn').addEventListener('click', function() {
        reiniciarJogo();
        document.getElementById('win-screen').classList.add('hidden');
    });
}

function criarLegendaProdutos() {
    let legend = document.getElementById('product-legend');
    legend.innerHTML = '';
    
    produtosDisponiveis.forEach(produto => {
        let item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background-color: ${produto.cor}"></div>
            <div>${produto.nome} (${produto.valor} pts)</div>
        `;
        legend.appendChild(item);
    });
}

function draw() {
    background(135, 206, 235);
    
    // Desenhar cenário
    fill(34, 139, 34);
    rect(0, height - 150, width / 2, 150); // Campo
    
    fill(100);
    rect(width / 2, height - 150, width / 2, 150); // Cidade
    
    fill(70);
    rect(0, height - 50, width, 50); // Estrada
    
    stroke(255);
    line(width / 2, 0, width / 2, height);
    noStroke();
    
    if (estadoJogo === "jogando") {
        atualizarTempo();
        atualizarCaminhao();
        atualizarProdutos();
        verificarColisoes();
        gerenciarPedidos();
        verificarFimDeJogo();
    }
    
    desenharElementos();
}

function atualizarTempo() {
    if (millis() - ultimoTempo > 1000) {
        tempoRestante--;
        ultimoTempo = millis();
        
        if (tempoRestante <= 0) {
            estadoJogo = "derrota";
            document.getElementById('final-score').textContent = "Pontuação: " + pontuacao;
            document.getElementById('win-screen').querySelector('.title').textContent = "TEMPO ESGOTADO!";
            document.getElementById('win-screen').classList.remove('hidden');
        }
        
        document.getElementById('time').textContent = tempoRestante;
    }
}

function atualizarCaminhao() {
    if (keyIsDown(LEFT_ARROW) && caminhao.x > 0) {
        caminhao.x -= caminhao.velocidade;
    }
    if (keyIsDown(RIGHT_ARROW) && caminhao.x < width - caminhao.largura) {
        caminhao.x += caminhao.velocidade;
    }
}

function atualizarProdutos() {
    // Gera novos produtos caindo
    if (frameCount % 60 === 0 && produtosCampo.length < 8) {
        let produto = random(produtosDisponiveis);
        produtosCampo.push({
            x: random(50, width / 2 - 50),
            y: -40,
            nome: produto.nome,
            cor: produto.cor,
            valor: produto.valor,
            velocidade: produto.velocidadeQueda,
            tamanho: 40
        });
    }
    
    // Faz os produtos caírem
    for (let i = produtosCampo.length - 1; i >= 0; i--) {
        produtosCampo[i].y += produtosCampo[i].velocidade;
        
        // Remove se cair fora da tela
        if (produtosCampo[i].y > height) {
            produtosCampo.splice(i, 1);
        }
    }
}

function verificarColisoes() {
    // Verifica colisão com produtos no campo
    for (let i = produtosCampo.length - 1; i >= 0; i--) {
        if (
            caminhao.x < produtosCampo[i].x + produtosCampo[i].tamanho/2 &&
            caminhao.x + caminhao.largura > produtosCampo[i].x - produtosCampo[i].tamanho/2 &&
            caminhao.y < produtosCampo[i].y + produtosCampo[i].tamanho/2 &&
            caminhao.y + caminhao.altura > produtosCampo[i].y - produtosCampo[i].tamanho/2 &&
            !caminhao.carregando
        ) {
            caminhao.carregando = produtosCampo[i];
            produtosCampo.splice(i, 1);
            document.getElementById('score').textContent = pontuacao;
        }
    }
    
    // Verifica colisão com pedidos na cidade
    if (caminhao.carregando) {
        for (let i = pedidosCidade.length - 1; i >= 0; i--) {
            if (
                caminhao.x < pedidosCidade[i].x + 30 &&
                caminhao.x + caminhao.largura > pedidosCidade[i].x - 30 &&
                caminhao.y < pedidosCidade[i].y + 30 &&
                caminhao.y + caminhao.altura > pedidosCidade[i].y - 30
            ) {
                // Bônus por acertar o pedido correto
                if (caminhao.carregando.nome === pedidosCidade[i].produto) {
                    pontuacao += caminhao.carregando.valor * 2;
                } else {
                    pontuacao += caminhao.carregando.valor;
                }
                
                entregas++;
                caminhao.carregando = null;
                pedidosCidade.splice(i, 1);
                
                document.getElementById('score').textContent = pontuacao;
                document.getElementById('deliveries').textContent = entregas;
                break;
            }
        }
    }
}

function desenharElementos() {
    // Desenha produtos no campo
    for (let produto of produtosCampo) {
        fill(produto.cor);
        ellipse(produto.x, produto.y, produto.tamanho, produto.tamanho);
        fill(0);
        textSize(12);
        textAlign(CENTER);
        text(produto.nome, produto.x, produto.y + produto.tamanho/2 + 15);
    }
    
    // Desenha caminhão
    fill(200, 50, 50);
    rect(caminhao.x, caminhao.y, caminhao.largura, caminhao.altura, 10);
    fill(180, 180, 180);
    rect(caminhao.x + 50, caminhao.y - 20, 30, 20);
    fill(0);
    ellipse(caminhao.x + 20, caminhao.y + caminhao.altura, 20, 20);
    ellipse(caminhao.x + 60, caminhao.y + caminhao.altura, 20, 20);
    
    // Desenha carga
    if (caminhao.carregando) {
        fill(caminhao.carregando.cor);
        rect(caminhao.x + 10, caminhao.y - 30, 30, 30, 5);
    }
    
    // Desenha pedidos na cidade
    for (let pedido of pedidosCidade) {
        fill(255);
        ellipse(pedido.x, pedido.y, 60, 60);
        fill(pedido.cor);
        ellipse(pedido.x, pedido.y, 30, 30);
        fill(0);
        textSize(12);
        textAlign(CENTER);
        text(pedido.produto, pedido.x, pedido.y + 40);
    }
}

function gerenciarPedidos() {
    if (frameCount % 180 === 0 && pedidosCidade.length < 3) {
        let produto = random(produtosDisponiveis);
        pedidosCidade.push({
            x: random(width / 2 + 50, width - 50),
            y: random(100, height - 200),
            produto: produto.nome,
            cor: produto.cor
        });
    }
}

function verificarFimDeJogo() {
    if (entregas >= ENTREGAS_NECESSARIAS) {
        estadoJogo = "vitoria";
        document.getElementById('final-score').textContent = "Pontuação: " + pontuacao;
        document.getElementById('win-screen').querySelector('.title').textContent = "PARABÉNS! 🎉";
        document.getElementById('win-screen').classList.remove('hidden');
    }
}

function reiniciarJogo() {
    produtosCampo = [];
    pedidosCidade = [];
    pontuacao = 0;
    entregas = 0;
    tempoRestante = 60;
    caminhao.x = width / 2;
    caminhao.carregando = null;
    estadoJogo = "jogando";
    ultimoTempo = millis();
    
    document.getElementById('score').textContent = pontuacao;
    document.getElementById('deliveries').textContent = entregas;
    document.getElementById('time').textContent = tempoRestante;
    document.getElementById('win-screen').classList.add('hidden');
}

function keyPressed() {
    // Tecla R reinicia o jogo a qualquer momento
    if (key.toLowerCase() === 'r' && estadoJogo !== "inicio") {
        reiniciarJogo();
    }
}